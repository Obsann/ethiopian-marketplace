export type UserRole = 'buyer' | 'seller' | 'admin';
export type ListingStatus = 'active' | 'sold' | 'removed';
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair';
export type TransactionStatus = 'pending' | 'held' | 'released' | 'refunded' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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
  seller?: { id: string; name: string; is_verified: boolean };
  primary_image?: string | null;
  view_count?: number;
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
  listing?: { id: string; title: string; status: string };
}

export interface Notification {
  id: string;
  type:
    | 'new_message'
    | 'new_offer'
    | 'listing_sold'
    | 'verification_approved'
    | 'verification_rejected'
    | 'payment_failed'
    | 'payment_refunded'
    | 'funds_released';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationPreview {
  listing_id: string;
  listing_title: string;
  other_user: { id: string; name: string };
  last_message: Message;
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

export interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
