"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface FulfillmentPayload {
  dbId: string;
  items: { 
    id: string; // This is actually the line_number from the frontend
    name: string; 
    quantity: number; 
    specifications: string;
  }[];
}

export async function logMaterialFulfillment({ dbId, items }: FulfillmentPayload) {
  try {
    const supabase = await createClient(); 

    // 1. Fetch the line items. We added 'line_number' to this select statement!
    const { data: lineItems, error: lineError } = await supabase
      .from('materials_request_line_item')
      .select('line_number, SKU, from_id, to_id')
      .eq('request_id', dbId);

    if (lineError || !lineItems) {
      throw new Error("Could not locate the line items for this request.");
    }

    // 2. Loop through the items submitted from the form to update inventory
    for (const formItem of items) {
      
      // Match the form item using line_number instead of SKU
      const lineItemInfo = lineItems.find(li => li.line_number.toString() === formItem.id);
      
      if (!lineItemInfo) continue; // Skip if we can't find a matching line item

      const { from_id, to_id, SKU } = lineItemInfo;
      const receivedQty = formItem.quantity;

      // A. DEDUCT from Source Location (from_id)
      const { data: sourceInv } = await supabase
        .from('location_inventory')
        .select('id, quantity')
        .eq('location_id', from_id)
        .eq('SKU', SKU)
        .single();

      if (sourceInv) {
        await supabase
          .from('location_inventory')
          .update({ quantity: sourceInv.quantity - receivedQty })
          .eq('id', sourceInv.id);
      }

      // B. ADD to Destination Location (to_id)
      const { data: destInv } = await supabase
        .from('location_inventory')
        .select('id, quantity')
        .eq('location_id', to_id)
        .eq('SKU', SKU)
        .single();

      if (destInv) {
        // If the SKU already exists at the destination, add to it
        await supabase
          .from('location_inventory')
          .update({ quantity: destInv.quantity + receivedQty })
          .eq('id', destInv.id);
      } else {
        // If it's the first time this SKU is at this location, insert a new row
        await supabase
          .from('location_inventory')
          .insert({
            location_id: to_id,
            SKU: SKU,
            quantity: receivedQty
          });
      }
    }

    // 3. Update the overall request status to 'completed'
    const { error: updateError } = await supabase
      .from('materials_request')
      .update({ status: 'completed' }) // Changed to 'completed' per your request
      .eq('id', dbId);

    if (updateError) {
      throw new Error("Inventory moved, but failed to update the request status.");
    }

    // 4. Clear the Next.js cache so your tables reflect the changes instantly
    revalidatePath('/pending-requests');
    revalidatePath('/materials-requests');
    revalidatePath('/inventory'); 

    return { success: true };

  } catch (error: any) {
    console.error("Fulfillment Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}