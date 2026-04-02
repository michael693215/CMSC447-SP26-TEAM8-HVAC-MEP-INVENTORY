"use client"; 

import React, { useActionState } from 'react';
import { signInWithEmail } from './actions'

export default function LoginPage() {
  const [state, formAction] = useActionState(signInWithEmail, null);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">HVAC Inventory Login</h1>
        
        <form action={ formAction } className="flex flex-col gap-4 w-64">
          <input 
            type="email" 
            name="email"
            placeholder="YourEmail@coolsys.com" 
            className="text-[rgb(80,80,80)]"
            required
          />
          {state?.error && <p style={{ color : "red" }}>{ state.error }</p>}
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