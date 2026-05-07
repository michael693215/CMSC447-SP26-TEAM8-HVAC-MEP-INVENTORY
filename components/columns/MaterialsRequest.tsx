import { ColumnDef } from '@tanstack/react-table'

export type MaterialsRequest = {
    id: string,
    first_name: string,
    last_name: string,
    date: string,
    status: 'pending' | 'completed'
};

export const materialsRequestColumns : ColumnDef<MaterialsRequest>[] = [
    {
        id: 'full_name',
        accessorFn: (row) => `${ row.first_name } ${ row.last_name }`,
    },
    {
        accessorKey: 'id',
        header: 'id',
    },
    {
        accessorKey: 'foreman_id',
        header: 'Foreman'
    }
]