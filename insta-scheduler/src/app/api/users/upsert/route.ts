import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getServerUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const serverUser = await getServerUser();
  if (!serverUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<{ displayName: string; email: string; photoURL: string; }>
  const db = getAdminDb();
  await db.collection("users").doc(serverUser.uid).set(
    {
      uid: serverUser.uid,
      displayName: body.displayName ?? (serverUser as any).displayName ?? null,
      email: body.email ?? (serverUser as any).email ?? null,
      photoURL: body.photoURL ?? (serverUser as any).photoURL ?? null,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}


