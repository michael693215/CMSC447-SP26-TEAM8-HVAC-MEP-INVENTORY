"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMaterialRequests() {
  const supabase = await createClient();

  // FIXED: Removed the fake 'request_id' column from the select query.
  // FIXED: Changed the line item count to look for 'line_number' based on your screenshot!
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

export async function createMaterialRequest(formData: any) {
  const supabase = await createClient();

  // FIXED: No more fake ID generation! 
  // We just insert the date/status and let Supabase generate the real UUID.
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

  // FIXED: We take the real UUID 'id' from step 1, and insert it as the 'request_id' here!
  const lineItems = formData.items.map((item: any, index: number) => ({
    request_id: requestData.id, 
    line_number: index + 1,
    SKU: item.sku,
    quantity: item.requestQty,
    from_id: formData.fromLocation, 
    to_id: formData.toLocation,
  }));

  const { error: lineItemsError } = await supabase
    .from("materials_request_line_item")
    .insert(lineItems);

  if (lineItemsError) {
    console.log("Database Error (Lines):", lineItemsError.message);
    return { success: false, error: lineItemsError.message };
  }

  revalidatePath("/materials-requests"); 
  return { success: true };
}