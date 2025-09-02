import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getServerUser, ServerUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const serverUser = await getServerUser();
  if (!serverUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<{ displayName: string; email: string; photoURL: string; }>
  const db = getAdminDb();
  const su = serverUser as ServerUser;
  await db.collection("users").doc(su.uid).set(
    {
      uid: su.uid,
      displayName: body.displayName ?? su.displayName ?? null,
      email: body.email ?? su.email ?? null,
      photoURL: body.photoURL ?? su.photoURL ?? null,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}


