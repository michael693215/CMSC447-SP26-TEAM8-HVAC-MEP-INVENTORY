"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface POItem {
  productName: string;
  qty: number;
  specs: string;
}

interface SubmitPOPayload {
  poNumber: string;
  date: string;
  locationId: string; // The UUID from the dropdown
  items: POItem[];
}

export async function submitPurchaseOrder(payload: SubmitPOPayload) {
  try {
    const supabase = await createClient();

    // 1. Insert the Purchase Order Header
    const { error: poError } = await supabase
      .from("purchase_order")
      .insert({
        PO_number: payload.poNumber,
        date: payload.date,
        location_id: payload.locationId, // Using your newly fixed column!
        status: "Pending"
      });

    if (poError) {
      throw new Error(`Failed to create PO header: ${poError.message}`);
    }

    // 2. Loop through the items to create the Materials and PO Line Items
    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      let generatedSKU: string;

      // A. Check if the material already exists (case-insensitive)
      const { data: existingMaterials, error: searchError } = await supabase
        .from("materials")
        .select("SKU")
        .ilike("description", item.productName.trim())
        .limit(1);

      if (searchError) {
        throw new Error(`Search error for ${item.productName}: ${searchError.message}`);
      }

      if (existingMaterials && existingMaterials.length > 0) {
        // Material exists! Use the existing SKU.
        generatedSKU = existingMaterials[0].SKU;
      } else {
        // Material doesn't exist! Create a new one.
        const { data: newMaterial, error: materialError } = await supabase
          .from("materials")
          .insert({
            description: item.productName.trim(),
            quantity: 0 
          })
          .select("SKU")
          .single();

        if (materialError || !newMaterial) {
          throw new Error(`Material creation error: ${materialError?.message}`);
        }
        
        generatedSKU = newMaterial.SKU;
      }

      // B. Insert the line item into po_materials
      const { error: poMaterialError } = await supabase
        .from("po_materials")
        .insert({
          PO_number: payload.poNumber,
          line_number: i + 1,
          SKU: generatedSKU,
          product_name: item.productName.trim(),
          quantity: item.qty,
          expecting: item.qty // Set expecting equal to quantity!
        });

      if (poMaterialError) {
        throw new Error(`Failed to insert PO line item ${item.productName}: ${poMaterialError.message}`);
      }
    }

    // 3. Clear the cache so your lists update instantly
    revalidatePath("/purchase-orders"); 
    revalidatePath("/inventory");

    return { success: true };

  } catch (error: any) {
    console.error("PO Submission Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}