export type UserRole = 'admin' | 'salesperson';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'other';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  file_name: string;
  is_primary: boolean;
  created_at: string;
  public_url?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  cost_price: number;
  recommended_price: number | null;
  minimum_price: number | null;
  category: string;
  keywords: string[];
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  primary_image_url?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  assigned_salesperson_id: string | null;
  assigned_salesperson?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  quantity: number;
  selling_price: number;
  cost_at_sale: number;
  line_revenue: number;
  line_cost: number;
  line_profit: number;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  payment_id: string;
  sale_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url?: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  proofs?: PaymentProof[];
}

export interface Sale {
  id: string;
  sale_number: string;
  salesperson_id: string;
  salesperson?: {
    id: string;
    full_name: string;
    email: string;
  };
  customer_id: string;
  customer?: {
    id: string;
    name: string;
    company: string | null;
    phone: string;
  };
  customer_name_snapshot: string;
  sale_date: string;
  courier_charge: number;
  courier_cost: number;
  other_charge: number;
  other_cost: number;
  product_revenue: number;
  product_cost: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
  payments?: Payment[];
  total_paid?: number;
  outstanding?: number;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string | null;
  previous_state: any;
  new_state: any;
  notes: string | null;
  created_at: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalGrossProfit: number;
  grossMargin: number;
  salesCount: number;
  customerCount: number;
  totalPaymentsReceived: number;
  outstandingAmount: number;
}
