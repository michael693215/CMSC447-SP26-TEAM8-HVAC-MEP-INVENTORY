"use server"

import { createClient } from '@/lib/supabase/server'

type formState = 
| null
| { status: { error? : string, success : boolean } }

export async function createUser(prevState : formState, formData : FormData) : Promise<formState>
{
    if (formData.get('firstName') as string === "hello")
    {
        return { status: { success: true } };
    } 
    return { status: { error: "wrong", success: false } };
    /*
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();
    const { data, error } =  await supabase.auth.signUp({
        'email': email,
        'password': password,
    });
    if (error) { return { status: { error: error.message, success: false } } };
    return { status: { success: true } };
    */
}