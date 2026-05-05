"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Existing function to get the list
export async function getPendingMaterialRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materials_request")
    .select(`
      id,
      date,
      status,
      line_items:materials_request_line_item (
        quantity,
        to_id,
        line_number,
        materials ( description )
      )
    `)
    .eq("status", "pending") 
    .order("date", { ascending: false });

  if (error) {
    console.log("Error fetching pending requests:", error.message);
    return [];
  }
  
  return data;
}

// 2. NEW: The fulfillment action you want here
export async function logMaterialFulfillment(formData: any) {
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