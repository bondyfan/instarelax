export type InstagramAccount = {
  id: string;
  username: string;
  account_type: "PERSONAL" | "BUSINESS";
  media_count?: number;
};

export type InstagramConnection = {
  userId: string;
  accessToken: string;
  instagramUserId: string;
  username: string;
  accountType: string;
  connectedAt: number;
  expiresAt?: number;
};

export type InstagramMediaContainer = {
  id: string;
};
