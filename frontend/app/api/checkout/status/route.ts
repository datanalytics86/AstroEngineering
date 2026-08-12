import { NextResponse } from "next/server";
import { stripeConfigured } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: stripeConfigured() });
}
