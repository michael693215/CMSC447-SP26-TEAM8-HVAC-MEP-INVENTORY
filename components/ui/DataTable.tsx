import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Role } from '@/lib/types'

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[],
    data: TData[],
    role: Role,
    onRowClick?: (row: TData) => void,
}

export function DataTable<TData, TValue>({ columns, data, role, onRowClick } : DataTableProps<TData, TValue>) 
{
    const table = useReactTable({
        data, 
        columns, 
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta: {
            role,
        }
    })

    return (
        <div>
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    ))}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                    { table.getRowModel().rows?.length ? 
                        (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={ row.id }
                                    data-state={ row.getIsSelected() && 'selected' }
                                    onClick={ () => onRowClick?.(row.original) }>
                                    { row.getVisibleCells().map((cell) => (
                                        <TableCell key={ cell.id }>
                                            { flexRender(cell.column.columnDef.cell, cell.getContext()) }
                                        </TableCell>
                                    )) } 
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={ columns.length } className='h-24 text-center'>
                                    No Results.
                                </TableCell>
                            </TableRow> 
                        ) }
                </TableBody>
            </Table>
            <div className='flex gap-4 justify-center'>
                <button onClick={ table.previousPage }>
                    Prev
                </button>
                <button onClick={ table.nextPage }>
                    Next
                </button>
            </div>
        </div>
    )
};