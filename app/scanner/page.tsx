// File: app/scanner/page.tsx
"use client";
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

function CameraViewer() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // NEW: Store multiple images and track the current preview
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      setErrorMsg('');
      setPreviewImage(null);
      setCapturedImages([]); // Reset any previous session
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMsg('Could not access the camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setPreviewImage(null);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Added 0.6 quality compression so multiple images don't overload the server
        const imageUrl = canvas.toDataURL('image/jpeg', 0.6); 
        setPreviewImage(imageUrl);
      }
    }
  };

  const discardPreview = () => {
    setPreviewImage(null);
  };

  const keepPage = () => {
    if (previewImage) {
      setCapturedImages([...capturedImages, previewImage]);
      setPreviewImage(null); // Go back to live camera
    }
  };

  const processAllPages = async () => {
      if (capturedImages.length === 0) return;
      setIsProcessing(true);

      try {
        const response = await fetch('/api/process-slip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // NEW: Send the array of images
          body: JSON.stringify({ imagesBase64: capturedImages }),
        });

        if (!response.ok) throw new Error("Failed to process images");

        const extractedData = await response.json();
        console.log("Multi-page Results:", extractedData);
        
        sessionStorage.setItem('scannedSlipData', JSON.stringify(extractedData.data));
        router.push('/manual-entry');

      } catch (err) {
        console.error("Error processing photo:", err);
        alert("Failed to extract text. Please try again.");
      } finally {
        setIsProcessing(false);
        stopCamera(); 
      }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* --- CAMERA OFF VIEW --- */}
      {!isCameraOn && (
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg w-full max-w-md mx-auto">
          <p className="mb-6 text-gray-600 text-center">Scan using device camera.</p>
          <button 
            onClick={startCamera}
            className="w-full h-12 bg-blue-200 text-black font-semibold rounded-lg hover:bg-blue-300 active:scale-[0.98] transition"
          >
            Open Camera
          </button>
          {errorMsg && <p className="text-red-500 mt-4 text-center">{errorMsg}</p>}
          <div className="flex items-center w-full my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 tracking-wider">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <button 
            onClick={() => router.push('/pending-deliveries')}
            className="w-full h-12 border-2 border-blue-200 text-black font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Manual Entry
          </button>
        </div>
      )}

      {/* --- CAMERA ON VIEW --- */}
      <div className={isCameraOn ? "fixed inset-0 z-50 bg-black flex flex-col" : "hidden"}>
        
        {/* Top Control Bar */}
        <div className="flex-none h-16 flex items-center justify-between px-6">
          <button 
            onClick={stopCamera}
            className="text-white text-lg font-medium active:text-gray-300 transition"
          >
            Cancel
          </button>
          {/* Show page count badge */}
          {capturedImages.length > 0 && !previewImage && (
            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {capturedImages.length} Page{capturedImages.length > 1 ? 's' : ''} Scanned
            </span>
          )}
        </div>

        {/* Viewfinder */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`absolute inset-0 w-full h-full object-cover ${previewImage ? 'hidden' : 'block'}`}
          />

          {!previewImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-6">
              <div className="relative w-full max-w-sm aspect-[3/4]">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl opacity-80"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl opacity-80"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl opacity-80"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl opacity-80"></div>
              </div>
            </div>
          )}
          
          {previewImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={previewImage} 
              alt="Page preview" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Bottom Control Bar */}
        <div className="flex-none h-40 flex flex-col items-center justify-center w-full px-6 pb-6">
          
          {/* STATE 1: Live Camera Mode */}
          {!previewImage && (
            <div className="w-full flex justify-between items-center relative">
              {/* Empty left space for balance */}
              <div className="w-24"></div>
              
              {/* Shutter Button */}
              <button 
                onClick={takePicture}
                className="w-20 h-20 bg-white rounded-full border-[6px] border-gray-300 hover:bg-gray-200 active:scale-95 transition mx-auto"
              />
              
              {/* Done Button (Only shows if pages exist) */}
              <div className="w-24 flex justify-end">
                {capturedImages.length > 0 && (
                  <button 
                    onClick={processAllPages}
                    disabled={isProcessing}
                    className="text-white text-lg font-bold bg-blue-600 px-4 py-3 rounded-xl active:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Wait...' : 'Done'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STATE 2: Preview Mode (Just took a picture) */}
          {previewImage && (
            <div className="w-full flex justify-between items-center">
              <button 
                onClick={discardPreview}
                className="text-white text-lg font-medium py-4 px-2 active:text-gray-300 transition"
              >
                Retake
              </button>
              <button 
                onClick={keepPage}
                className="text-white text-lg font-bold py-4 px-6 bg-blue-600 rounded-full active:bg-blue-700 transition"
              >
                Keep Page
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LogDelivery() {
  return (
    <div className="min-h-screen p-8 text-black bg-white">
      <div className="max-w-6xl mx-auto">
        <Link href="/log-delivery" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Hub
        </Link>
        <header className="w-full max-w-5xl flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">SCAN PACKING SLIP</h1>
        </header>
      </div>
      <CameraViewer />
    </div>
  );
}