// File: app/api/process-slip/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    // 1. Clean the Base64 string
    const base64Data = imageBase64.split(',')[1];

    // 2. Format the payload to trigger a DocuPipe Workflow
    const payload = {
      document: {
        file: {
          contents: base64Data,   // Changed from 'data'
          filename: "packing_slip" // Changed from 'name', removed '.jpg' extension
        }
      },
      // This tells DocuPipe to instantly route the upload to your schema
      workflowId: process.env.DOCUPIPE_WORKFLOW_ID
    };

    // 3. Send the image to Docupipe
    const docupipeResponse = await fetch("https://app.docupipe.ai/document", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.DOCUPIPE_API_KEY as string, // Changed to X-API-Key
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!docupipeResponse.ok) {
      const errorText = await docupipeResponse.text();
      console.error("Docupipe API Error:", errorText);
      throw new Error("Docupipe processing failed");
    }

    // Docupipe returns job_id and doc_id first, processing might be async
    const extractedData = await docupipeResponse.json();
    console.log("Docupipe Job ID:", extractedData.jobId);

    // 4. Return the structured data back to your frontend
    return NextResponse.json({ success: true, data: extractedData });

  } catch (error) {
    console.error("Extraction Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process document" },
      { status: 500 }
    );
  }
}