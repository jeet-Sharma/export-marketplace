// Warehouse stock levels per product/SKU.

export const inventoryStats = [
  {
    id: "skus",
    label: "Active SKUs",
    value: "17",
    delta: "+1",
    trend: "up",
  },
  {
    id: "lowStock",
    label: "Low Stock",
    value: "2",
    delta: "needs restock",
    trend: "down",
  },
  {
    id: "outOfStock",
    label: "Out of Stock",
    value: "1",
    delta: "blocking orders",
    trend: "down",
  },
  {
    id: "value",
    label: "Stock Value",
    value: "$31,450",
    delta: "+6%",
    trend: "up",
  },
];

export const inventoryItems = [
  {
    id: "inv-1",
    sku: "TUR-500",
    product: "Turmeric Powder",
    warehouse: "Erode, IN",
    onHand: 4200,
    reserved: 2000,
    threshold: 800,
    unit: "kg",
    status: "inStock",
  },
  {
    id: "inv-2",
    sku: "BED-CTN-01",
    product: "Cotton Bedsheet",
    warehouse: "Karur, IN",
    onHand: 640,
    reserved: 500,
    threshold: 200,
    unit: "sets",
    status: "inStock",
  },
  {
    id: "inv-3",
    sku: "WD-HC-220",
    product: "Wooden Handicraft",
    warehouse: "Jodhpur, IN",
    onHand: 18,
    reserved: 0,
    threshold: 20,
    unit: "units",
    status: "low",
  },
  {
    id: "inv-4",
    sku: "CHL-900",
    product: "Red Chilli Powder",
    warehouse: "Guntur, IN",
    onHand: 0,
    reserved: 0,
    threshold: 300,
    unit: "kg",
    status: "outOfStock",
  },
];

export const inventoryMeta = {
  panelTitle: "Stock Levels",
  searchPlaceholder: "Search SKUs...",
};
