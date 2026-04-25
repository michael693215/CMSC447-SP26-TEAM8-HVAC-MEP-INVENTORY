import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 md:p-12">
      
      {/* Same style as menu */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-black">About This App</h1>
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>
      </header>

      {/* Content styled like a card */}
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center justify-center p-10 bg-blue-200 shadow-lg rounded-2xl border-2 border-black text-center">
          
          <div className="text-6xl mb-5">⚙️</div>

          <h2 className="text-2xl font-bold mb-4 text-black uppercase tracking-tight">
            Inventory Management System
          </h2>

          <p className="text-gray-700 max-w-xl mb-4">
            This system is designed to help manage inventory, deliveries, and purchase orders
            in one centralized dashboard.
          </p>

          <p className="text-gray-600 max-w-xl">
            Use the menu to navigate between features like tracking inventory, logging
            deliveries, and managing contacts.
          </p>

          <p className="text-gray-600 max-w-xl mt-6">
            Feedback?{" "}
            <a
              href="https://forms.gle/WwPDgHtt4CTZ8syU6"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-black hover:text-gray-800"
            >
              Click here
            </a>
          </p>
          
        </div>
      </div>
    </div>
  );
}