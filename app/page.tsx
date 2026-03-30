import Link from 'next/link';

export default function MainMenu() {
  const features = [
    { 
      name: "View Inventory", 
      path: "/inventory", 
      description: "Track parts, units, and stock levels.",
      icon: "📦" 
    },
    { 
      name: "Add Delivery", 
      path: "/adddelivery", 
      description: "",
      icon: "📋" 
    },
    { 
      name: "Contact List", 
      path: "/contacts", 
      description: "Manage contact names and emails.",
      icon: "👥" 
    },
    { 
      name: "About", 
      path: "/about", 
      description: "Learn about the use of the app.",
      icon: "⚙️" 
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6 md:p-12">
      {/* Header Section */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-black">Inventory Management System</h1>
        <Link href="/login" className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition">
          Sign Out
        </Link>
      </header>

      {/* Grid of Features - Changed to 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {features.map((feature) => (
          <Link key={feature.path} href={feature.path} className="group">
            <div className="aspect-square flex flex-col items-center justify-center p-10 bg-blue-200 shadow-lg rounded-2xl border-2 border-black group-hover:border-black transition-all duration-300 cursor-pointer text-center">
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h2 className="text-2xl font-bold mb-4 text-black uppercase tracking-tight">
                {feature.name}
              </h2>
              <p className="text-gray-500 text-lg max-w-xs">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}