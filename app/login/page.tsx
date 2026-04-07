"use client"; 

import React, { useActionState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'
import { signInWithEmail, verifyOTP, signUpState, setEmployee } from './actions'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter();
  const [signInState, signInAction] = useActionState<signUpState, FormData>(signInWithEmail, { status: 'initial' });
  const [token, verifyAction] = useActionState<signUpState, FormData>(verifyOTP, { status: 'initial' });
  const [nameError, setEmployeeAction] = useActionState<signUpState, FormData>(setEmployee, { status: 'initial' });

  useEffect(() => { 
    if (token?.status == 'success' || nameError?.status == 'success')
    {
      router.replace('/');  
    }
  });

  {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white shadow-md rounded-lg">
          { signInState?.status == 'initial' && 
          (
            <form action={ signInAction } className="flex flex-col gap-4 w-64">
              <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
              <input 
                type="email" 
                name="email"
                placeholder="YourEmail@coolsys.com" 
                className="text-[rgb(80,80,80)]"
                required
              />
              {signInState?.error && <p style={{ color : "red" }}>{ signInState.error }</p>}
              <button 
                type="submit" 
                className="bg-blue-200 text-black p-2 rounded hover:bg-blue-300 transition"
              >
                Sign In
              </button>
            </form>
          )}
          { signInState?.status == 'otp' && token?.status != 'new_user' && 
          (
            <form action={ verifyAction } className="flex flex-col gap-4 w-64">
              <h2 className="text-2xl font-bold mb-6 text-center">Logging in as: { signInState.email } </h2>
              <input 
                type="hidden"
                name="email"
                value={signInState.email}
              />
              <input
                type="text"
                inputMode="numeric"
                name="token"
                placeholder="123456"
                className="text-[rgb(80,80,80)]"
                required
              />
              {token?.error && <p style={{ color : "red" }}>{ token.error }</p>}
              <button type="submit" className="bg-blue-200 text-black p-2 rounded hover:bg-blue-300 transition">
                Submit
              </button>
            </form>
          )}
          { token?.status == 'new_user' &&
          (
            <form action={ setEmployeeAction } className="flex flex-col gap-4 w-64">
              <h2 className="text-2xl font-bold mb-6 text-center">New User</h2>
              <input 
                type="hidden"
                name="email"
                value={token.email}
              />
              <input
                type="text"
                inputMode="text"
                name="firstName"
                placeholder="John"
                className="text-[rgb(80,80,80)]"
                required
              />
              <input
                type="text"
                inputMode="text"
                name="lastName"
                placeholder="Doe"
                className="text-[rgb(80,80,80)]"
              />
              { nameError?.error && <p style={{ color : "red" }}>{ nameError.error }</p>}
              <button type="submit" className="bg-blue-200 text-black p-2 rounded hover:bg-blue-300 transition">
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    )};
  }