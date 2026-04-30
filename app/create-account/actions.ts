"use server"

import { createClient } from '@/lib/supabase/server'

type formState = 
| null
| { status: { error? : string, success : boolean } }

export async function createAccount(prevState : formState, formData : FormData) : Promise<formState>
{
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();
    const { data, error } =  await supabase.auth.signUp({
        'email': email,
        'password': password,
    });
    if (error) { return { status: { error: error.message, success: false } } };
    return { status: { success: true } };
}