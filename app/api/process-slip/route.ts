// File: app/api/process-slip/route.ts
import { NextResponse } from 'next/server';

// Helper function to process a single image through the workflow
async function processSingleImage(base64Data: string) {
  const payload = {
    document: { file: { contents: base64Data, filename: "packing_slip" } },
    workflowId: process.env.DOCUPIPE_WORKFLOW_ID 
  };

  // 1. Submit image
  const docupipeResponse = await fetch("https://app.docupipe.ai/document", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.DOCUPIPE_API_KEY as string, 
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!docupipeResponse.ok) throw new Error("Docupipe upload failed");

  // 2. Get ID
  const initialData = await docupipeResponse.json();
  const stdId = initialData.workflowResponse?.standardizeStep?.standardizationIds?.[0];

  if (!stdId) throw new Error("Could not find a Standardization ID");

  // 3. Poll
  let isProcessing = true;
  let extractedData = null;
  let attempts = 0;

  while (isProcessing && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;

    const checkResponse = await fetch(`https://app.docupipe.ai/standardization/${stdId}`, {
      method: "GET",
      headers: {
        "X-API-Key": process.env.DOCUPIPE_API_KEY as string,
        "Content-Type": "application/json"
      }
    });

    const checkData = await checkResponse.json();

    if (checkData.data) {
      isProcessing = false;
      extractedData = checkData.data;
    }
  }

  return extractedData;
}

export async function POST(request: Request) {
  try {
    const { imagesBase64, imageBase64 } = await request.json();
    
    // Support the new array format, but keep fallback just in case
    const images = imagesBase64 || (imageBase64 ? [imageBase64] : []);
    
    if (images.length === 0) {
      throw new Error("No images provided");
    }

    console.log(`Processing ${images.length} pages in parallel...`);

    // 4. Run all images through DocuPipe at the same time
    const results = await Promise.all(
      images.map(async (img: string) => {
        try {
          const b64 = img.split(',')[1] || img;
          return await processSingleImage(b64);
        } catch (err) {
          console.error("Failed on one page, skipping...", err);
          return null; // If one page is blurry and fails, don't crash the whole batch
        }
      })
    );

    // 5. Stitch the results together
    const masterData = {
      PO: null as string | null,
      lineItems: [] as any[]
    };

    results.forEach(res => {
      if (res) {
        // Grab the PO from whichever page has it first
        if (res.PO && !masterData.PO) {
          masterData.PO = res.PO;
        }
        // Combine all items into one big array
        if (res.lineItems && res.lineItems.length > 0) {
          masterData.lineItems = [...masterData.lineItems, ...res.lineItems];
        }
      }
    });

    console.log("Final Combined JSON:", masterData);

    return NextResponse.json({ success: true, data: masterData });

  } catch (error) {
    console.error("Extraction Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process documents" },
      { status: 500 }
    );
  }
}