import { NextRequest } from "next/server";
import { proxyFetch } from "@/lib/proxy-fetch";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyFetch("/api/chart", body);
}
