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
