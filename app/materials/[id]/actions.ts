"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProductDetailBySku(sku: string) {
  const supabase = await createClient();

  // 1. Fetch the core material details
  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("sku", sku)
    .single();

  // 2. Fetch the stock levels across all physical locations
  const { data: locMats } = await supabase
    .from("location_materials")
    .select("quantity, location(name)")
    .eq("sku", sku);

  const locations = (locMats || []).map((lm: any) => {
    const locName = Array.isArray(lm.location) ? lm.location[0]?.name : lm.location?.name;
    return {
      name: locName || "Unknown Location",
      quantity: lm.quantity || 0,
    };
  });

  const totalInStock = locations.reduce((sum, loc) => sum + loc.quantity, 0);

  // 3. FETCH RELEVANT POs: Look in purchase_order_materials for this exact SKU
  const { data: poMats } = await supabase
    .from("purchase_order_materials")
    .select(`
      remaining,
      purchase_order (
        po_number,
        date,
        status,
        location (name)
      )
    `)
    .eq("sku", sku);

  // Map the relational Supabase data into the exact format your frontend expects
  const allPOs = (poMats || []).map((pm: any) => {
    const po = Array.isArray(pm.purchase_order) ? pm.purchase_order[0] : pm.purchase_order;
    if (!po) return null;

    const destLoc = Array.isArray(po.location) ? po.location[0]?.name : po.location?.name;

    return {
      id: po.po_number,
      date: po.date,
      location: destLoc || "Unknown Location",
      status: po.status || "pending",
      // Storing the remaining amount mapped directly to this SKU
      items: [{ productId: sku, qty: pm.remaining || 0 }] 
    };
  }).filter(Boolean); // Clean out any nulls

  return {
    product: {
      sku: material?.sku || sku,
      name: material?.name || "Unknown Material",
      description: material?.description || "",
      category: material?.category || "Material",
      qty: totalInStock,
      status: totalInStock > 10 ? "In Stock" : totalInStock > 0 ? "Low Stock" : "Out of Stock"
    },
    locations,
    allPOs
  };
}