'use server'
import { createClient } from '@/lib/supabase/server'
import { Role } from '@/lib/types'
import { revalidatePath } from "next/cache";

export async function getUserRole() : Promise<Role> {
    const supabase = await createClient();
    const { data: { user } }  = await supabase.auth.getUser();
    return user?.app_metadata?.permissions || 'unassigned';
}

export async function getMaterialRequests() {
  const supabase = await createClient();

  // 1. Fetch the raw requests from the HEADER table, not the line items!
  const { data, error } = await supabase
    .from("materials_request")
    .select(`
      id,
      status,
      date,
      items:materials_request_materials (
        from_id,
        to_id
      )
    `)
    .order('date', { ascending: false }); // Puts the newest requests at the top

  if (error) {
    console.log("Error fetching requests:", error.message);
    return [];
  }

  // 2. Fetch Locations to map IDs to our newly fixed Names
  const locations = await getLocations();
  const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));

  // 3. Format the response to include the actual names instead of IDs
  return data.map((req: any) => {
    // Since all items in a single request share the same origin/destination, 
    // we just look at the first item in the array to grab the location IDs!
    const firstItem = req.items && req.items.length > 0 ? req.items[0] : {};

    return {
      request_id: req.id, // Now it maps strictly 1-to-1 with the actual request
      from_name: locationMap.get(firstItem.from_id) || "Unknown Location", 
      to_name: locationMap.get(firstItem.to_id) || "Unknown Location",     
      status: req.status 
    };
  });
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
  
  // 1. Fetch from the NEW location_materials table (No more location_inventory!)
  const { data: locMaterials, error } = await supabase
    .from("location_materials")
    .select(`
      id,
      quantity,
      sku,
      location (
        name
      )
    `)
    .eq("location_id", locationId)
    .gt("quantity", 0);

  if (error) {
    console.log("Error fetching location materials:", error.message);
    return [];
  }

  // 2. FOOLPROOF FETCH: Grab the actual names from the materials table
  const skus = Array.from(new Set(
    locMaterials?.map(item => item.sku?.trim()).filter(Boolean) || []
  ));
  
  const materialsMap = new Map();

  if (skus.length > 0) {
    const { data: materialsData, error: matError } = await supabase
      .from("materials")
      .select("sku, name")
      .in("sku", skus);

    if (matError) {
      console.error("Error fetching material names:", matError.message);
    } else if (materialsData) {
      materialsData.forEach(mat => materialsMap.set(mat.sku.trim(), mat));
    }
  }

  // 3. Stitch them together so your form has the SKU, Name, and Max Quantity!
  return locMaterials?.map((item: any) => {
    const material = materialsMap.get(item.sku?.trim()) || {};
    return {
      location_name: item.location?.name,
      sku: item.sku,
      available_quantity: item.quantity,
      name: material.name || "Unknown Material",
      display_label: `${material.name || "Unknown Material"} (Available: ${item.quantity})`
    };
  }) || [];
}

export async function getMaterialRequestById(id: string) {
  const supabase = await createClient();

  // 1. Get the main header AND join the employee table
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

  // 2. NEW: Fetch the latest fulfillment date for this request
  const { data: fulfillments } = await supabase
    .from("fulfillment")
    .select("datetime")
    .eq("request_id", id)
    .order("datetime", { ascending: false })
    .limit(1);
    
  const fulfillmentDate = fulfillments && fulfillments.length > 0 ? fulfillments[0].datetime : null;

  // 3. Get the connected line items
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

  if (linesError) console.error("Error fetching line items:", linesError.message);

  // 4. FOOLPROOF FETCH for Materials
  const skus = Array.from(new Set(
    lineItems?.map(item => item.sku?.trim()).filter(Boolean) || []
  ));
  
  const materialsMap = new Map();

  if (skus.length > 0) {
    const { data: materialsData, error: matError } = await supabase
      .from("materials")
      .select("sku, name, description")
      .in("sku", skus);

    if (matError) console.error("Error fetching materials:", matError.message);
    else if (materialsData) materialsData.forEach(mat => materialsMap.set(mat.sku.trim(), mat));
  }

  const locations = await getLocations();
  const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));

  // 5. Format everything for the UI
  const formattedItems = (lineItems || []).map((item: any, index: number) => {
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
    employee_name: employeeName, 
    fulfillment_date: fulfillmentDate, // <-- WE PASS THE NEW DATE HERE!
    items: formattedItems
  };
}

