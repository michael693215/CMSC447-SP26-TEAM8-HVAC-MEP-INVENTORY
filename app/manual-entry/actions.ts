"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface DeliveryItem {
  id: string; 
  quantity: number; 
}

interface LogDeliveryPayload {
  poNumber: string;
  locationId: string;
  items: DeliveryItem[];
}

export async function logDeliveryFulfillment(payload: LogDeliveryPayload) {
  try {
    const supabase = await createClient();
    const cleanPoNumber = payload.poNumber.trim();
    const cleanLocationId = payload.locationId.trim();

    // 1. Fetch current PO line items
    const { data: lineItems, error: lineError } = await supabase
      .from("po_materials")
      .select("line_number, SKU, quantity, expecting")
      .eq("PO_number", cleanPoNumber);

    if (lineError || !lineItems || lineItems.length === 0) {
      throw new Error(`Could not find active line items for PO: ${cleanPoNumber}. Check your SELECT policies.`);
    }

    // 2. Process each delivered item
    for (const deliveredItem of payload.items) {
      const receivedQty = deliveredItem.quantity;
      if (receivedQty <= 0) continue; 

      const lineItem = lineItems.find(li => li.line_number.toString() === deliveredItem.id);
      if (!lineItem) continue;

      // A. Decrement the 'expecting' amount in po_materials
      const currentExpecting = lineItem.expecting ?? lineItem.quantity;
      const newExpectingQty = Math.max(0, currentExpecting - receivedQty);

      const { data: updatedLine, error: updateLineError } = await supabase
        .from("po_materials")
        .update({ expecting: newExpectingQty })
        .eq("PO_number", cleanPoNumber)
        .eq("line_number", lineItem.line_number)
        .select(); // <--- Forces Supabase to return the row so we know it didn't silently fail

      if (updateLineError || !updatedLine || updatedLine.length === 0) {
        throw new Error(`Failed to update expecting amount for line ${lineItem.line_number}. Check UPDATE RLS policies.`);
      }

      // B. ADD to location_inventory
      const { data: invRecord } = await supabase
        .from("location_inventory")
        .select("id, quantity")
        .eq("location_id", cleanLocationId)
        .eq("SKU", lineItem.SKU)
        .maybeSingle();

      if (invRecord) {
        const { data: updatedInv, error: invUpdateErr } = await supabase
          .from("location_inventory")
          .update({ quantity: invRecord.quantity + receivedQty })
          .eq("id", invRecord.id)
          .select();

        if (invUpdateErr || !updatedInv || updatedInv.length === 0) throw new Error("Failed to update location_inventory. Check UPDATE RLS.");
      } else {
        const { error: invInsertErr } = await supabase
          .from("location_inventory")
          .insert({ location_id: cleanLocationId, SKU: lineItem.SKU, quantity: receivedQty });
          
        if (invInsertErr) throw new Error("Failed to insert into location_inventory. Check INSERT RLS.");
      }

      // C. ADD to global materials table
      const { data: materialRecord } = await supabase
        .from("materials")
        .select("quantity")
        .eq("SKU", lineItem.SKU)
        .single();

      if (materialRecord) {
        const { data: updatedMat, error: matUpdateErr } = await supabase
          .from("materials")
          .update({ quantity: materialRecord.quantity + receivedQty })
          .eq("SKU", lineItem.SKU)
          .select();
          
        if (matUpdateErr || !updatedMat || updatedMat.length === 0) throw new Error("Failed to update materials table. Check UPDATE RLS.");
      }
    }

    // 3. Check if the entire Purchase Order is completely fulfilled
    const { data: remainingItems } = await supabase
      .from("po_materials")
      .select("quantity, expecting")
      .eq("PO_number", cleanPoNumber);

    if (remainingItems) {
      const isFullyCompleted = remainingItems.every(item => {
        const exp = item.expecting ?? item.quantity;
        return exp <= 0;
      });

      if (isFullyCompleted) {
        await supabase
          .from("purchase_order")
          .update({ status: "Received" })
          .eq("PO_number", cleanPoNumber);
      }
    }

    // 4. Clear cache to update UI
    revalidatePath("/pending-deliveries");
    revalidatePath("/purchase-orders");
    revalidatePath("/inventory");

    return { success: true };

  } catch (error: any) {
    console.error("Delivery Fulfillment Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}