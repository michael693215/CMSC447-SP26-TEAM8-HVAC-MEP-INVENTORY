"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logMaterialFulfillment(formData: any) {
  const supabase = await createClient();

  // 1. Save the fulfillment record into the master table
  const { error: insertError } = await supabase
    .from("fulfillment")
    .insert([
      {
        request_id: formData.dbId, // The true UUID of the request
        OCR_json: formData.items,
        // PO_number and logistician_id are omitted so they default to NULL
      }
    ]);

  if (insertError) {
    console.log("Error inserting fulfillment:", insertError.message);
    return { success: false, error: insertError.message };
  }

  // 2. Update the original Materials Request status to 'Fulfilled'
  const { error: updateError } = await supabase
    .from("materials_request")
    .update({ status: "Fulfilled" })
    .eq("id", formData.dbId); // Match by UUID

  if (updateError) {
    console.log("Notice: Could not update request status:", updateError.message);
  }

  // 3. Tell Next.js to refresh the UI
  revalidatePath("/pending-requests");
  revalidatePath("/materials-requests");

  return { success: true };
}