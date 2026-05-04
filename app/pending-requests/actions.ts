"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPendingMaterialRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materials_request")
    .select("*")
    .eq("status", "Pending") // Only get pending requests!
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error fetching pending requests:", error.message);
    return [];
  }
  
  return data;
}