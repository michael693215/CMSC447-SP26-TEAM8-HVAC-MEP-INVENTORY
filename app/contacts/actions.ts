'use server'

import { createClient } from '@/lib/supabase/server'
import { Employee, employeeColumns } from '@/components/columns/Employee'

export async function getEmployees() : Promise<Employee[] | null>
{
    const supabase = await createClient();
    const { data, error } = await supabase
    .from('employee')
    .select('*');
    if (data && data.length != 0)
    {
        return data;
    }
    return null;
}