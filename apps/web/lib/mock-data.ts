export type MilestoneStatus = "released" | "confirmed" | "in_escrow" | "pending";

export type Milestone = {
  id: string;
  label: string;
  amount: number;
  share: number;
  status: MilestoneStatus;
};

export type Trade = {
  id: string;
  invoiceNumber: string;
  supplier: string;
  totalAmount: number;
  releasedAmount: number;
  status: string;
  milestones: Milestone[];
  contractAddress: string;
  network: string;
};

export const trades: Trade[] = [
  {
    id: "inv-2048",
    invoiceNumber: "INV-2048",
    supplier: "European Industrial GmbH",
    totalAmount: 100000,
    releasedAmount: 70000,
    status: "Shipment confirmed",
    contractAddress: "0x7F3a...29A1",
    network: "Arc Testnet",
    milestones: [
      { id: "order", label: "Order", amount: 30000, share: 30, status: "released" },
      { id: "shipment", label: "Shipment", amount: 40000, share: 40, status: "released" },
      { id: "delivery", label: "Delivery", amount: 30000, share: 30, status: "in_escrow" },
    ],
  },
  {
    id: "inv-2047",
    invoiceNumber: "INV-2047",
    supplier: "Nordic Supply Co.",
    totalAmount: 8400,
    releasedAmount: 8400,
    status: "Completed",
    contractAddress: "0x4B1c...77D2",
    network: "Arc Testnet",
    milestones: [
      { id: "order", label: "Order", amount: 2520, share: 30, status: "released" },
      { id: "shipment", label: "Shipment", amount: 3360, share: 40, status: "released" },
      { id: "delivery", label: "Delivery", amount: 2520, share: 30, status: "released" },
    ],
  },
  {
    id: "inv-2046",
    invoiceNumber: "INV-2046",
    supplier: "Al Maktoum Trading Partners",
    totalAmount: 17200,
    releasedAmount: 17200,
    status: "Completed",
    contractAddress: "0x9A2f...11C4",
    network: "Arc Testnet",
    milestones: [
      { id: "order", label: "Order", amount: 5160, share: 30, status: "released" },
      { id: "shipment", label: "Shipment", amount: 6880, share: 40, status: "released" },
      { id: "delivery", label: "Delivery", amount: 5160, share: 30, status: "released" },
    ],
  },
];

export const treasury = {
  total: 482400,
  available: 382400,
  inEscrow: 100000,
  byNetwork: [
    { network: "Arc", amount: 182400 },
    { network: "Ethereum", amount: 200000 },
    { network: "Other", amount: 100000 },
  ],
  recent: [
    { label: "Invoice settlement", amount: 24800, direction: "in" as const },
    { label: "Milestone release", amount: -40000, direction: "out" as const },
    { label: "Treasury deposit", amount: 50000, direction: "in" as const },
  ],
};

export const creditPassport = {
  company: "Dubai Trading LLC",
  totalVolume: 482400,
  completedTrades: 38,
  onTimeRate: 97.4,
  avgSettlementSeconds: 2.8,
  disputes: 1,
  potentialFacility: 75000,
  history: [
    { invoiceNumber: "INV-2048", amount: 100000, status: "paid" },
    { invoiceNumber: "INV-2047", amount: 24800, status: "paid" },
    { invoiceNumber: "INV-2046", amount: 17200, status: "paid" },
    { invoiceNumber: "INV-2045", amount: 31600, status: "paid" },
  ],
};
