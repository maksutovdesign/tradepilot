import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const buyer = await prisma.company.create({
    data: {
      name: "Dubai Trading LLC",
      users: { create: { email: "ops@dubaitrading.example", name: "Ops" } },
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      companyId: buyer.id,
      invoiceNumber: "INV-2048",
      supplierName: "European Industrial GmbH",
      amount: 100000,
      currency: "USD",
      paymentTerms: "30 / 40 / 30",
      aiRiskScore: "LOW",
      aiRecommendation: "Milestone escrow",
      status: "TRADE_CREATED",
    },
  });

  const trade = await prisma.trade.create({
    data: {
      invoiceId: invoice.id,
      buyerId: buyer.id,
      supplierName: invoice.supplierName,
      totalAmount: 100000,
      releasedAmount: 70000,
      status: "IN_PROGRESS",
      contractAddress: "0x7F3a0000000000000000000000000000029A1",
      milestones: {
        create: [
          { label: "Order", sharePercent: 30, amount: 30000, condition: "ORDER_CONFIRMED", status: "RELEASED", releasedAt: new Date() },
          { label: "Shipment", sharePercent: 40, amount: 40000, condition: "SHIPMENT_CONFIRMED", status: "RELEASED", releasedAt: new Date() },
          { label: "Delivery", sharePercent: 30, amount: 30000, condition: "DELIVERY_CONFIRMED", status: "IN_ESCROW" },
        ],
      },
    },
  });

  await prisma.agentAction.create({
    data: {
      tradeId: trade.id,
      type: "RELEASE_MILESTONE",
      description: "Shipment confirmed — release milestone 2 to European Industrial GmbH",
      amount: 40000,
      status: "EXECUTED",
      requiresApproval: true,
    },
  });

  console.log(`Seeded company ${buyer.id} with trade ${trade.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
