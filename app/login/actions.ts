'use server'

import { createClient } from '@/lib/supabase/server'

type signUpState = 
| null
| { error: string }
| { success: boolean }

export async function signInWithEmail(prevState : signUpState, formData : FormData) {
    const supabase = await createClient()
    const email = formData.get("email") as string;

    if (!email.toLowerCase().endsWith('@coolsys.com'))
    {
        return { error: "Please use your corporate email address." }
    }

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
        // set this to false if you do not want the user to be automatically signed up
        shouldCreateUser: true,
        },
    })

    if (error) { return { error: error.message } }
    return { success: true }
}