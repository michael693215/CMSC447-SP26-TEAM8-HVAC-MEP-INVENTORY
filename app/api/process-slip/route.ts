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

    // 1. Submit the image (Place the order)
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

    // This is the "receipt" - it only contains the Job ID!
    const initialData = await docupipeResponse.json();
    const jobId = initialData.jobId || initialData.id; 
    console.log("Docupipe Job Started! ID:", jobId);

    // 2. Poll the API (Wait at the window for the food)
    let isProcessing = true;
    let extractedData = null;
    let attempts = 0;

    // We will ask DocuPipe if it is done every 2 seconds, up to 15 times (30 sec max)
    while (isProcessing && attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      attempts++;

      // NOTE: Because I am an AI, I don't have DocuPipe's exact API docs memorized. 
      // This is the standard URL for checking a job, but you may need to peek at 
      // their docs if it is slightly different (e.g., /job/ instead of /jobs/)
      const checkResponse = await fetch(`https://app.docupipe.ai/jobs/${jobId}`, {
        method: "GET",
        headers: {
          "X-API-Key": process.env.DOCUPIPE_API_KEY as string,
          "Content-Type": "application/json"
        }
      });

      const checkData = await checkResponse.json();
      console.log(`Poll ${attempts} status:`, checkData.status);

      // If the AI is finished extracting...
      if (checkData.status === "completed" || checkData.status === "success" || checkData.status === "done") {
        isProcessing = false;
        
        // DocuPipe usually nests the final JSON inside a "result", "data", or "output" key.
        // We use the OR operator (||) to safely grab it wherever they hid it!
        extractedData = checkData.result || checkData.data || checkData.output || checkData;
        
      } else if (checkData.status === "failed" || checkData.status === "error") {
        throw new Error("Docupipe failed to process the document internally.");
      }
    }

    if (!extractedData) {
      throw new Error("Timeout: DocuPipe took too long to respond.");
    }

    console.log("Final Extracted JSON:", extractedData);

    // 3. FINALLY return the real data back to your frontend!
    return NextResponse.json({ success: true, data: extractedData });

  } catch (error) {
    console.error("Extraction Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process document" },
      { status: 500 }
    );
  }
}