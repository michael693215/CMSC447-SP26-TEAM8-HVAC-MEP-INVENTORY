'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type signUpState = 
| { status: 'initial', error?: string }
| { status: 'otp', email: string, error?: string } 
| { status: 'new_user', email: string, error?: string }

export async function signInWithEmail(prevState : signUpState, formData : FormData) : Promise<signUpState>
{
    const supabase = await createClient();
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
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const token = formData.get('token') as string;

    const { data, error } = await supabase.auth.verifyOtp({
        email, 
        token,
        type: 'email'
    });
    if (error) { return { status: 'otp', email: email, error: error.message }; }

    const { data: employee } = await supabase
        .from('employee')
        .select('first_name')
        .eq('email', email)
        .single();
    if (!employee?.first_name){ return { status: 'new_user', email: email }; }
    
    redirect('/');   
}

export async function setEmployee(prevState : signUpState, formData : FormData) : Promise<signUpState>
{
    const supabase = await createClient();
    const firstName = formData.get('firstName') as string; 
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    console.log(email);

    const { data, error } = await supabase
        .from('employee')
        .update
        ({
            first_name: firstName,
            last_name: lastName
        })
        .eq('email', email)
        .select()
        .single();
    
    if (error) { return { status: 'new_user', email: email, error: error.message }; }
    redirect('/');
}