import type { Metadata } from "next";
import "./globals.css";
import { AgentDrawerProvider } from "@/components/agent/agent-drawer";

export const metadata: Metadata = {
  title: "TradePilot — Autonomous Trade Finance for SMEs",
  description:
    "AI-powered milestone escrow and settlement for international SME trade, built on Arc and USDC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AgentDrawerProvider>{children}</AgentDrawerProvider>
      </body>
    </html>
  );
}
