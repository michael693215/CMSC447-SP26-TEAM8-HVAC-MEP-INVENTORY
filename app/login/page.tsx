"use client"

import { useActionState } from "react"
import { signIn } from './actions'

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-blue-100 border border-blue-200 rounded-2xl shadow-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
        </div>

        {state?.error && (
          <div className="mb-4 px-4 py-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="input-themed p-2 text-black w-full bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="input-themed p-2 text-black w-full bg-white"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
