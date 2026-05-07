'use server'

import { createClient } from '@/lib/supabase/server'
import { Employee } from '@/components/columns/Employee'
import { Role } from '@/lib/types'

interface editState {
    success: boolean,
    error?: string,
}

export async function getUserData(id? : string) : Promise<Employee | null>
{
    const supabase = await createClient();
    if (id === undefined)
    {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        id = user.id;
    }
    const { data, error } = await supabase
    .from('employee')
    .select('*')
    .eq('id', id)
    .single();
    if (data) return data;
    return null;
}

export async function editName(id? : string, firstName? : string, lastName? : string) : Promise<editState>
{
    if (firstName === undefined && lastName === undefined) return { success: true };
    const supabase = await createClient();
    if (id === undefined)
    {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'You are not logged in.'};
        id = user.id;
    }

    const updates : any = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;

    const { error } = await supabase
    .from('employee')
    .update(updates)
    .eq('id', id);
    
    if (error) return { success: false, error: error.message };
    return { success: true }
}

export async function editEmail(id? : string, email? : string) : Promise<editState>
{
    if (email === undefined) return { success: true }
    const supabase = await createClient();
    if (id === undefined)
    {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'You are not logged in.'};
        id = user.id;
    }

    const { data, error } = await supabase.auth.updateUser({ 
        email: email,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function editRole(id? : string, role? : string) : Promise<editState>
{
    if (role === undefined) return { success: true };
    const supabase = await createClient();
    if (id === undefined)
    {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'You are not logged in.'};
        id = user.id;
    }

    const { error } = await supabase
    .from('employee') 
    .update({
        role: role,
    })
    .eq('id', id);

    if (error) { return { success: false, error: error.message } };
    return { success: true };  
}

export async function editPassword(id? : string, password? : string) : Promise<editState>
{
    if (password === undefined) return { success: true };
    const supabase = await createClient();
    if (id === undefined)
    {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'You are not logged in.'};
        id = user.id;
    }

    const { data, error } = await supabase.auth.updateUser({ 
        password: password,
    });

    if (error) return { success: false, error: error.message };
    return { success: true }; 
}

export async function editActive(answer : boolean, id? : string, newState? : boolean) : Promise<editState>
{
    if (!answer) return { success: false, error: 'Check your spelling and try again.' };
    if (newState === undefined) return { success: true };
    const supabase = await createClient();
    if (id === undefined)
    {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'You are not logged in.'};
        id = user.id;
    }

    const { error } = await supabase
    .from('employee') 
    .update({
        is_active: newState,
    })
    .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}