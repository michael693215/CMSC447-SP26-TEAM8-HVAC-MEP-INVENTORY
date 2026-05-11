"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface FulfillmentPayload {
  dbId: string;
  date: string; 
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

    // Step 0: Get the logged-in user
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

    // Fetch the line items 
    const { data: lineItems, error: lineError } = await supabase
      .from('materials_request_materials')
      .select('id, sku, from_id, to_id, remaining')
      .eq('request_id', dbId);

    if (lineError || !lineItems) {
      throw new Error("Could not locate the line items for this request.");
    }

    const processedSkus = new Set<string>();

    // Loop through the items submitted from the form
    for (const formItem of items) {
      const receivedQty = Number(formItem.quantity);
      if (isNaN(receivedQty) || receivedQty <= 0) continue;

      const cleanSku = formItem.sku.trim().toLowerCase();
      const lineItemInfo = lineItems.find(li => li.sku?.trim().toLowerCase() === cleanSku);
      
      if (!lineItemInfo) continue;

      const { id: materials_request_materials_id, from_id, to_id, remaining } = lineItemInfo;

      // 1. Add row to fulfillment_materials
      await supabase
        .from('fulfillment_materials')
        .insert({
          fulfillment_id: fulfillmentData.id,
          quantity: receivedQty,
          materials_request_materials_id: materials_request_materials_id
        });

      // 2. Decrement the remaining column on the request
      const newRemaining = Number(remaining) - receivedQty;
      await supabase
        .from('materials_request_materials')
        .update({ remaining: newRemaining })
        .eq('id', materials_request_materials_id);

      lineItemInfo.remaining = newRemaining;

      // ==========================================
      // PHYSICAL INVENTORY
      // ==========================================
      if (!processedSkus.has(cleanSku)) {
        
        const totalReceivedForSku = items
          .filter(i => i.sku.trim().toLowerCase() === cleanSku)
          .reduce((sum, i) => sum + Number(i.quantity), 0);

        // A. DEDUCT from Source Location (Working fine)
        const { data: sourceInvArr } = await supabase
          .from('location_materials')
          .select('id, quantity')
          .eq('location_id', from_id)
          .ilike('sku', formItem.sku.trim()) 
          .limit(1);

        const sourceInv = sourceInvArr?.[0];

        if (sourceInv) {
          const newSourceQty = Number(sourceInv.quantity) - totalReceivedForSku;
          if (newSourceQty <= 0) {
            await supabase.from('location_materials').delete().eq('id', sourceInv.id);
          } else {
            await supabase.from('location_materials').update({ quantity: newSourceQty }).eq('id', sourceInv.id);
          }
        }

        // B. ADD to Destination Location (Where the double-add bug is)
        const { data: destInvArr } = await supabase
          .from('location_materials')
          .select('id, quantity')
          .eq('location_id', to_id)
          .ilike('sku', formItem.sku.trim())
          .limit(1);

        const destInv = destInvArr?.[0];

        if (destInv) {
          const newDestQty = Number(destInv.quantity) + totalReceivedForSku;
          
          // We do the standard addition
          await supabase.from('location_materials').update({ quantity: newDestQty }).eq('id', destInv.id);
          

          await supabase.from('location_materials').update({ quantity: newDestQty - totalReceivedForSku }).eq('id', destInv.id);
          
        } else {
          // If it doesn't exist yet, we add it
          await supabase.from('location_materials').insert({
            location_id: to_id,
            sku: formItem.sku.trim(),
            quantity: totalReceivedForSku
          });
          

          await supabase.from('location_materials').update({ quantity: 0 }).eq('location_id', to_id).eq('sku', formItem.sku.trim());
        }

        processedSkus.add(cleanSku);
      }
    }

    // Step 5: Check if the entire request is completed
    const isFullyCompleted = lineItems.every(li => li.remaining <= 0);

    if (isFullyCompleted) {
      await supabase
        .from('materials_request')
        .update({ status: 'completed' }) 
        .eq('id', dbId);
    }

    revalidatePath('/pending-requests');
    revalidatePath('/materials-requests');

    return { success: true };

  } catch (error: any) {
    console.error("Fulfillment Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}