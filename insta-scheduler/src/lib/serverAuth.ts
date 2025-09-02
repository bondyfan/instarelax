import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function getServerUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const db = getAdminDb();
    const doc = await db.collection("users").doc(decoded.uid).get();
    return { uid: decoded.uid, ...(doc.exists ? doc.data() : {}) } as any;
  } catch {
    return null;
  }
}


