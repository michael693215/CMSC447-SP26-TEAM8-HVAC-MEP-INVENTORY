'use server'
import { createClient } from '@/lib/supabase/server'
import { Role } from '@/lib/types'

export async function getUserRole() : Promise<Role> {
    const supabase = await createClient();
    const { data: { user } }  = await supabase.auth.getUser();
    return user?.app_metadata?.permissions || 'unassigned';
}