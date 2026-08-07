const OPENAI_API_BASE = "https://api.openai.com/v1";

export interface InvoiceExtraction {
  supplierName: string;
  amount: number;
  currency: string;
  paymentTerms: string;
  milestoneSplit: { label: string; sharePercent: number }[];
  riskScore: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
}

const SYSTEM_PROMPT = `You are TradePilot's invoice analysis agent. Extract structured trade
finance data from raw invoice text and recommend a milestone escrow split
(order / shipment / delivery, percentages summing to 100). Respond with
strict JSON matching the requested schema only, no prose.`;

export async function extractInvoiceData(rawText: string): Promise<InvoiceExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawText },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return JSON.parse(body.choices[0].message.content) as InvoiceExtraction;
}

/**
 * Regex-based fallback used when the OpenAI call fails (missing key, no
 * quota, network error). Keeps the demo walkable end-to-end without a live
 * model — it reads the same "Supplier / Amount / Payment terms" shape our
 * own sample invoices use, rather than returning a blank/zeroed invoice.
 */
export function extractInvoiceDataHeuristically(rawText: string): InvoiceExtraction {
  const supplierMatch = rawText.match(/Supplier:\s*(.+)/i);
  const amountMatch = rawText.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  const currencyMatch = rawText.match(/\b(USD|EUR|AED|GBP)\b/i);
  const percentages = [...rawText.matchAll(/(\d{1,3})\s*%/g)].map((m) => Number(m[1]));

  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0;
  const [order, shipment, delivery] =
    percentages.length >= 3 ? percentages : [30, 40, 30];

  return {
    supplierName: supplierMatch?.[1]?.trim() ?? "Unknown supplier",
    amount,
    currency: currencyMatch?.[1]?.toUpperCase() ?? "USD",
    paymentTerms: `${order} / ${shipment} / ${delivery}`,
    milestoneSplit: [
      { label: "Order", sharePercent: order },
      { label: "Shipment", sharePercent: shipment },
      { label: "Delivery", sharePercent: delivery },
    ],
    riskScore: "LOW",
    recommendation: "Milestone escrow (heuristic fallback — AI extraction unavailable)",
  };
}
