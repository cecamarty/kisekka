import { Timestamp } from 'firebase/firestore';

export type PostType = 'listing' | 'looking_for' | 'announcement';
export type PostStatus = 'active' | 'expired';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorShopName: string;
  authorProfilePhotoUrl: string | null;
  type: PostType;
  description: string;
  mediaUrls: string[];
  categories: string[];
  marketLocation: string;
  viewCount: number;
  whatsappTapCount: number;
  saveCount: number;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
  status: PostStatus;
}

export interface SavedPost {
  postId: string;
  savedAt: Timestamp;
}
