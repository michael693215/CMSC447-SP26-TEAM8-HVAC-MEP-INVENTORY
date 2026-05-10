"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface FulfillmentPayload {
  dbId: string;
  date: string; // Captured from the new date input
  items: { 
    sku: string; 
    name: string; 
    quantity: number; 
    specifications: string;
  }[];
}

export async function logMaterialFulfillment({ dbId, date, items }: FulfillmentPayload) {
  try {
    const supabase = await createClient(); 

    // Step 0: Get the logged-in user to attach as the logistician
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("You must be logged in to fulfill a request.");
    }

    // Step 1: Add a new row to the fulfillment table
    const { data: fulfillmentData, error: fulfillmentError } = await supabase
      .from('fulfillment')
      .insert({
        datetime: new Date(date).toISOString(),
        logistician_id: user.id,
        request_id: dbId
      })
      .select('id')
      .single();

    if (fulfillmentError || !fulfillmentData) {
      throw new Error(`Failed to create fulfillment record: ${fulfillmentError?.message}`);
    }

    // Fetch the line items from materials_request_materials
    // We select the 'id' column so we can link it in fulfillment_materials
    const { data: lineItems, error: lineError } = await supabase
      .from('materials_request_materials')
      .select('id, sku, from_id, to_id, remaining')
      .eq('request_id', dbId);

    if (lineError || !lineItems) {
      throw new Error("Could not locate the line items for this request.");
    }

    // Loop through the items submitted from the form
    for (const formItem of items) {
      const lineItemInfo = lineItems.find(li => li.sku === formItem.sku);
      if (!lineItemInfo) continue;

      const { id: materials_request_materials_id, from_id, to_id, sku, remaining } = lineItemInfo;
      const receivedQty = formItem.quantity;

      // Step 2: Add row to fulfillment_materials linking to the exact request line item
      const { error: fmatError } = await supabase
        .from('fulfillment_materials')
        .insert({
          fulfillment_id: fulfillmentData.id,
          quantity: receivedQty,
          materials_request_materials_id: materials_request_materials_id
        });

      if (fmatError) {
        console.error("Error inserting fulfillment materials:", fmatError.message);
      }

      // Step 3: Update the location_materials table
      // A. DEDUCT from Source Location
      const { data: sourceInv } = await supabase
        .from('location_materials')
        .select('id, quantity')
        .eq('location_id', from_id)
        .eq('sku', sku)
        .single();

      if (sourceInv) {
        await supabase
          .from('location_materials')
          .update({ quantity: sourceInv.quantity - receivedQty })
          .eq('id', sourceInv.id);
      }

      // B. ADD to Destination Location
      const { data: destInv } = await supabase
        .from('location_materials')
        .select('id, quantity')
        .eq('location_id', to_id)
        .eq('sku', sku)
        .maybeSingle();

      if (destInv) {
        await supabase
          .from('location_materials')
          .update({ quantity: destInv.quantity + receivedQty })
          .eq('id', destInv.id);
      } else {
        await supabase
          .from('location_materials')
          .insert({
            location_id: to_id,
            sku: sku,
            quantity: receivedQty
          });
      }

      // Step 4: Decrement the remaining column in materials_request_materials
      const newRemaining = remaining - receivedQty;
      await supabase
        .from('materials_request_materials')
        .update({ remaining: newRemaining })
        .eq('id', materials_request_materials_id);

      // Update our local array tracking so we can evaluate Step 5 correctly
      lineItemInfo.remaining = newRemaining;
    }

    // Step 5: Check if the entire request is completed
    // If every single item attached to this request now has a remaining value of 0 (or less)
    const isFullyCompleted = lineItems.every(li => li.remaining <= 0);

    if (isFullyCompleted) {
      const { error: updateError } = await supabase
        .from('materials_request')
        .update({ status: 'completed' }) 
        .eq('id', dbId);

      if (updateError) {
        throw new Error("Inventory moved, but failed to close out the request status.");
      }
    }

    // Clear Next.js cache so tables update instantly
    revalidatePath('/pending-requests');
    revalidatePath('/materials-requests');

    return { success: true };

  } catch (error: any) {
    console.error("Fulfillment Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}