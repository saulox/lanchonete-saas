export type UserRole = 'admin' | 'operator' | 'kitchen' | 'customer';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'pix' | 'cash' | 'card';
export type PaymentStatus = 'pending' | 'awaiting_confirmation' | 'paid' | 'failed' | 'refunded';

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['stores']['Insert\]>;
      };
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          accepts_promotions: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          accepts_promotions?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert\]>;
      };
      store_memberships: {
        Row: {
          id: string;
          store_id: string;
          profile_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          profile_id: string;
          role: UserRole;
        };
        Update: Partial<Database['public']['Tables']['store_memberships']['Insert\]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          description: string | null;
          price: number;
          is_active: boolean;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          price: number;
          is_active?: boolean;
          image_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert\]>;
      };
      promotions: {
        Row: {
          id: string;
          store_id: string;
          title: string;
          description: string | null;
          code: string | null;
          discount_percent: number;
          active: boolean;
          starts_at: string | null;
          ends_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          title: string;
          description?: string | null;
          code?: string | null;
          discount_percent: number;
          active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['promotions']['Insert\]>;
      };
      marketing_leads: {
        Row: {
          id: string;
          store_id: string;
          phone: string;
          full_name: string | null;
          accepts_promotions: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          phone: string;
          full_name?: string | null;
          accepts_promotions?: boolean;
        };
        Update: Partial<Database['public']['Tables']['marketing_leads']['Insert\]>;
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          customer_id: string | null;
          phone: string;
          customer_name: string;
          status: OrderStatus;
          subtotal_amount: number;
          discount_amount: number;
          total_amount: number;
          coupon_code: string | null;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          payment_reference: string | null;
          payment_provider: string | null;
          paid_at: string | null;
          pix_copy_paste: string | null;
          pix_qr_code_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          customer_id?: string | null;
          phone: string;
          customer_name: string;
          status?: OrderStatus;
          subtotal_amount?: number;
          discount_amount?: number;
          total_amount: number;
          coupon_code?: string | null;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          payment_reference?: string | null;
          payment_provider?: string | null;
          paid_at?: string | null;
          pix_copy_paste?: string | null;
          pix_qr_code_url?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert\]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert\]>;
      };
    };
  };
};
