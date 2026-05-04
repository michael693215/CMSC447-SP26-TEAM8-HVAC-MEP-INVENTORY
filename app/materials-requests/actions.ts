"use server";

// 1. Import the setup from your specific server file
import { createClient } from "@/lib/supabase/server"; 
import { revalidatePath } from "next/cache";

// 2. Fetch all requests for the list page
export async function getMaterialRequests() {
  // Initialize the secure server client
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materials_request")
    .select("*")
    .order("created_at", { ascending: false });

    if (error) {
        // This forces it to print the actual details
        console.error("Error fetching requests:", JSON.stringify(error, null, 2));
        return [];
    }
  return data;
}

// 3. Insert a new request from the form
export async function createMaterialRequest(formData: any) {
  // Initialize the secure server client
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("materials_request")
    .insert([
      {
        request_id: formData.reqId || `REQ-${Math.floor(1000 + Math.random() * 9000)}`, // Auto-gen if blank
        date: formData.date,
        location: formData.location,
        products: formData.products,
        status: "Pending", // Default status
      }
    ]);

    if (error) {
        console.error("Error inserting request:", error);
        return { success: false, error: error.message };
    }

  // Tells Next.js to refresh the list page so the new entry shows up instantly
  revalidatePath("/materials-requests"); 
  return { success: true };
}