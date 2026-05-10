"use client";

import { ColumnDef } from '@tanstack/react-table';

export type PendingRequestItem = {
    id: string;
    displayId: string;
    items: { line_number: number, name: string, quantity: number }[];
    rawRequest: any; // Keep the raw data around so we can pass it to sessionStorage
};

// We export this as a function so we can pass the router click handler in!
export const getPendingRequestColumns = (
    onSelect: (req: any) => void
): ColumnDef<PendingRequestItem>[] => [
    {
        accessorKey: 'displayId',
        header: 'Request ID',
        cell: ({ row }) => <span className="font-bold text-gray-900 uppercase">{row.original.displayId}</span>
    },
    {
        id: 'items',
        header: 'Items Expected',
        cell: ({ row }) => (
            <ul className="text-sm text-gray-600 list-disc list-inside">
                {row.original.items.map((item, idx) => (
                    <li key={idx}>
                        <span className="font-semibold text-gray-800">{item.quantity}x</span> {item.name}
                    </li>
                ))}
            </ul>
        )
    },
    {
        id: 'action',
        header: () => <div className="text-right pr-2">Action</div>,
        cell: ({ row }) => (
            <div className="text-right">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevents double-firing if the row is also clickable
                        onSelect(row.original.rawRequest);
                    }}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition active:scale-95"
                >
                    Select &rarr;
                </button>
            </div>
        )
    }
];