export async function getDeliveryById(id : string) {
  const supabase = await createClient();

  // 1. Fetch the Fulfillment Header (Fetching po_number and request_id here)
  const { data: fulfillment, error: fulError } = await supabase
    .from("fulfillment")
    .select(`
      *,
      po_number,     
      request_id,    
      logistician:logistician_id (
        first_name,
        last_name
      ),
      location:location_id (
        name
      )
    `)
    .eq("id", id)
    .single();

  if (fulError || !fulfillment) return null;

  // 2. Format Header Info
  const logiData = Array.isArray(fulfillment.logistician) ? fulfillment.logistician : fulfillment.logistician;
  
  // 3. Logic to determine the "Source Document"
  const sourceDocument = fulfillment.po_number 
    ? `PO: ${fulfillment.po_number}` 
    : `${fulfillment.request_id}`;

  // 4. Fetch Line Items
  const { data: lineItems, error: linesError } = await supabase
    .from("fulfillment_materials")
    .select(`
      id,
      quantity,
      po_item:po_materials_id ( sku ),
      mr_item:materials_request_materials_id ( sku )
    `)
    .eq("fulfillment_id", id);

  // ... (Material mapping logic with the index as discussed) ...
  const rawItems = (lineItems || []).map(item => {
    const poItem = Array.isArray(item.po_item) ? item.po_item[0] : item.po_item;
    const mrItem = Array.isArray(item.mr_item) ? item.mr_item[0] : item.mr_item;
    return { ...item, sku: poItem?.sku || mrItem?.sku };
  });
    // 2. We fetch the actual Material details (Name, Desc) using those SKUs
    const skus = Array.from(new Set(rawItems.map(i => i.sku).filter(Boolean)));
    const materialsMap = new Map();
    if (skus.length > 0) {
    const { data: mats } = await supabase.from("materials").select("sku, name, description").in("sku", skus);
    mats?.forEach(m => materialsMap.set(m.sku, m));
    }

    // 3. THIS is where formattedItems is born
    const formattedItems = rawItems.map((item, index) => {
    const material = materialsMap.get(item.sku) || {};
    return {
        line_number: index + 1,
        id: item.id,
        quantity: item.quantity,
        sku: item.sku || "N/A",
        name: material.name || "Unknown Material",
        description: material.description || ""
    };
    });
  // (Final format)
  return {
    ...fulfillment,
    logistician_name: `${logiData?.first_name || ''} ${logiData?.last_name || ''}`.trim(),
    location_name: fulfillment.location?.name || "Unknown",
    source_label: sourceDocument, // Helpful for the UI header
    items: formattedItems // The list of materials we built
  };
}

export async function getDeliveryHistory(id : string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fulfillment")
    .select(`
      id,
      datetime, 
      po_number,
      request_id,
      employee (
        first_name,
        last_name
      ),
      location (
        name
      )
    `)
    .eq("location_id", id)
    .order("datetime", { ascending: true });

  if (error) {
    console.error("Error fetching delivery history:", error.message);
    return [];
  }

  // Flatten the response so it matches your Fulfillment type exactly
  return data.map((f: any) => ({
    id: f.id,
    location_name: f.location.name,
    date: f.datetime, // This is the string from Supabase
    po_number: f.po_number,
    request_id: f.request_id,
    // Unpacking the joined profile data
    first_name: f.employee?.first_name || "System",
    last_name: f.employee?.last_name || "User",
  }));
}

export async function createMaterialRequest(formData: any) {
  const supabase = await createClient();

  // 1. Get the currently logged-in user to attach as the foreman
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("Authentication Error:", authError?.message);
    return { success: false, error: "You must be logged in to create a request." };
  }

  // 2. Insert the Header
  // (Omitting 'id' triggers your private.gen_random_req() default automatically)
  const { data: requestData, error: requestError } = await supabase
    .from("materials_request")
    .insert([{ 
      date: formData.date, 
      status: "pending",
      foreman_id: user.id 
    }])
    .select("id")
    .single();

  if (requestError || !requestData) {
    console.log("Database Error (Header):", requestError?.message);
    return { success: false, error: requestError?.message };
  }

  // 3. Prepare the Line Items
  const lineItems = formData.items.map((item: any) => ({
    // (Omitting 'id' triggers gen_random_uuid() automatically)
    request_id: requestData.id, 
    sku: item.sku,
    total: item.requestQty,
    remaining: item.requestQty, 
    from_id: formData.fromLocation, 
    to_id: formData.toLocation,
  }));

  // 4. Insert all line items at once
  const { error: lineItemsError } = await supabase
    .from("materials_request_materials")
    .insert(lineItems);

  // 5. THE ROLLBACK SAFEGUARD
  if (lineItemsError) {
    console.log("Database Error (Lines):", lineItemsError.message);
    
    // If the items failed to save, instantly delete the header we just made so it doesn't leave a ghost request!
    await supabase.from("materials_request").delete().eq("id", requestData.id);
    
    return { success: false, error: lineItemsError.message };
  }

  // Refresh the list page data
  revalidatePath("/materials-requests"); 
  return { success: true };
}
