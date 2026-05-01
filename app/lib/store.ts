import { deliveries as seedDeliveries, purchaseOrders as seedPurchaseOrders, products, type Delivery, type PurchaseOrder } from "./data";

const STORAGE_KEY = "hvac_deliveries";

function loadAdded(): Delivery[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Delivery[]) : [];
  } catch {
    return [];
  }
}

function saveAdded(items: Delivery[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getAllDeliveries(): Delivery[] {
  return [...seedDeliveries, ...loadAdded()];
}

export function addDelivery(delivery: Delivery) {
  const current = loadAdded();
  current.push(delivery);
  saveAdded(current);
}

export function generateDeliveryId(): string {
  const allIds = getAllDeliveries().map((d) => {
    const m = d.id.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  });
  const next = Math.max(0, ...allIds) + 1;
  return `DEL-${String(next).padStart(3, "0")}`;
}

/** Resolve the free-text product field to an id + name pair. */
export function resolveProduct(value: string): { productId: number; productName: string } {
  const byId = products.find((p) => String(p.id) === value.trim());
  if (byId) return { productId: byId.id, productName: byId.name };

  const byName = products.find(
    (p) => p.name.toLowerCase() === value.toLowerCase().trim()
  );
  if (byName) return { productId: byName.id, productName: byName.name };

  // Free-text product not in the catalog — use 0 as sentinel
  return { productId: 0, productName: value.trim() };
}

export function formatDeliveryDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PO_STORAGE_KEY = "hvac_purchase_orders";

function loadAddedPOs(): PurchaseOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PurchaseOrder[]) : [];
  } catch {
    return [];
  }
}

function saveAddedPOs(pos: PurchaseOrder[]) {
  localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(pos));
}

export function getAllPurchaseOrders(): PurchaseOrder[] {
  return [...seedPurchaseOrders, ...loadAddedPOs()];
}

export function addPurchaseOrder(po: PurchaseOrder) {
  const current = loadAddedPOs();
  current.push(po);
  saveAddedPOs(current);
}

export function findPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return getAllPurchaseOrders().find((po) => po.id === id);
}

export function generatePOId(): string {
  const allIds = getAllPurchaseOrders().map((po) => {
    const m = po.id.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  });
  const next = Math.max(0, ...allIds) + 1;
  return `PO-${String(next).padStart(3, "0")}`;
}
