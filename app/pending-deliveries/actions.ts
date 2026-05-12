"use server";

import { createClient } from "@/lib/supabase/server";

export async function getLocationName(locationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("location")
    .select("name")
    .eq("id", locationId)
    .single();
    
  return data?.name || "Unknown Location";
}

export async function getPendingDeliveries(locationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("purchase_order")
    .select(`
      po_number,
      status,
      purchase_order_materials (
        total,
        remaining,
        sku,
        materials (
          name,
          description
        )
      )
    `)
    .eq("location_id", locationId);

  if (error) {
    console.error("Error fetching deliveries:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  const formattedDeliveries = data.map((po: any) => {
    const rawMaterials = Array.isArray(po.purchase_order_materials) 
      ? po.purchase_order_materials 
      : po.purchase_order_materials ? [po.purchase_order_materials] : [];

    const items = rawMaterials.map((pom: any) => {
      const mat = Array.isArray(pom.materials) ? pom.materials[0] : pom.materials;
      return {
        sku: pom.sku, // Pass the SKU securely for the backend to use later
        name: mat?.name || "Unknown Material",
        quantity: pom.remaining ?? pom.total ?? 0, 
        specifications: mat?.description || "" // FIXED: Removed SKU fallback!
      };
    });

    return {
      po_number: po.po_number,
      status: po.status,
      items: items,
      rawRequest: {
        poNumber: po.po_number,
        items: items 
      }
    };
  });

  return formattedDeliveries.filter((delivery) => {
     const statusStr = (delivery.status || "").toLowerCase();
     return statusStr !== "received" && statusStr !== "completed";
  });
}