import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isTheme } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { theme } = await req.json();
  if (!isTheme(theme)) {
    return NextResponse.json({ error: "Unknown theme." }, { status: 400 });
  }

  getDb().prepare("UPDATE users SET theme = ? WHERE id = ?").run(theme, me.id);
  return NextResponse.json({ ok: true, theme });
}
