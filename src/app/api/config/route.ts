import { configService } from "@/lib/config-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Category required" }, { status: 400 });
  }

  const config = await configService.getCategory(category);
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  // Admin only: update config
  const { category, key, value, encrypt } = await req.json();

  // TODO: Add auth check (admin role)
  await configService.set(category, key, value, encrypt);

  return NextResponse.json({ success: true });
}
