import { Timestamp } from 'firebase/firestore';

export type PostType = 'listing' | 'looking_for' | 'announcement';
export type PostStatus = 'active' | 'draft' | 'pending_payment' | 'expired' | 'deleted';

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

export type PaymentMethod = 'mtn_momo' | 'airtel_money';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export interface AnnouncementPayment {
  id: string;
  postId: string;
  payerId: string;
  payerPhone: string;
  amount: number;
  currency: 'UGX';
  iotecExternalId: string;
  iotecRequestId: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Timestamp;
  confirmedAt: Timestamp | null;
}
