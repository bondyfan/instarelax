import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export interface ServerUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export async function getServerUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const db = getAdminDb();
    const doc = await db.collection("users").doc(decoded.uid).get();
    const data = (doc.exists ? doc.data() : {}) as Partial<ServerUser>;
    return { uid: decoded.uid, ...data } as ServerUser;
  } catch {
    return null;
  }
}


