import Link from "next/link";
import { signOut } from './actions'

export default function MainMenu() {
  const features = [
    {
      name: "View Inventory",
      path: "/inventory",
      description: "Track parts, units, and stock levels.",
      icon: "📦",
    },
    {
      name: "Add Delivery",
      path: "/adddelivery",
      description: "Log a new incoming delivery.",
      icon: "📋",
    },
    {
      name: "Delivery History",
      path: "/delivery-history",
      description: "View all current and previous deliveries.",
      icon: "🚚",
    },
    {
      name: "Add Purchase Order",
      path: "/purchase-order",
      description: "Create a new purchase order for stock.",
      icon: "🛒",
    },
    {
      name: "Contact List",
      path: "/contacts",
      description: "Manage contact names and emails.",
      icon: "👥",
    },
    {
      name: "About",
      path: "/about",
      description: "Learn about the use of the app.",
      icon: "⚙️",
    },
    {
      name: "Add User",
      path: "add-user",
      description: "Add a new user.",
      icon: "👥➕"
    }


  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 md:p-12 bg-gray-100">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-black">Inventory Management System</h1>
        <button onClick={ signOut } className="btn-primary">
          Sign Out
        </button>
      </header>

      {/* 3-column grid */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-5xl">
        {features.map((feature) => (
          <Link key={feature.path} href={feature.path} className="group">
            <div className="aspect-square flex flex-col items-center justify-center p-8 bg-blue-200 shadow-lg rounded-2xl border-2 border-black group-hover:border-black transition-all duration-300 cursor-pointer text-center">
              <div className="text-6xl mb-5 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h2 className="text-xl font-bold mb-3 text-black uppercase tracking-tight">
                {feature.name}
              </h2>
              <p className="text-gray-500 text-sm max-w-xs">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
