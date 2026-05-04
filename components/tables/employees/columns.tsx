import { ColumnDef } from '@tanstack/react-table'

export type Employee = {
    id: string,
    first_name: string,
    last_name: string,
    email: string,
    role: 'unassigned' | 'administrator' | 'project_manager' | 'logistician' | 'foreman',
    is_active: boolean,
};

export const columns: ColumnDef<Employee>[] = [
    {
        id: 'full_name',
        header: 'First Name',
        accessorFn: (row) => `${row.first_name} ${row.last_name}`
    },
    {
        accessorKey: 'email',
        header: 'Email'
    },
    {
        accessorKey: 'role',
        header: "Role",
    },
];