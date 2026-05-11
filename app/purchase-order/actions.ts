"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getActiveLocations() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('location')
    .select('id, name')
    .order('name');

  if (error) {
    console.error("Error fetching locations:", error.message);
    return [];
  }

  return data || [];
}

interface POItem {
  productName: string;
  qty: number;
  specs: string;
}

interface POPayload {
  poNumber: string;
  date: string;
  locationId: string;
  items: POItem[];
}

export async function submitPurchaseOrder(payload: POPayload) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("You must be logged in to create a Purchase Order.");

    // 1. Manually insert the Header first
    const { error: poError } = await supabase
      .from("purchase_order")
      .insert({
        po_number: payload.poNumber,
        date: payload.date,
        pm_id: user.id,
        location_id: payload.locationId,
        status: "pending", 
      });

    if (poError) {
      if (poError.code === "23505") throw new Error("A Purchase Order with this number already exists.");
      throw new Error(`PO Header Error: ${poError.message}`);
    }

    // 2. Deduplicate items just in case the form sent two lines for the exact same product name
    const aggregatedItems = payload.items.reduce((acc, current) => {
      const name = current.productName.trim().toLowerCase();
      const existing = acc.find(i => i.productName.trim().toLowerCase() === name);
      if (existing) {
        existing.qty += Number(current.qty);
      } else {
        acc.push({ ...current, qty: Number(current.qty) });
      }
      return acc;
    }, [] as POItem[]);

    const poMaterialsToInsert = [];

    // 3. Loop through and look up (or create) the SKUs
    for (const item of aggregatedItems) {
      const cleanName = item.productName.trim();
      
      // Check if it already exists
      const { data: existingMaterial } = await supabase
        .from("materials")
        .select("sku")
        .ilike("name", cleanName)
        .limit(1)
        .maybeSingle();

      let skuToUse = existingMaterial?.sku;

      // If the material doesn't exist, let the DB generate the SKU!
      if (!skuToUse) {
        const { data: newMaterial, error: matError } = await supabase
          .from("materials")
          .insert({
            name: cleanName,
            description: item.specs || ""
          })
          .select("sku") // <--- Ask Supabase to hand back the auto-generated SKU
          .single();
          
        if (matError) throw new Error(`Material Insert Error: ${matError.message}`);
        
        skuToUse = newMaterial.sku;
      }

      // Add it to our batch payload array
      poMaterialsToInsert.push({
        po_number: payload.poNumber,
        sku: skuToUse,
        total: item.qty,
        remaining: item.qty
      });
    }

    // 4. Batch Insert the PO Line Items
    if (poMaterialsToInsert.length > 0) {
      const { error: pomError } = await supabase
        .from('purchase_order_materials')
        .insert(poMaterialsToInsert);

      if (pomError) {
        // If line items fail, rollback the header to prevent ghost orders
        await supabase.from("purchase_order").delete().eq("po_number", payload.poNumber);
        throw new Error(`Line Items Error: ${pomError.message}`);
      }
    }

    // Refresh the table views
    revalidatePath("/purchase-orders");
    revalidatePath("/inventory");

    return { success: true };
  } catch (error: any) {
    console.error("Submit PO Error:", error);
    return { success: false, error: error.message };
  }
}