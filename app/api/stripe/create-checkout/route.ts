import { NextResponse } from "next/server";

// Subscriptions are deprecated — credits only model. Use /api/stripe/create-credit-checkout instead.
export async function POST() {
  return NextResponse.json({ error: "Deprecated — use /api/stripe/create-credit-checkout" }, { status: 410 });
}
