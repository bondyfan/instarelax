import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Instagram API not needed - using manual posting" }, { status: 200 });
}
