export type UserRole = 'buyer' | 'seller' | 'admin';
export type ListingStatus = 'active' | 'sold' | 'removed';
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair';
export type TransactionStatus = 'pending' | 'held' | 'released' | 'refunded' | 'failed';
export type ReportTargetType = 'listing' | 'user';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType =
  | 'new_message'
  | 'new_offer'
  | 'listing_sold'
  | 'verification_approved'
  | 'verification_rejected'
  | 'payment_failed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  category_id: string;
  location: string;
  status: ListingStatus;
  images: string[];
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  content: string;
  type?: 'text' | 'offer';
  offer_amount?: number | null;
  read_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  chapa_ref: string;
  status: TransactionStatus;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  condition?: ListingCondition;
  location?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}
