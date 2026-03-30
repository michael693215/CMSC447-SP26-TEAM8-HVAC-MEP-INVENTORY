"use client"; 

import React, { useState } from 'react';
// 1. Import the router from next/navigation
import { useRouter } from 'next/navigation'; 

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // 2. Initialize the router
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you'd verify the password here.
    // For now, we just simulate a successful login:
    console.log("Logging in with:", { username, password });

    // 3. Redirect to the root page (Main Menu)
    router.push('/'); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">HVAC Inventory Login</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-64">
          <input 
            type="text" 
            placeholder="Username" 
            className="border p-2 rounded focus:outline-blue-500 text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="border p-2 rounded focus:outline-blue-500 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="bg-black text-white p-2 rounded hover:bg-gray-800 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}