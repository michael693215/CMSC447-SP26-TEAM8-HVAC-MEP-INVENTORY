import Link from "next/link";
import { signOut } from './actions'

function FeatureIcon({ type }: { type: string }) {
  const cls = "w-10 h-10 sm:w-14 sm:h-14 stroke-black";
  if (type === "inventory") return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
  if (type === "delivery-add") return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
  if (type === "delivery-history") return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
  if (type === "purchase-order") return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
  if (type === "contacts") return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
  if (type === "about") return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  return null;
}

export default function MainMenu() {
  const features = [
    {
      name: "View Inventory",
      path: "/inventory",
      description: "Track parts, units, and stock levels.",
      icon: "inventory",
    },
    {
      name: "Log Delivery",
      path: "/log-delivery",
      description: "Log a new incoming delivery.",
      icon: "delivery-add",
    },
    {
      name: "Delivery History",
      path: "/delivery-history",
      description: "View all current and previous deliveries.",
      icon: "delivery-history",
    },
    {
      name: "Add Purchase Order",
      path: "/purchase-order",
      description: "Create a new purchase order for stock.",
      icon: "purchase-order",
    },
    {
      name: "Contact List",
      path: "/contacts",
      description: "Manage contact names and emails.",
      icon: "contacts",
    },
    {
      name: "About",
      path: "/about",
      description: "Learn about the use of the app.",
      icon: "about",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 md:p-12 bg-gray-100">
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-wrap justify-between items-center gap-3 mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight">
          Inventory Management System
        </h1>
        <form action={signOut} className="shrink-0">
          <button type="submit" className="btn-primary">
            Sign Out
          </button>
        </form>
      </header>

      {/* Grid: 1-col on mobile, 2-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-5xl">
        {features.map((feature) => (
          <Link key={feature.path} href={feature.path} className="group">
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-blue-200 shadow-lg rounded-2xl border-2 border-black group-hover:border-black transition-all duration-300 cursor-pointer text-center min-h-[10rem] sm:aspect-square">
              <div className="mb-3 sm:mb-5 group-hover:scale-110 transition-transform">
                <FeatureIcon type={feature.icon} />
              </div>
              <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-black uppercase tracking-tight">
                {feature.name}
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm max-w-xs">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
