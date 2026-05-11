"use server";

import { createClient } from "@/lib/supabase/server";

export async function getInventoryList() {
  const supabase = await createClient();

  // 1. Fetch all unique materials from the master list
  const { data: materials, error: matError } = await supabase
    .from("materials")
    .select("sku, name, description");

  if (matError || !materials) {
    console.error("Error fetching materials:", matError?.message);
    return [];
  }

  // 2. Fetch inventory counts across all locations
  const { data: inventory } = await supabase
    .from("location_materials")
    .select("sku, quantity");

  // 3. Fetch purchase orders to calculate active deliveries
  const { data: poMaterials } = await supabase
    .from("purchase_order_materials")
    .select(`
      sku,
      po_number,
      remaining,
      purchase_order (
        status
      )
    `);

  // Map the raw data into the format the UI expects
  return materials.map((mat) => {
    const totalQty = (inventory || [])
      .filter((inv) => inv.sku === mat.sku)
      .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

    const activeDeliveries = (poMaterials || []).filter((pom) => {
      const isForSku = pom.sku === mat.sku;
      const hasRemaining = pom.remaining > 0;
      const poData = Array.isArray(pom.purchase_order) ? pom.purchase_order[0] : pom.purchase_order;
      const isPending = poData?.status !== "Received"; 
      
      return isForSku && hasRemaining && isPending;
    });

    let status = "In Stock";
    if (totalQty === 0) status = "Out of Stock";
    else if (totalQty < 20) status = "Low Stock";

    return {
      id: mat.sku, 
      sku: mat.sku,
      name: mat.name || "Unknown Material",
      description: mat.description || "",
      category: "Material", 
      qty: totalQty,
      status: status,
      deliveryIds: activeDeliveries.map((d) => d.po_number),
    };
  });
}

export async function getProductDetailBySku(sku: string) {
  const supabase = await createClient();

  // 1. Fetch specific material details
  const { data: material, error } = await supabase
    .from("materials")
    .select("*")
    .eq("sku", sku)
    .single();

  if (error || !material) return null;

  // 2. Fetch inventory AND Location Details
  const { data: inventory } = await supabase
    .from("location_materials")
    .select(`
      quantity,
      location_id,
      location (
        name
      )
    `)
    .eq("sku", sku);

  // Calculate total across all locations
  const totalQty = (inventory || []).reduce((sum, inv) => sum + (inv.quantity || 0), 0);

  // Format the locations array for the UI
  const locations = (inventory || [])
    .map((inv: any) => {
      // Supabase relations can sometimes return arrays, this safely unwraps it
      const locData = Array.isArray(inv.location) ? inv.location[0] : inv.location;
      return {
        id: inv.location_id,
        name: locData?.name || inv.location_id || "Unknown Location",
        quantity: inv.quantity || 0,
      };
    })
    // Filter out locations that hit 0, and sort by highest quantity
    .filter((loc) => loc.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  let status = "In Stock";
  if (totalQty === 0) status = "Out of Stock";
  else if (totalQty < 20) status = "Low Stock";

  const product = {
    id: material.sku,
    sku: material.sku,
    name: material.name,
    description: material.description,
    category: "Material",
    qty: totalQty,
    status: status,
  };

  // 3. Fetch specific POs for this SKU
  const { data: poMaterials } = await supabase
    .from("purchase_order_materials")
    .select(`
      po_number,
      total,
      remaining,
      purchase_order (
        location_id,
        created_at,
        status
      )
    `)
    .eq("sku", sku);

  const allPOs = (poMaterials || []).map((pom) => {
    const poData = Array.isArray(pom.purchase_order) ? pom.purchase_order[0] : pom.purchase_order;
    
    let formattedDate = "Unknown Date";
    if (poData?.created_at) {
      formattedDate = new Date(poData.created_at).toISOString().split('T')[0];
    }

    return {
      id: pom.po_number,
      date: formattedDate,
      location: poData?.location_id || "Unknown Location",
      status: poData?.status || "Pending", 
      notes: "",
      items: [
        {
          productId: sku, 
          qty: pom.remaining ?? pom.total, 
        }
      ]
    };
  });

  return { product, allPOs, locations }; // <-- Returning locations here!
}