"use server";

import { getServerUser } from "@/lib/serverAuth";

export async function assertAuthenticated() {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}


