'use client'

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export type signUpState = 
| { status: 'initial', error?: string }
| { status: 'otp', email: string, error?: string } 
| { status: 'success' };

export async function signInWithEmail(prevState : signUpState, formData : FormData) : Promise<signUpState>
{
    const supabase = createClient();
    const email = formData.get("email") as string;

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
        // set this to false if you do not want the user to be automatically signed up
        shouldCreateUser: true,
        },
    })
    if (error) { return { status: 'initial', error: error.message }; };
    return { status: 'otp', email: email };
}

export async function verifyOTP(prevState : signUpState, formData : FormData) : Promise<signUpState>
{
    const supabase = createClient();
    const email = formData.get('email') as string;
    const token = formData.get('token') as string;

    const { data, error } = await supabase.auth.verifyOtp({
        email, 
        token,
        type: 'email'
    });
    if (error) { return { status: 'otp', email: email, error: error.message }; }
    redirect('/');   
}