// File: app/api/process-slip/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    const base64Data = imageBase64.split(',')[1];

    const payload = {
      document: {
        file: {
          contents: base64Data,   
          filename: "packing_slip" 
        }
      },
      workflowId: process.env.DOCUPIPE_WORKFLOW_ID 
    };

    // 1. Submit the image to the Workflow
    const docupipeResponse = await fetch("https://app.docupipe.ai/document", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.DOCUPIPE_API_KEY as string, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!docupipeResponse.ok) {
      throw new Error("Docupipe upload failed");
    }

    // 2. Extract the specific Standardization ID from the workflow response
    const initialData = await docupipeResponse.json();
    const stdId = initialData.workflowResponse?.standardizeStep?.standardizationIds?.[0];

    if (!stdId) {
       console.error("Workflow Response:", initialData);
       throw new Error("Could not find a Standardization ID in the workflow response.");
    }
    
    console.log("Standardization Started! ID:", stdId);

    // 3. Poll the /standardization endpoint
    let isProcessing = true;
    let extractedData = null;
    let attempts = 0;

    // Wait up to 60 seconds, but we stop the moment 'data' appears
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
      console.log(`Poll ${attempts} RAW:`, JSON.stringify(checkData));

      // THE FIX: We stop as soon as DocuPipe returns the 'data' field.
      // Even if the fields are null/empty, we move to the next page.
      if (checkData.data) {
        isProcessing = false;
        extractedData = checkData.data;
        console.log("Data received. Handing off to frontend...");
      }
      
      // If it returns {"detail":"Not Found"}, we just wait 2 seconds and try again.
    }

    // 4. Final verification
    if (!extractedData) {
      throw new Error("DocuPipe took too long (over 60 seconds).");
    }

    console.log("Final Extracted JSON:", extractedData);

    // 5. Return the data to the manual-entry form!
    return NextResponse.json({ success: true, data: extractedData });

  } catch (error) {
    console.error("Extraction Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process document" },
      { status: 500 }
    );
  }
}