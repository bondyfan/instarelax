import { getApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ScheduledPost } from "@/types/schedule";

export const db = getFirestore(getApp());

// Scheduled Posts Functions
export async function saveScheduledPost(
  userId: string,
  postData: Omit<ScheduledPost, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Date.now();
  const newPost: Omit<ScheduledPost, "id"> = {
    userId,
    createdAt: now,
    updatedAt: now,
    ...postData,
  };

  const docRef = await addDoc(collection(db, "scheduled_posts"), newPost);
  return docRef.id;
}

export async function getScheduledPosts(userId: string): Promise<ScheduledPost[]> {
  const q = query(
    collection(db, "scheduled_posts"),
    where("userId", "==", userId)
    // Note: orderBy removed temporarily while index is building
    // Will be re-enabled once the composite index is ready
  );
  
  const querySnapshot = await getDocs(q);
  const posts = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ScheduledPost[];
  
  // Sort client-side for now
  return posts.sort((a, b) => a.scheduledAt - b.scheduledAt);
}

export async function updateScheduledPost(
  postId: string,
  updates: Partial<Omit<ScheduledPost, "id" | "userId" | "createdAt">>
): Promise<void> {
  const postRef = doc(db, "scheduled_posts", postId);
  await updateDoc(postRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteScheduledPost(postId: string): Promise<void> {
  const postRef = doc(db, "scheduled_posts", postId);
  await deleteDoc(postRef);
}


