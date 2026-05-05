import { ColumnDef } from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Employee = {
    id: string,
    first_name: string,
    last_name: string,
    email: string,
    role: 'unassigned' | 'administrator' | 'project_manager' | 'logistician' | 'foreman',
    is_active: boolean,
};

export const employeeColumns: ColumnDef<Employee>[] = [
    {
        id: 'full_name',
        header: 'Name',
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'role',
        header: "Role",
    },
    {
        id: 'action',
        header: ({ table }) => {
            const role = (table.options.meta as any)?.role;
            return (role == 'administrator') ? "Action" : null;
        },
        cell: ({ table, row }) => {
            const role = (table.options.meta as any)?.role;  
            if (role == 'administrator') return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        { role == 'administrator' && <DropdownMenuItem asChild>
                            <Link href={ `contacts/${ row.original.id }` }>
                                Edit
                            </Link>
                        </DropdownMenuItem> }
                        { role == 'administrator' && <DropdownMenuItem asChild>
                            <Link href={ `contacts/${ row.original.id }` }>
                                Assign Role
                            </Link>
                        </DropdownMenuItem> }
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
];