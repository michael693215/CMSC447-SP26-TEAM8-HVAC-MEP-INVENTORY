export type DeliveryStatus = "Delivered" | "In Transit" | "Pending";
export type PurchaseOrderStatus = "Pending" | "In Transit" | "Received";

export interface Location {
  id: number;
  name: string;
}

export const locations: Location[] = [
  { id: 1, name: "Main Warehouse" },
  { id: 2, name: "Building A - Mechanical Room" },
  { id: 3, name: "Building B - Rooftop Unit" },
  { id: 4, name: "Field Office" },
  { id: 5, name: "Job Site - Downtown" },
];

export interface Delivery {
  id: string;
  date: string;
  productName: string;
  productId: number;
  qty: number;
  status: DeliveryStatus;
  supplier: string;
  po: string;
  signedBy: string;
  notes: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  qty: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  category: string;
  deliveryIds: string[];
}

export interface POLineItem {
  productId: number;
  productName: string;
  qty: number;
  specs?: string;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  location: string;
  items: POLineItem[];
  status: PurchaseOrderStatus;
  notes: string;
}

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-001",
    date: "Mar 10, 2026",
    location: "Main Warehouse",
    items: [{ productId: 1, productName: "Filter 16x25x1", qty: 20 }],
    status: "Received",
    notes: "Standard spring restock",
  },
  {
    id: "PO-002",
    date: "Mar 28, 2026",
    location: "Building A - Mechanical Room",
    items: [
      { productId: 1, productName: "Filter 16x25x1", qty: 25 },
      { productId: 2, productName: "Capacitor 45/5 MFD", qty: 8 },
    ],
    status: "Pending",
    notes: "Awaiting warehouse confirmation",
  },
  {
    id: "PO-003",
    date: "Mar 15, 2026",
    location: "Main Warehouse",
    items: [{ productId: 2, productName: "Capacitor 45/5 MFD", qty: 12 }],
    status: "Received",
    notes: "",
  },
  {
    id: "PO-004",
    date: "Feb 05, 2026",
    location: "Field Office",
    items: [{ productId: 3, productName: "Thermostat T6 Pro", qty: 5 }],
    status: "Received",
    notes: "Priority order",
  },
  {
    id: "PO-005",
    date: "Mar 18, 2026",
    location: "Job Site - Downtown",
    items: [{ productId: 3, productName: "Thermostat T6 Pro", qty: 3 }],
    status: "In Transit",
    notes: "Estimated arrival Apr 5",
  },
];

export const deliveries: Delivery[] = [
  {
    id: "DEL-102",
    date: "Mar 15, 2026",
    productName: "Filter 16x25x1",
    productId: 1,
    qty: 20,
    status: "Delivered",
    supplier: "Miller Residential HVAC",
    po: "PO-001",
    signedBy: "J. Miller",
    notes: "Standard spring restock",
  },
  {
    id: "DEL-205",
    date: "Apr 02, 2026",
    productName: "Filter 16x25x1",
    productId: 1,
    qty: 25,
    status: "Pending",
    supplier: "Miller Residential HVAC",
    po: "PO-002",
    signedBy: "",
    notes: "Awaiting warehouse confirmation",
  },
  {
    id: "DEL-882",
    date: "Mar 20, 2026",
    productName: "Capacitor 45/5 MFD",
    productId: 2,
    qty: 12,
    status: "Delivered",
    supplier: "Davis Parts & Supply",
    po: "PO-003",
    signedBy: "R. Davis",
    notes: "",
  },
  {
    id: "DEL-441",
    date: "Feb 10, 2026",
    productName: "Thermostat T6 Pro",
    productId: 3,
    qty: 5,
    status: "Delivered",
    supplier: "City Property Mgmt",
    po: "PO-004",
    signedBy: "S. Chen",
    notes: "Priority order",
  },
  {
    id: "DEL-990",
    date: "Mar 22, 2026",
    productName: "Thermostat T6 Pro",
    productId: 3,
    qty: 3,
    status: "In Transit",
    supplier: "City Property Mgmt",
    po: "PO-005",
    signedBy: "",
    notes: "Estimated arrival Apr 5",
  },
];

export const products: Product[] = [
  {
    id: 1,
    name: "Filter 16x25x1",
    description: "Standard pleated air filter",
    qty: 45,
    status: "In Stock",
    category: "Filters",
    deliveryIds: ["DEL-102", "DEL-205"],
  },
  {
    id: 2,
    name: "Capacitor 45/5 MFD",
    description: "Dual run capacitor for AC",
    qty: 12,
    status: "Low Stock",
    category: "Electrical",
    deliveryIds: ["DEL-882"],
  },
  {
    id: 3,
    name: "Thermostat T6 Pro",
    description: "Programmable Wi-Fi thermostat",
    qty: 8,
    status: "In Stock",
    category: "Controls",
    deliveryIds: ["DEL-441", "DEL-990"],
  },
];

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getDeliveriesForProduct(productId: number): Delivery[] {
  return deliveries.filter((d) => d.productId === productId);
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return purchaseOrders.find((po) => po.id === id);
}

export function getPurchaseOrdersForProduct(productId: number): PurchaseOrder[] {
  return purchaseOrders.filter((po) => po.items.some((item) => item.productId === productId));
}
