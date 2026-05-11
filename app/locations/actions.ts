"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchLocations() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("location")
    .select(`
      id,
      name,
      address_id,
      location_address (
        address_number,
        street_number,
        street_name,
        city,
        state,
        zipcode
      )
    `);

  if (error) {
    console.error("Error fetching locations:", error.message);
    return [];
  }
  return data;
}

export async function addLocation(form: any) {
  const supabase = await createClient();

  // 1. Insert the address using the new 'address_number' primary key
  const { data: addrData, error: addrError } = await supabase
    .from("location_address")
    .insert([{
      street_number: form.street_number.trim(),
      street_name: form.street_name.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipcode: form.zipcode.trim(),
    }])
    .select("address_number") // Grabs the new primary key
    .single();

  if (addrError || !addrData) {
    return { success: false, error: addrError?.message || "Failed to save address" };
  }

  // 2. Insert the location (now including the 'name' column)
  const { error: locError } = await supabase
    .from("location")
    .insert([{
      name: form.name.trim(),
      address_id: addrData.address_number // Link the foreign key
    }]);

  if (locError) {
    return { success: false, error: locError.message };
  }

  revalidatePath("/locations");
  return { success: true };
}

export async function deleteLocation(locationId: string, addressNumber: number | string) {
  const supabase = await createClient();

  // Delete location first to prevent foreign key errors
  const { error: locError } = await supabase
    .from("location")
    .delete()
    .eq("id", locationId);

  if (locError) return { success: false, error: locError.message };

  // Then delete the address using address_number
  const { error: addrError } = await supabase
    .from("location_address")
    .delete()
    .eq("address_number", addressNumber);

  if (addrError) return { success: false, error: addrError.message };

  revalidatePath("/locations");
  return { success: true };
}