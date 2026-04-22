"use client" 

import { useActionState } from "react"
import { signIn } from './actions'

export default function LoginPage() 
{
  const [state, formAction] = useActionState(signIn, null);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="items-center justify-center p-8 rounded-lg bg-blue-100">
        <h1 className="text-center">Login</h1>
        { state?.error && <div className="bg-red-100">{ state.error }</div> }
        <form action={ formAction } className="flex flex-col gap-4">
          <div className="flex flex-col">
          <label htmlFor="email">Email</label>
          <input
            name="email"
            className="rounded bg-white"
            type="email" 
            required
          />
          </div>
          <div className="flex flex-col">
          <label htmlFor="password">Password</label>
          <input
            name="password"
            className="rounded bg-white"
            type="password"
          />
          </div>
          <div className="flex place-content-end">
            <button
              type="submit"
              className="btn-primary self-end"
            >Enter</button> 
          </div>
        </form>
      </div>
    </div>
  )
}