'use client'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type loginState = 
| null
| { error: string };

export async function signIn(prevState : loginState, formData : FormData) 
{
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.get('email') as string,
        password: formData.get('password') as string
    });

    if (error) { return { error: error.message }; }
    redirect('/');
}
