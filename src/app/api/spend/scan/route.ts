import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// Reads a receipt photo or payment screenshot (Venmo, Apple Pay, etc.) and
// extracts store / item / amount to pre-fill the kid's logging form. The kid
// still confirms before anything is saved.

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["merchant", "item", "amount", "currency"],
  properties: {
    merchant: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "The store or restaurant name. For a payment screenshot (Venmo etc.), the person or business who was paid.",
    },
    item: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "A short 2-5 word description of what was bought. For a payment screenshot, the payment note or memo.",
    },
    amount: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description:
        "The total amount paid in the receipt's own currency, after tax and tip. For a receipt, use the final total.",
    },
    currency: {
      anyOf: [
        { type: "string", enum: ["USD", "AUD", "EUR", "GBP", "CAD", "NZD", "JPY", "MXN"] },
        { type: "null" },
      ],
      description:
        "The currency the amount is in. Infer from symbols (A$, €, £), the language, tax labels (GST = likely AUD/NZD), or the country of the business. Use USD when there is no evidence otherwise, null only if the amount itself is null.",
    },
  },
} as const;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = (body.token || "").trim();
  const kid = await prisma.kid.findUnique({ where: { token } });
  if (!kid) return NextResponse.json({ error: "Unknown link" }, { status: 404 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Receipt scanning isn't set up yet — ask your parent to add the API key" },
      { status: 503 }
    );
  }

  const image: string = body.image || "";
  const mediaType: MediaType = MEDIA_TYPES.includes(body.mediaType)
    ? body.mediaType
    : "image/jpeg";
  if (!image) return NextResponse.json({ error: "No image received" }, { status: 400 });

  // Receipt reading is a simple extraction task — Haiku (Anthropic's cheapest
  // vision model, ~$0.002/scan) handles it well. Set SCAN_MODEL to use a
  // bigger model without a code change.
  const client = new Anthropic();
  const response = await client.messages.create({
    model: process.env.SCAN_MODEL || "claude-haiku-4-5",
    max_tokens: 1000,
    output_config: {
      format: { type: "json_schema", schema: EXTRACT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: image },
          },
          {
            type: "text",
            text: "This is a photo of a purchase receipt, or a screenshot of a payment (Venmo, Apple Pay, bank app, etc.). Extract the purchase details. Use null for anything you can't read or that isn't present. If the image is not a receipt or payment record at all, return null for every field.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return NextResponse.json(
      { error: "Couldn't read that image — try typing it in instead" },
      { status: 422 }
    );
  }

  const textBlock = response.content.find((b) => b.type === "text");
  let parsed: {
    merchant: string | null;
    item: string | null;
    amount: number | null;
    currency: string | null;
  };
  try {
    parsed = JSON.parse(textBlock?.text || "");
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that image — try typing it in instead" },
      { status: 422 }
    );
  }

  if (!parsed.merchant && !parsed.amount) {
    return NextResponse.json(
      { error: "That doesn't look like a receipt or payment screenshot" },
      { status: 422 }
    );
  }

  return NextResponse.json({
    merchant: parsed.merchant,
    item: parsed.item,
    amount: parsed.amount != null ? Math.round(parsed.amount * 100) / 100 : null,
    currency: parsed.currency || "USD",
  });
}
