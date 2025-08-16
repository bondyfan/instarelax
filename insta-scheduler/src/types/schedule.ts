export type MediaType = "image" | "video";

export type ScheduledPost = {
  id: string;
  userId: string;
  caption: string;
  mediaUrl: string;
  mediaStorageKey?: string;
  mediaType: MediaType;
  scheduledAt: number; // epoch ms
  status: "pending" | "published" | "failed";
  createdAt: number;
  updatedAt: number;
};


