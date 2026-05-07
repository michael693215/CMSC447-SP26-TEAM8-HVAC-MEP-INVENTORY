"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPendingDeliveries() {
  const supabase = await createClient();

  // Fetch all POs and their associated materials
  const { data, error } = await supabase
    .from("purchase_order")
    .select(`
      PO_number,
      location_id,
      status,
      po_materials (
        line_number,
        product_name,
        quantity,
        expecting
      )
    `)
    // We can exclude ones explicitly marked as fully Received
    .neq("status", "Received");

  if (error) {
    console.error("Error fetching pending deliveries:", error.message);
    return [];
  }

  return data;
}