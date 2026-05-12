"use client";

import { ColumnDef } from '@tanstack/react-table';

export type PendingDeliveryItem = {
    po_number: string;
    items: { name: string, quantity: number, specifications: string }[];
    rawRequest: { poNumber: string; items: any[] }; 
};

export const getPendingDeliveryColumns = (
    onSelect: (req: any) => void
): ColumnDef<PendingDeliveryItem>[] => [
    {
        accessorKey: 'po_number',
        header: 'PO Number',
        cell: ({ row }) => <span className="font-bold text-gray-900 uppercase">{row.original.po_number}</span>
    },
    {
        id: 'items',
        header: 'Items Expected',
        cell: ({ row }) => (
            <ul className="text-sm text-gray-600 list-disc list-inside">
                {row.original.items.map((item, idx) => (
                    <li key={idx}>
                        <span className="font-semibold text-gray-800">{item.quantity}x</span> {item.name}
                        {item.specifications && (
                            <span className="text-gray-400 italic ml-1">({item.specifications})</span>
                        )}
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
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevents row double-firing
                        // row.original points directly to the PendingDeliveryItem object structure
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