"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Existing function to get the list (UPDATED TO NEW SCHEMA)
export async function getPendingMaterialRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materials_request")
    .select(`
      id,
      date,
      status,
      line_items:materials_request_materials (
        total,
        remaining,
        to_id,
        sku
      )
    `)
    .eq("status", "pending") 
    .order("date", { ascending: false });

  if (error) {
    console.log("Error fetching pending requests:", error.message);
    return [];
  }

  // FOOLPROOF FETCH for Material Names
  const skus = Array.from(new Set(
    data?.flatMap(req => req.line_items.map((item: any) => item.sku?.trim())).filter(Boolean) || []
  ));
  
  const materialsMap = new Map();
  if (skus.length > 0) {
    const { data: materialsData } = await supabase
      .from("materials")
      .select("sku, name")
      .in("sku", skus);
      
    if (materialsData) {
      materialsData.forEach(mat => materialsMap.set(mat.sku.trim(), mat));
    }
  }

  // Format with material names and explicitly pass 'remaining'
  return data?.map(req => ({
    ...req,
    line_items: req.line_items.map((item: any, idx: number) => ({
      line_number: idx + 1,
      to_id: item.to_id,
      quantity: item.remaining ?? item.total,
      remaining: item.remaining, 
      total: item.total,
      name: materialsMap.get(item.sku?.trim())?.name || "Unknown Material",
      sku: item.sku
    }))
  })) || [];
}

// 2. The fulfillment action (Unchanged)
export async function logMaterialFulfillment(formData: any, location_id : string) {
  const supabase = await createClient();

  // Save the fulfillment record
  const { error: insertError } = await supabase
    .from("fulfillment")
    .insert([
      {
        request_id: formData.dbId, 
        OCR_json: formData.items,
      }
    ]);

  if (insertError) {
    console.log("Error inserting fulfillment:", insertError.message);
    return { success: false, error: insertError.message };
  }

  // Update the original Materials Request status
  const { error: updateError } = await supabase
    .from("materials_request")
    .update({ status: "Fulfilled" })
    .eq("id", formData.dbId);

  if (updateError) {
    console.log("Notice: Could not update request status:", updateError.message);
  }

  // Refresh everything so the item disappears from the "Pending" list
  revalidatePath("/pending-requests");
  revalidatePath("/materials-requests");

  return { success: true };
}