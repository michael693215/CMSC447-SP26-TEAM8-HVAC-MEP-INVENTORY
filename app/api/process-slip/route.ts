// File: app/api/process-slip/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    // 1. Clean the Base64 string
    const base64Data = imageBase64.split(',')[1];

    // 2. Format the payload according to Docupipe's API docs
    const payload = {
      document: {
        slug: "1anz6Ou0", 
        file: {
          data: base64Data,
          name: "packing_slip.jpg" 
        }
      }
    };

    // 3. Send the image to Docupipe
    const docupipeResponse = await fetch("https://app.docupipe.ai/document", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DOCUPIPE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!docupipeResponse.ok) {
      const errorText = await docupipeResponse.text();
      console.error("Docupipe API Error:", errorText);
      throw new Error("Docupipe processing failed");
    }

    const extractedData = await docupipeResponse.json();

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