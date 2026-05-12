// File: app/manual-entry/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function logDeliverySubmission(payload: any) {
  const supabase = await createClient();
  
  // Get the logistician_id securely from the active user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "You must be logged in to log a delivery." };

  try {
    // --- PREP: Fetch the DB materials for this PO to match frontend items to exact DB rows ---
    const { data: poMaterials, error: poErr } = await supabase
      .from("purchase_order_materials")
      .select("id, sku, remaining, materials(name, description)")
      .eq("po_number", payload.poNumber);

    if (poErr || !poMaterials) throw new Error("Could not find Purchase Order Materials in database.");

    // --- STEP 1: Add row to fulfillment table (Letting DB generate the ID!) ---
    const { data: newFulfillment, error: fErr } = await supabase
      .from("fulfillment")
      .insert({
        // Omitted 'id' so Postgres automatically fires private.gen_random_ful_id()
        datetime: new Date(payload.date).toISOString(),
        po_number: payload.poNumber,
        ocr_json: payload.ocrJson || null,
        logistician_id: user.id
      })
      .select("id") // Immediately grab the newly generated ID
      .single();

    if (fErr || !newFulfillment) throw new Error(`Fulfillment Header Error: ${fErr?.message || "Failed to generate ID."}`);

    const newFulfillmentId = newFulfillment.id;
    let allItemsZero = true; 

    // Loop through the items submitted from the form
    for (const item of payload.items) {
      if (item.quantity <= 0) continue; // Skip items they didn't receive any of

      // Precisely match the frontend item to the DB row (using the hidden SKU we passed)
      const match = poMaterials.find((dbm: any) => {
        if (item.sku && dbm.sku === item.sku) return true;
        // Fallback to name matching just in case it was a manual OCR entry
        const matName = Array.isArray(dbm.materials) ? dbm.materials[0]?.name : dbm.materials?.name;
        return matName?.toLowerCase() === item.name.toLowerCase();
      });

      if (!match) throw new Error(`Could not precisely match item "${item.name}" to the original Purchase Order.`);

      // --- STEP 2: Add row to fulfillment_materials ---
      const { error: fmErr } = await supabase
        .from("fulfillment_materials")
        .insert({
          fulfillment_id: newFulfillmentId, // Using the DB-generated ID here!
          quantity: item.quantity,
          po_materials_id: match.id 
        });

      if (fmErr) throw new Error(`Fulfillment Line Item Error: ${fmErr.message}`);

      // --- STEP 3: Update location_materials ---
      const { data: existingLocMat, error: locCheckErr } = await supabase
        .from("location_materials")
        .select("id, quantity")
        .eq("location_id", payload.locationId)
        .eq("sku", match.sku)
        .maybeSingle();

      if (locCheckErr) throw new Error(`Location Check Error: ${locCheckErr.message}`);

      if (existingLocMat) {
        const { error: locUpErr } = await supabase
          .from("location_materials")
          .update({ quantity: existingLocMat.quantity + item.quantity })
          .eq("id", existingLocMat.id);
          
        if (locUpErr) throw new Error(`Location Update Error: ${locUpErr.message}`);
      } else {
        const { error: locInsErr } = await supabase
          .from("location_materials")
          .insert({
            location_id: payload.locationId, 
            sku: match.sku,
            quantity: item.quantity
          });
          
        if (locInsErr) throw new Error(`Location Insert Error: ${locInsErr.message}`);
      }

      // --- STEP 4: Decrement remaining in purchase_order_materials ---
      const newRemaining = Math.max(0, match.remaining - item.quantity);
      const { error: poMatErr } = await supabase
        .from("purchase_order_materials")
        .update({ remaining: newRemaining })
        .eq("id", match.id);
        
      if (poMatErr) throw new Error(`PO Materials Update Error: ${poMatErr.message}`);

      // Update our local memory to test Step 5 accurately
      match.remaining = newRemaining;
    }

    // --- STEP 5: Mark PO as completed if all remaining equal 0 ---
    for (const dbm of poMaterials) {
      if (dbm.remaining > 0) {
        allItemsZero = false;
        break; // Stop checking, at least one item still needs delivery
      }
    }

    if (allItemsZero) {
      const { error: poStatErr } = await supabase
        .from("purchase_order")
        .update({ status: "completed" }) 
        .eq("po_number", payload.poNumber);
        
      if (poStatErr) throw new Error(`PO Status Update Error: ${poStatErr.message}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: err.message };
  }
}