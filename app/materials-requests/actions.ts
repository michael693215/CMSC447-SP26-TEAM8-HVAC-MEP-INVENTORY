"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMaterialRequests() {
  const supabase = await createClient();

  // 1. Fetch the raw requests
  const { data, error } = await supabase
    .from("materials_request_materials")
    .select(`
      request_id,
      from_id,
      to_id,
      materials_request!inner (
        status
      )
    `);

  if (error) {
    console.log("Error fetching requests:", error.message);
    return [];
  }

  // 2. Fetch Locations to map IDs to our newly fixed Names!
  const locations = await getLocations();
  const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));

  // 3. Format the response to include the actual names instead of IDs
  return data.map((item: any) => ({
    request_id: item.request_id,
    from_name: locationMap.get(item.from_id) || "Unknown Location", 
    to_name: locationMap.get(item.to_id) || "Unknown Location",     
    status: item.materials_request.status 
  }));
}

export async function getLocations() {
  const supabase = await createClient();

  // Just grab the ID and your new Name column!
  const { data, error } = await supabase
    .from("location")
    .select("id, name");

  if (error) {
    console.log("Error fetching locations:", error.message);
    return [];
  }

  return data.map((loc: any) => ({
    id: loc.id,
    name: loc.name || "Unnamed Location" 
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

  // 1. Get the main header AND join the employee table!
  const { data: request, error: reqError } = await supabase
    .from("materials_request")
    .select(`
      *,
      employee (
        first_name,
        last_name
      )
    `)
    .eq("id", id)
    .single();

  if (reqError || !request) return null;

  // Safely extract and format the employee's full name
  const employeeData = Array.isArray(request.employee) ? request.employee[0] : request.employee;
  const employeeName = employeeData?.first_name 
    ? `${employeeData.first_name} ${employeeData.last_name}`.trim()
    : "Unknown Employee";

  // 2. Get the connected line items
  const { data: lineItems, error: linesError } = await supabase
    .from("materials_request_materials")
    .select(`
      id,
      total,
      remaining,
      from_id,
      to_id,
      sku
    `)
    .eq("request_id", id);

  if (linesError) {
    console.error("Error fetching line items:", linesError.message);
  }

  // 3. FOOLPROOF FETCH for Materials
  const skus = Array.from(new Set(
    lineItems?.map(item => item.sku?.trim()).filter(Boolean) || []
  ));
  
  const materialsMap = new Map();

  if (skus.length > 0) {
    const { data: materialsData, error: matError } = await supabase
      .from("materials")
      .select("sku, name, description")
      .in("sku", skus);

    if (matError) {
      console.error("Error fetching materials:", matError.message);
    } else if (materialsData) {
      materialsData.forEach(mat => materialsMap.set(mat.sku.trim(), mat));
    }
  }

  // 4. Get Locations
  const locations = await getLocations();
  const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));

  // 5. Format everything for the UI
  const formattedItems = (lineItems || []).map((item: any, index: number) => {
    
    // Trim the lookup key too so it matches perfectly!
    const material = materialsMap.get(item.sku?.trim()) || {};

    return {
      line_number: index + 1, 
      quantity: item.total, 
      remaining: item.remaining, 
      sku: item.sku,
      name: material.name || "Unknown Material",
      description: material.description || "",
      from_name: locationMap.get(item.from_id) || "Unknown Source",
      to_name: locationMap.get(item.to_id) || "Unknown Destination"
    };
  });

  return {
    ...request,
    employee_name: employeeName, // <-- We append the formatted name here!
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
  const lineItems = formData.items.map((item: any) => ({
    request_id: requestData.id, 
    sku: item.sku,
    total: item.requestQty,
    remaining: item.requestQty, // Initializes remaining to the original requested amount
    from_id: formData.fromLocation, 
    to_id: formData.toLocation,
  }));

  // 3. Insert all line items at once
  const { error: lineItemsError } = await supabase
    .from("materials_request_materials")
    .insert(lineItems);

  if (lineItemsError) {
    console.log("Database Error (Lines):", lineItemsError.message);
    return { success: false, error: lineItemsError.message };
  }

  // Refresh the list page data
  revalidatePath("/materials-requests"); 
  return { success: true };
}