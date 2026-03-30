import Link from 'next/link';

export default function MainMenu() {
  // These represent the different parts of your HVAC app
  const features = [
    { 
      name: "Inventory Management", 
      path: "/inventory", 
      description: "Track parts, units, and stock levels.",
      icon: "📦" 
    },
    { 
      name: "Work Orders", 
      path: "/orders", 
      description: "View and assign HVAC repair jobs.",
      icon: "📋" 
    },
    { 
      name: "Customer List", 
      path: "/customers", 
      description: "Manage client contact info and history.",
      icon: "👥" 
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-8">
      {/* Header Section */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-black text-left">HVAC Dashboard</h1>
        <Link href="/login" className="text-sm text-gray-500 hover:text-black transition underline">
          Sign Out
        </Link>
      </header>

      {/* Grid of Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {features.map((feature) => (
          <Link key={feature.path} href={feature.path} className="group">
            <div className="h-full p-6 bg-white shadow-md rounded-lg border border-transparent group-hover:border-black transition-all duration-200 cursor-pointer">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h2 className="text-xl font-bold mb-2 text-black">{feature.name}</h2>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}