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
                <TableHeader className="table-header-accent">
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="p-3 sm:p-4 h-auto text-black font-bold text-xs uppercase tracking-wider whitespace-nowrap">
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
                                    className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                                    onClick={ () => onRowClick?.(row.original) }>
                                    { row.getVisibleCells().map((cell) => (
                                        <TableCell key={ cell.id } className="p-3 sm:p-4 text-sm">
                                            { flexRender(cell.column.columnDef.cell, cell.getContext()) }
                                        </TableCell>
                                    )) }
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={ columns.length } className='p-10 text-center text-gray-500 italic'>
                                    No results.
                                </TableCell>
                            </TableRow>
                        ) }
                </TableBody>
            </Table>
            <div className='flex gap-4 justify-center py-3 border-t border-gray-100 text-sm font-medium text-gray-600'>
                <button onClick={ table.previousPage } className="hover:text-black transition">
                    Prev
                </button>
                <button onClick={ table.nextPage } className="hover:text-black transition">
                    Next
                </button>
            </div>
        </div>
    )
};