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

    // 1. Fetch the line items including the new 'expecting' column
    const { data: lineItems, error: lineError } = await supabase
      .from('materials_request_line_item')
      .select('line_number, SKU, from_id, to_id, quantity, expecting')
      .eq('request_id', dbId);

    if (lineError || !lineItems) {
      throw new Error(`Line Item Error: ${lineError?.message || "Not found"}`);
    }

    // 2. Loop through the items submitted from the form to update inventory & line items
    for (const formItem of items) {
      const lineItemInfo = lineItems.find(li => li.line_number.toString() === formItem.id);
      
      if (!lineItemInfo) continue; 

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
        const { error: deductError } = await supabase
          .from('location_inventory')
          .update({ quantity: sourceInv.quantity - receivedQty })
          .eq('id', sourceInv.id);

        if (deductError) throw new Error(`Failed to deduct source inventory: ${deductError.message}`);
      }

      // B. ADD to Destination Location (to_id)
      const { data: destInv } = await supabase
        .from('location_inventory')
        .select('id, quantity')
        .eq('location_id', to_id)
        .eq('SKU', SKU)
        .maybeSingle(); 

      if (destInv) {
        const { error: addError } = await supabase
          .from('location_inventory')
          .update({ quantity: destInv.quantity + receivedQty })
          .eq('id', destInv.id);
          
        if (addError) throw new Error(`Failed to add destination inventory: ${addError.message}`);
      } else {
        const { error: insertError } = await supabase
          .from('location_inventory')
          .insert({
            location_id: to_id,
            SKU: SKU,
            quantity: receivedQty
          });
          
        if (insertError) throw new Error(`Failed to create new destination inventory: ${insertError.message}`);
      }

      // C. DEDUCT from the 'expecting' column in Materials Request Line Item
      // We use the expecting value if it exists, otherwise fallback to quantity
      const currentExpecting = lineItemInfo.expecting ?? lineItemInfo.quantity;
      const newExpectingQty = Math.max(0, currentExpecting - receivedQty);
      
      const { error: lineUpdateError } = await supabase
        .from('materials_request_line_item')
        .update({ expecting: newExpectingQty }) // ONLY update expecting, leave quantity alone!
        .eq('request_id', dbId)
        .eq('line_number', lineItemInfo.line_number);

      if (lineUpdateError) throw new Error(`Failed to update line item expecting balance: ${lineUpdateError.message}`);
    }

    // 3. Check if all line items are now fully fulfilled
    const { data: remainingItems, error: remainingError } = await supabase
      .from('materials_request_line_item')
      .select('quantity, expecting')
      .eq('request_id', dbId);

    if (remainingError) {
      throw new Error(`Failed to check remaining items: ${remainingError.message}`);
    }

    // A request is completed only when the 'expecting' balance for every item hits 0
    const isFullyCompleted = remainingItems.every(item => {
      const exp = item.expecting ?? item.quantity;
      return exp <= 0;
    });

    if (isFullyCompleted) {
      const { error: updateError } = await supabase
        .from('materials_request')
        .update({ status: 'completed' }) 
        .eq('id', dbId);

      if (updateError) {
        throw new Error(`Failed to update request status: ${updateError.message}`);
      }
    }

    // 4. Clear the Next.js cache
    revalidatePath('/pending-requests');
    revalidatePath('/materials-requests');
    revalidatePath('/inventory'); 

    return { success: true };

  } catch (error: any) {
    console.error("Fulfillment Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}