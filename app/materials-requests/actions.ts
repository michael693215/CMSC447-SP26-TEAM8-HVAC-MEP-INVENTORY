"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMaterialRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materials_request")
    .select(`
      id,
      date,
      status,
      line_items:materials_request_line_item ( line_number )
    `)
    .order("date", { ascending: false });

  if (error) {
    console.log("Error fetching requests:", error.message);
    return [];
  }
  return data;
}

export async function getLocations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("location")
    .select(`
      id,
      address:location_address (
        street_number,
        street_name,
        city
      )
    `);

  if (error) {
    console.log("Error fetching locations:", error.message);
    return [];
  }

  return data.map((loc: any) => ({
    id: loc.id,
    name: loc.address 
      ? `${loc.address.street_number} ${loc.address.street_name} (${loc.address.city})`
      : "Unnamed Location"
  }));
}

export async function getInventoryByLocation(locationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("location_inventory")
    .select(`
      id,
      quantity,
      SKU,
      materials ( description )
    `)
    .eq("location_id", locationId)
    .gt("quantity", 0);

  if (error) {
    console.log("Error fetching inventory:", error.message);
    return [];
  }
  return data;
}

export async function getMaterialRequestById(id: string) {
  const supabase = await createClient();

  // 1. Get the main header
  const { data: request, error: reqError } = await supabase
    .from("materials_request")
    .select("*")
    .eq("id", id)
    .single();

  if (reqError || !request) return null;

  // 2. Get the connected line items
  // ADDED 'expecting' to the select query
  const { data: lineItems, error: linesError } = await supabase
    .from("materials_request_line_item")
    .select(`
      line_number,
      quantity,
      expecting,
      from_id,
      to_id,
      SKU,
      materials!inner (
        description
      )
    `)
    .eq("request_id", id)
    .order("line_number", { ascending: true });

  if (linesError) {
    console.error("Error fetching line items:", linesError.message);
  }

  // 3. Get Locations to map IDs to Names
  const locations = await getLocations();
  const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));

  // 4. Format everything for the UI
  const formattedItems = (lineItems || []).map((item: any) => ({
    line_number: item.line_number,
    quantity: item.quantity,
    expecting: item.expecting, // Pass expecting to the frontend
    sku: item.SKU,
    description: item.materials?.description || "Unknown Material",
    from_name: locationMap.get(item.from_id) || "Unknown Source",
    to_name: locationMap.get(item.to_id) || "Unknown Destination"
  }));

  return {
    ...request,
    items: formattedItems
  };
}

export async function createMaterialRequest(formData: any) {
  const supabase = await createClient();

  // 1. Insert the "Header" (The main request entry)
  const { data: requestData, error: requestError } = await supabase
    .from("materials_request")
    .insert([{ 
      date: formData.date, 
      status: "pending" 
    }])
    .select("id")
    .single();

  if (requestError || !requestData) {
    console.log("Database Error (Header):", requestError?.message);
    return { success: false, error: requestError?.message };
  }

  // 2. Prepare the Line Items
  const lineItems = formData.items.map((item: any, index: number) => ({
    request_id: requestData.id, 
    line_number: index + 1,
    SKU: item.sku,
    quantity: item.requestQty,
    expecting: item.requestQty, // NEW: Expecting and Quantity start identical
    from_id: formData.fromLocation, 
    to_id: formData.toLocation,
  }));

  // 3. Insert all line items at once
  const { error: lineItemsError } = await supabase
    .from("materials_request_line_item")
    .insert(lineItems);

  if (lineItemsError) {
    console.log("Database Error (Lines):", lineItemsError.message);
    return { success: false, error: lineItemsError.message };
  }

  // Refresh the list page data
  revalidatePath("/materials-requests"); 
  return { success: true };
}