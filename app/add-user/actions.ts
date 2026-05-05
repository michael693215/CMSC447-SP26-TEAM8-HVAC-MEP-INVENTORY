"use server"

import { createClient } from '@/lib/supabase/server'

type formState = 
| null
| { status: { error? : string, success : boolean } }

export async function createUser(prevState : formState, formData : FormData) : Promise<formState>
{
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const role = formData.get('role') as string;

    const supabase = await createClient();
    const { data, error } =  await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                role: role, 
            }
        }
    });
    if (error) { return { status: { error: error.message, success: false } } };
    return { status: { success: true } };
}