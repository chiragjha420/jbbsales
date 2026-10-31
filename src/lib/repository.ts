import fs from 'fs';
import path from 'path';
import {
  Profile,
  Product,
  ProductImage,
  Customer,
  Sale,
  SaleItem,
  Payment,
  PaymentProof,
  AuditLog,
  FinancialSummary,
  PaymentStatus,
  PaymentMethod,
  UserRole,
} from '@/types';
import {
  calculateSaleTotals,
  calculatePaymentStatus,
  round2,
} from '@/lib/calculations';
import { createAdminClient } from '@/lib/supabase/admin';

// Local storage directory for persistent fallback
const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'jbb_sales_store.json');

interface LocalDatabase {
  profiles: Profile[];
  products: Product[];
  product_images: ProductImage[];
  customers: Customer[];
  sales: Sale[];
  sale_items: SaleItem[];
  payments: Payment[];
  payment_proofs: PaymentProof[];
  audit_logs: AuditLog[];
  sale_sequence: number;
}

// Initial real team profiles synced from Supabase Auth
const INITIAL_PROFILES: Profile[] = [
  {
    id: '3c74956b-81b7-4ce3-8b4c-2ee6f9c39820',
    email: 'admin@jbb.com',
    full_name: 'Admin',
    phone: null,
    role: 'admin',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '93174609-0f35-4ca8-a168-9f642a8237a6',
    email: 'buntybhai@jbb.com',
    full_name: 'Bunty Bhai',
    phone: null,
    role: 'salesperson',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5d2c4198-1d71-456f-a647-807a5b6633e2',
    email: 'deepakbhai@jbb.com',
    full_name: 'Deepak Bhai',
    phone: null,
    role: 'salesperson',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '343cb0c9-96c0-4775-848c-091a00ddccc8',
    email: 'lokeshbhai@jbb.com',
    full_name: 'Lokesh Bhai',
    phone: null,
    role: 'salesperson',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '38756b11-1bd4-4112-999b-f688f3174a97',
    email: 'ankitbhai@jbb.com',
    full_name: 'Ankit Bhai',
    phone: null,
    role: 'salesperson',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b75fcd7b-dc39-4560-bb0c-8edcefc959f7',
    email: 'deepubhai@jbb.com',
    full_name: 'Deepu Bhai',
    phone: null,
    role: 'salesperson',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '80dadfe3-0cfa-4e86-8871-91babeccfc98',
    email: 'sanjubhai@jbb.com',
    full_name: 'Sanju Bhai',
    phone: null,
    role: 'salesperson',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_CUSTOMERS: Customer[] = [];

// Helper to ensure database file exists
function ensureDb(): LocalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    const initialDb: LocalDatabase = {
      profiles: INITIAL_PROFILES,
      products: INITIAL_PRODUCTS,
      product_images: [],
      customers: INITIAL_CUSTOMERS,
      sales: [],
      sale_items: [],
      payments: [],
      payment_proofs: [],
      audit_logs: [],
      sale_sequence: 1,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    const initialDb: LocalDatabase = {
      profiles: INITIAL_PROFILES,
      products: INITIAL_PRODUCTS,
      product_images: [],
      customers: INITIAL_CUSTOMERS,
      sales: [],
      sale_items: [],
      payments: [],
      payment_proofs: [],
      audit_logs: [],
      sale_sequence: 1,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
}

// Atomic save helper
function saveDb(db: LocalDatabase): void {
  const tempFile = `${STORE_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tempFile, STORE_FILE);
}

// Check if Supabase tables are ready
let supabaseReady: boolean | null = null;
async function isSupabaseAvailable(): Promise<boolean> {
  if (supabaseReady !== null) return supabaseReady;
  try {
    const client = createAdminClient();
    const { error } = await client.from('products').select('id').limit(1);
    supabaseReady = !error;
    return supabaseReady;
  } catch {
    supabaseReady = false;
    return false;
  }
}

export const repository = {
  // -------------------------------------------------------------------
  // Profiles / Users
  // -------------------------------------------------------------------
  async getProfiles(): Promise<Profile[]> {
    const db = ensureDb();
    return db.profiles.sort((a, b) => a.full_name.localeCompare(b.full_name));
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const db = ensureDb();
    return db.profiles.find((p) => p.id === id) || null;
  },

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const db = ensureDb();
    return db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createProfile(data: { email: string; full_name: string; phone?: string; role: UserRole }): Promise<Profile> {
    const db = ensureDb();
    const existing = db.profiles.find((p) => p.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email already exists.');
    }
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase().trim(),
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.push(newProfile);
    saveDb(db);
    return newProfile;
  },

  async createOrUpdateProfile(data: {
    id?: string;
    email: string;
    full_name: string;
    phone?: string | null;
    role: UserRole;
    active?: boolean;
  }): Promise<Profile> {
    const db = ensureDb();
    const cleanEmail = data.email.toLowerCase().trim();
    const existingIdx = db.profiles.findIndex(
      (p) => (data.id && p.id === data.id) || p.email.toLowerCase() === cleanEmail
    );

    if (existingIdx !== -1) {
      db.profiles[existingIdx] = {
        ...db.profiles[existingIdx],
        id: data.id || db.profiles[existingIdx].id,
        email: cleanEmail,
        full_name: data.full_name.trim() || db.profiles[existingIdx].full_name,
        role: data.role || db.profiles[existingIdx].role,
        active: data.active !== undefined ? data.active : db.profiles[existingIdx].active,
        updated_at: new Date().toISOString(),
      };
      saveDb(db);
      return db.profiles[existingIdx];
    }

    const newProfile: Profile = {
      id: data.id || crypto.randomUUID(),
      email: cleanEmail,
      full_name: data.full_name.trim(),
      phone: data.phone || null,
      role: data.role,
      active: data.active !== undefined ? data.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.push(newProfile);
    saveDb(db);
    return newProfile;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const db = ensureDb();
    const idx = db.profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('User profile not found.');

    db.profiles[idx] = {
      ...db.profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDb(db);
    return db.profiles[idx];
  },

  // -------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------
  async getProducts(options?: { search?: string; category?: string; activeOnly?: boolean }): Promise<Product[]> {
    const db = ensureDb();
    let list = [...db.products];

    if (options?.activeOnly !== false) {
      list = list.filter((p) => p.active);
    }

    if (options?.category && options.category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === options.category?.toLowerCase());
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const skuMatch = p.sku.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const keywordMatch = p.keywords.some((k) => k.toLowerCase().includes(q));
        return nameMatch || skuMatch || descMatch || keywordMatch;
      });
    }

    // Attach primary image and full image list
    return list.map((p) => {
      const images = db.product_images.filter((img) => img.product_id === p.id);
      const primary = images.find((i) => i.is_primary) || images[0];
      return {
        ...p,
        images,
        primary_image_url: primary ? primary.storage_path : undefined,
      };
    });
  },

  async getProductById(id: string): Promise<Product | null> {
    const db = ensureDb();
    const prod = db.products.find((p) => p.id === id);
    if (!prod) return null;

    const images = db.product_images.filter((img) => img.product_id === prod.id);
    const primary = images.find((i) => i.is_primary) || images[0];
    return {
      ...prod,
      images,
      primary_image_url: primary ? primary.storage_path : undefined,
    };
  },

  async createProduct(data: {
    name: string;
    sku?: string;
    description?: string;
    cost_price: number;
    recommended_price?: number;
    minimum_price?: number;
    category?: string;
    keywords: string[];
    images?: Array<{ fileName: string; dataUrl: string; isPrimary?: boolean }>;
    createdBy?: string;
  }): Promise<Product> {
    const db = ensureDb();

    // Auto-generate SKU if omitted
    const sku = data.sku?.trim() || `JBB-${Date.now().toString(36).toUpperCase()}`;

    // Verify SKU uniqueness
    if (db.products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
      throw new Error(`SKU "${sku}" is already in use.`);
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      sku,
      description: data.description?.trim() || null,
      cost_price: round2(data.cost_price),
      recommended_price: data.recommended_price !== undefined ? round2(data.recommended_price) : null,
      minimum_price: data.minimum_price !== undefined ? round2(data.minimum_price) : null,
      category: data.category?.trim() || 'General',
      keywords: data.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
      active: true,
      created_by: data.createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.products.push(newProduct);

    // Save attached photos
    if (data.images && data.images.length > 0) {
      data.images.forEach((img, idx) => {
        const imgRecord: ProductImage = {
          id: crypto.randomUUID(),
          product_id: newProduct.id,
          storage_path: img.dataUrl,
          file_name: img.fileName,
          is_primary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
          created_at: new Date().toISOString(),
        };
        db.product_images.push(imgRecord);
      });
    }

    saveDb(db);
    return (await this.getProductById(newProduct.id))!;
  },

  async updateProduct(id: string, updates: Partial<Product>, performedBy?: string): Promise<Product> {
    const db = ensureDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found.');

    const oldProduct = { ...db.products[idx] };

    // SKU uniqueness check if SKU changed
    if (updates.sku && updates.sku.toLowerCase() !== oldProduct.sku.toLowerCase()) {
      if (db.products.some((p) => p.id !== id && p.sku.toLowerCase() === updates.sku!.toLowerCase())) {
        throw new Error(`SKU "${updates.sku}" is already in use.`);
      }
    }

    db.products[idx] = {
      ...oldProduct,
      ...updates,
      cost_price: updates.cost_price !== undefined ? round2(updates.cost_price) : oldProduct.cost_price,
      recommended_price: updates.recommended_price !== undefined ? (updates.recommended_price !== null ? round2(updates.recommended_price) : null) : oldProduct.recommended_price,
      minimum_price: updates.minimum_price !== undefined ? (updates.minimum_price !== null ? round2(updates.minimum_price) : null) : oldProduct.minimum_price,
      updated_at: new Date().toISOString(),
    };

    // Audit log
    db.audit_logs.push({
      id: crypto.randomUUID(),
      entity_type: 'product',
      entity_id: id,
      action: 'UPDATE',
      performed_by: performedBy || null,
      previous_state: oldProduct,
      new_state: db.products[idx],
      notes: `Updated product ${oldProduct.name}`,
      created_at: new Date().toISOString(),
    });

    saveDb(db);
    return (await this.getProductById(id))!;
  },

  async addProductImage(productId: string, imageData: { fileName: string; dataUrl: string; isPrimary?: boolean }): Promise<ProductImage> {
    const db = ensureDb();
    if (imageData.isPrimary) {
      db.product_images.forEach((img) => {
        if (img.product_id === productId) img.is_primary = false;
      });
    }

    const newImage: ProductImage = {
      id: crypto.randomUUID(),
      product_id: productId,
      storage_path: imageData.dataUrl,
      file_name: imageData.fileName,
      is_primary: imageData.isPrimary || false,
      created_at: new Date().toISOString(),
    };

    db.product_images.push(newImage);
    saveDb(db);
    return newImage;
  },

  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    const db = ensureDb();
    const idx = db.product_images.findIndex((img) => img.id === imageId && img.product_id === productId);
    if (idx !== -1) {
      const wasPrimary = db.product_images[idx].is_primary;
      db.product_images.splice(idx, 1);
      // If deleted image was primary, make the first remaining image primary
      if (wasPrimary) {
        const remaining = db.product_images.filter((img) => img.product_id === productId);
        if (remaining.length > 0) {
          remaining[0].is_primary = true;
        }
      }
      saveDb(db);
    }
  },

  async setPrimaryProductImage(productId: string, imageId: string): Promise<void> {
    const db = ensureDb();
    db.product_images.forEach((img) => {
      if (img.product_id === productId) {
        img.is_primary = img.id === imageId;
      }
    });
    saveDb(db);
  },

  // -------------------------------------------------------------------
  // Customers
  // -------------------------------------------------------------------
  async getCustomers(options?: { search?: string; salespersonId?: string }): Promise<Customer[]> {
    const db = ensureDb();
    let list = [...db.customers];

    if (options?.salespersonId) {
      list = list.filter((c) => c.assigned_salesperson_id === options.salespersonId);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const compMatch = c.company?.toLowerCase().includes(q);
        const phoneMatch = c.phone.includes(q);
        const personMatch = c.contact_person?.toLowerCase().includes(q);
        return nameMatch || compMatch || phoneMatch || personMatch;
      });
    }

    return list.map((c) => {
      const sp = db.profiles.find((p) => p.id === c.assigned_salesperson_id);
      return {
        ...c,
        assigned_salesperson: sp ? { id: sp.id, full_name: sp.full_name, email: sp.email } : undefined,
      };
    });
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const db = ensureDb();
    const c = db.customers.find((cust) => cust.id === id);
    if (!c) return null;
    const sp = db.profiles.find((p) => p.id === c.assigned_salesperson_id);
    return {
      ...c,
      assigned_salesperson: sp ? { id: sp.id, full_name: sp.full_name, email: sp.email } : undefined,
    };
  },

  async createCustomer(data: {
    name: string;
    company?: string;
    contact_person?: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
    assigned_salesperson_id?: string;
    createdBy?: string;
  }): Promise<Customer> {
    const db = ensureDb();
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      company: data.company?.trim() || null,
      contact_person: data.contact_person?.trim() || null,
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      notes: data.notes?.trim() || null,
      assigned_salesperson_id: data.assigned_salesperson_id || data.createdBy || null,
      created_by: data.createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.customers.push(newCustomer);
    saveDb(db);
    return (await this.getCustomerById(newCustomer.id))!;
  },

  async reassignCustomer(customerId: string, newSalespersonId: string, performedBy: string): Promise<Customer> {
    const db = ensureDb();
    const cust = db.customers.find((c) => c.id === customerId);
    if (!cust) throw new Error('Customer not found.');

    const oldSalespersonId = cust.assigned_salesperson_id;
    cust.assigned_salesperson_id = newSalespersonId;
    cust.updated_at = new Date().toISOString();

    db.audit_logs.push({
      id: crypto.randomUUID(),
      entity_type: 'customer',
      entity_id: customerId,
      action: 'REASSIGN',
      performed_by: performedBy,
      previous_state: { assigned_salesperson_id: oldSalespersonId },
      new_state: { assigned_salesperson_id: newSalespersonId },
      notes: `Reassigned customer ${cust.name}`,
      created_at: new Date().toISOString(),
    });

    saveDb(db);
    return (await this.getCustomerById(customerId))!;
  },

  // -------------------------------------------------------------------
  // Sales
  // -------------------------------------------------------------------
  async createSale(data: {
    salespersonId: string;
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      sellingPrice: number;
    }>;
    courierCharge?: number;
    courierCost?: number;
    otherCharge?: number;
    otherCost?: number;
    notes?: string;
    initialPayment?: {
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
      proofs?: Array<{
        fileName: string;
        mimeType: string;
        dataUrl: string;
        size?: number;
      }>;
    };
  }): Promise<Sale> {
    const db = ensureDb();

    if (!data.items || data.items.length === 0) {
      throw new Error('A sale must have at least one product.');
    }

    const customer = db.customers.find((c) => c.id === data.customerId);
    if (!customer) throw new Error('Selected customer does not exist.');

    const salesperson = db.profiles.find((p) => p.id === data.salespersonId);
    if (!salesperson) throw new Error('Salesperson not found.');

    // Generate unique sale number JBB-YYYY-000001
    const currentYear = new Date().getFullYear();
    const seq = db.sale_sequence++;
    const saleNumber = `JBB-${currentYear}-${String(seq).padStart(6, '0')}`;

    const saleId = crypto.randomUUID();

    // Snapshot products and calculate line items
    const preparedItems: SaleItem[] = [];
    const itemTotalsInputs: Array<{ quantity: number; sellingPrice: number; costAtSale: number }> = [];

    for (const item of data.items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const costAtSale = product.cost_price; // CRITICAL: SNAPSHOT COST AT SALE TIME
      const qty = Number(item.quantity);
      const price = Number(item.sellingPrice);

      const lineRev = round2(qty * price);
      const lineCost = round2(qty * costAtSale);
      const lineProfit = round2(lineRev - lineCost);

      preparedItems.push({
        id: crypto.randomUUID(),
        sale_id: saleId,
        product_id: product.id,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku,
        quantity: qty,
        selling_price: price,
        cost_at_sale: costAtSale,
        line_revenue: lineRev,
        line_cost: lineCost,
        line_profit: lineProfit,
        created_at: new Date().toISOString(),
      });

      itemTotalsInputs.push({
        quantity: qty,
        sellingPrice: price,
        costAtSale,
      });
    }

    // Authoritative sale totals calculation
    const totals = calculateSaleTotals({
      items: itemTotalsInputs,
      courierCharge: data.courierCharge,
      courierCost: data.courierCost,
      otherCharge: data.otherCharge,
      otherCost: data.otherCost,
    });

    // Check payment if submitted during sale creation
    let paymentAmount = 0;
    if (data.initialPayment && data.initialPayment.amount > 0) {
      paymentAmount = round2(data.initialPayment.amount);
    }

    const paymentStatus = calculatePaymentStatus(totals.totalRevenue, paymentAmount);

    const newSale: Sale = {
      id: saleId,
      sale_number: saleNumber,
      salesperson_id: salesperson.id,
      customer_id: customer.id,
      customer_name_snapshot: customer.name,
      sale_date: new Date().toISOString(),
      courier_charge: totals.courierCharge,
      courier_cost: totals.courierCost,
      other_charge: totals.otherCharge,
      other_cost: totals.otherCost,
      product_revenue: totals.productRevenue,
      product_cost: totals.productCost,
      total_revenue: totals.totalRevenue,
      total_cost: totals.totalCost,
      gross_profit: totals.grossProfit,
      gross_margin: totals.grossMargin,
      payment_status: paymentStatus,
      notes: data.notes?.trim() || null,
      created_by: salesperson.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.sales.push(newSale);
    db.sale_items.push(...preparedItems);

    // If initial payment exists, record it and proofs
    if (data.initialPayment && data.initialPayment.amount > 0) {
      const paymentId = crypto.randomUUID();
      const newPayment: Payment = {
        id: paymentId,
        sale_id: saleId,
        amount: round2(data.initialPayment.amount),
        payment_method: data.initialPayment.paymentMethod,
        payment_date: new Date().toISOString(),
        notes: data.initialPayment.notes || null,
        recorded_by: salesperson.id,
        created_at: new Date().toISOString(),
      };
      db.payments.push(newPayment);

      if (data.initialPayment.proofs && data.initialPayment.proofs.length > 0) {
        for (const proof of data.initialPayment.proofs) {
          const proofRecord: PaymentProof = {
            id: crypto.randomUUID(),
            payment_id: paymentId,
            sale_id: saleId,
            storage_path: proof.dataUrl,
            file_name: proof.fileName,
            mime_type: proof.mimeType,
            file_size: proof.size || null,
            uploaded_by: salesperson.id,
            created_at: new Date().toISOString(),
          };
          db.payment_proofs.push(proofRecord);
        }
      }
    }

    // Audit log entry
    db.audit_logs.push({
      id: crypto.randomUUID(),
      entity_type: 'sale',
      entity_id: saleId,
      action: 'CREATE',
      performed_by: salesperson.id,
      previous_state: null,
      new_state: {
        saleNumber,
        totalRevenue: totals.totalRevenue,
        grossProfit: totals.grossProfit,
        itemCount: preparedItems.length,
      },
      notes: `Created sale ${saleNumber}`,
      created_at: new Date().toISOString(),
    });

    saveDb(db);
    return (await this.getSaleById(saleId))!;
  },

  async getSales(options?: {
    salespersonId?: string;
    customerId?: string;
    productId?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sort?: 'newest' | 'oldest' | 'highest_revenue' | 'highest_profit';
  }): Promise<Sale[]> {
    const db = ensureDb();
    let list = [...db.sales];

    if (options?.salespersonId) {
      list = list.filter((s) => s.salesperson_id === options.salespersonId);
    }

    if (options?.customerId) {
      list = list.filter((s) => s.customer_id === options.customerId);
    }

    if (options?.paymentStatus && options.paymentStatus !== 'all') {
      list = list.filter((s) => s.payment_status === options.paymentStatus);
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      list = list.filter((s) => new Date(s.sale_date).getTime() >= start);
    }

    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      list = list.filter((s) => new Date(s.sale_date).getTime() <= end);
    }

    if (options?.productId) {
      const saleIdsWithProduct = new Set(
        db.sale_items.filter((item) => item.product_id === options.productId).map((i) => i.sale_id)
      );
      list = list.filter((s) => saleIdsWithProduct.has(s.id));
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter((s) => {
        const numMatch = s.sale_number.toLowerCase().includes(q);
        const custMatch = s.customer_name_snapshot.toLowerCase().includes(q);
        const sp = db.profiles.find((p) => p.id === s.salesperson_id);
        const spMatch = sp?.full_name.toLowerCase().includes(q);
        return numMatch || custMatch || spMatch;
      });
    }

    // Sort order
    switch (options?.sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());
        break;
      case 'highest_revenue':
        list.sort((a, b) => b.total_revenue - a.total_revenue);
        break;
      case 'highest_profit':
        list.sort((a, b) => b.gross_profit - a.gross_profit);
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
        break;
    }

    return list.map((s) => {
      const items = db.sale_items.filter((i) => i.sale_id === s.id);
      const payments = db.payments.filter((p) => p.sale_id === s.id);
      const sp = db.profiles.find((p) => p.id === s.salesperson_id);
      const cust = db.customers.find((c) => c.id === s.customer_id);

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = Math.max(0, s.total_revenue - totalPaid);

      return {
        ...s,
        salesperson: sp ? { id: sp.id, full_name: sp.full_name, email: sp.email } : undefined,
        customer: cust ? { id: cust.id, name: cust.name, company: cust.company, phone: cust.phone } : undefined,
        items,
        payments,
        total_paid: round2(totalPaid),
        outstanding: round2(outstanding),
      };
    });
  },

  async getSaleById(id: string): Promise<Sale | null> {
    const db = ensureDb();
    const sale = db.sales.find((s) => s.id === id);
    if (!sale) return null;

    const items = db.sale_items.filter((i) => i.sale_id === sale.id);
    const payments = db.payments
      .filter((p) => p.sale_id === sale.id)
      .map((p) => {
        const proofs = db.payment_proofs.filter((pf) => pf.payment_id === p.id);
        return {
          ...p,
          proofs,
        };
      });

    const sp = db.profiles.find((p) => p.id === sale.salesperson_id);
    const cust = db.customers.find((c) => c.id === sale.customer_id);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, sale.total_revenue - totalPaid);

    return {
      ...sale,
      salesperson: sp ? { id: sp.id, full_name: sp.full_name, email: sp.email } : undefined,
      customer: cust ? { id: cust.id, name: cust.name, company: cust.company, phone: cust.phone } : undefined,
      items,
      payments,
      total_paid: round2(totalPaid),
      outstanding: round2(outstanding),
    };
  },

  // -------------------------------------------------------------------
  // Payments & Proofs
  // -------------------------------------------------------------------
  async addPayment(
    saleId: string,
    data: {
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
      recordedBy: string;
      proofs?: Array<{
        fileName: string;
        mimeType: string;
        dataUrl: string;
        size?: number;
      }>;
    }
  ): Promise<Payment> {
    const db = ensureDb();
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Sale not found.');

    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    if (!data.proofs || data.proofs.length === 0) {
      throw new Error('Payment proof is required.');
    }

    const paymentId = crypto.randomUUID();
    const newPayment: Payment = {
      id: paymentId,
      sale_id: saleId,
      amount: round2(data.amount),
      payment_method: data.paymentMethod,
      payment_date: new Date().toISOString(),
      notes: data.notes?.trim() || null,
      recorded_by: data.recordedBy,
      created_at: new Date().toISOString(),
    };

    db.payments.push(newPayment);

    // Insert payment proof images
    const savedProofs: PaymentProof[] = [];
    for (const proof of data.proofs) {
      const proofRecord: PaymentProof = {
        id: crypto.randomUUID(),
        payment_id: paymentId,
        sale_id: saleId,
        storage_path: proof.dataUrl,
        file_name: proof.fileName,
        mime_type: proof.mimeType,
        file_size: proof.size || null,
        uploaded_by: data.recordedBy,
        created_at: new Date().toISOString(),
      };
      db.payment_proofs.push(proofRecord);
      savedProofs.push(proofRecord);
    }

    // Recalculate sale payment status
    const allSalePayments = db.payments.filter((p) => p.sale_id === saleId);
    const totalPaid = allSalePayments.reduce((sum, p) => sum + p.amount, 0);
    sale.payment_status = calculatePaymentStatus(sale.total_revenue, totalPaid);
    sale.updated_at = new Date().toISOString();

    db.audit_logs.push({
      id: crypto.randomUUID(),
      entity_type: 'payment',
      entity_id: paymentId,
      action: 'ADD_PAYMENT',
      performed_by: data.recordedBy,
      previous_state: null,
      new_state: { amount: data.amount, paymentMethod: data.paymentMethod, proofCount: savedProofs.length },
      notes: `Recorded payment of ₹${data.amount} for ${sale.sale_number}`,
      created_at: new Date().toISOString(),
    });

    saveDb(db);
    return {
      ...newPayment,
      proofs: savedProofs,
    };
  },

  async addPaymentProof(
    paymentId: string,
    saleId: string,
    proof: {
      fileName: string;
      mimeType: string;
      dataUrl: string;
      size?: number;
      uploadedBy: string;
    }
  ): Promise<PaymentProof> {
    const db = ensureDb();
    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found.');

    const proofRecord: PaymentProof = {
      id: crypto.randomUUID(),
      payment_id: paymentId,
      sale_id: saleId,
      storage_path: proof.dataUrl,
      file_name: proof.fileName,
      mime_type: proof.mimeType,
      file_size: proof.size || null,
      uploaded_by: proof.uploadedBy,
      created_at: new Date().toISOString(),
    };

    db.payment_proofs.push(proofRecord);

    db.audit_logs.push({
      id: crypto.randomUUID(),
      entity_type: 'payment_proof',
      entity_id: proofRecord.id,
      action: 'ADD_PROOF',
      performed_by: proof.uploadedBy,
      previous_state: null,
      new_state: { fileName: proof.fileName },
      notes: `Uploaded additional payment proof for payment ${paymentId}`,
      created_at: new Date().toISOString(),
    });

    saveDb(db);
    return proofRecord;
  },

  // -------------------------------------------------------------------
  // Analytics & Aggregations (Calculated authoritatively from real DB)
  // -------------------------------------------------------------------
  async getCompanySummary(dateRange?: { start?: string; end?: string }): Promise<FinancialSummary> {
    const sales = await this.getSales({
      startDate: dateRange?.start,
      endDate: dateRange?.end,
    });
    const customers = await this.getCustomers();

    let totalRevenue = 0;
    let totalCost = 0;
    let totalPaid = 0;

    for (const s of sales) {
      totalRevenue += s.total_revenue;
      totalCost += s.total_cost;
      totalPaid += s.total_paid || 0;
    }

    totalRevenue = round2(totalRevenue);
    totalCost = round2(totalCost);
    totalPaid = round2(totalPaid);

    const totalGrossProfit = round2(totalRevenue - totalCost);
    const grossMargin = totalRevenue > 0 ? round2((totalGrossProfit / totalRevenue) * 100) : 0;
    const outstandingAmount = Math.max(0, round2(totalRevenue - totalPaid));

    return {
      totalRevenue,
      totalCost,
      totalGrossProfit,
      grossMargin,
      salesCount: sales.length,
      customerCount: customers.length,
      totalPaymentsReceived: totalPaid,
      outstandingAmount,
    };
  },

  async getSalespersonAnalytics(dateRange?: { start?: string; end?: string }) {
    const db = ensureDb();
    const salespeople = db.profiles.filter((p) => p.role === 'salesperson' && p.active);
    const sales = await this.getSales({
      startDate: dateRange?.start,
      endDate: dateRange?.end,
    });

    return salespeople.map((sp) => {
      const spSales = sales.filter((s) => s.salesperson_id === sp.id);
      const custCount = db.customers.filter((c) => c.assigned_salesperson_id === sp.id).length;

      let revenue = 0;
      let cost = 0;
      let qty = 0;

      for (const s of spSales) {
        revenue += s.total_revenue;
        cost += s.total_cost;
        for (const item of s.items || []) {
          qty += item.quantity;
        }
      }

      revenue = round2(revenue);
      cost = round2(cost);
      const profit = round2(revenue - cost);
      const margin = revenue > 0 ? round2((profit / revenue) * 100) : 0;
      const avgSaleValue = spSales.length > 0 ? round2(revenue / spSales.length) : 0;
      const avgProfitPerSale = spSales.length > 0 ? round2(profit / spSales.length) : 0;

      return {
        salespersonId: sp.id,
        salespersonName: sp.full_name,
        email: sp.email,
        revenue,
        profit,
        margin,
        salesCount: spSales.length,
        quantitySold: qty,
        customerCount: custCount,
        avgSaleValue,
        avgProfitPerSale,
      };
    });
  },

  async getProductPricingAnalytics(salespersonId?: string) {
    const db = ensureDb();
    const products = db.products;
    const saleItems = db.sale_items;
    const sales = db.sales;

    return products.map((prod) => {
      let relevantItems = saleItems.filter((i) => i.product_id === prod.id);

      if (salespersonId) {
        const spSaleIds = new Set(sales.filter((s) => s.salesperson_id === salespersonId).map((s) => s.id));
        relevantItems = relevantItems.filter((i) => spSaleIds.has(i.sale_id));
      }

      if (relevantItems.length === 0) {
        return {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          category: prod.category,
          currentCost: prod.cost_price,
          recommendedPrice: prod.recommended_price,
          minimumPrice: prod.minimum_price,
          timesSold: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgSellingPrice: 0,
          minSellingPrice: 0,
          maxSellingPrice: 0,
          avgMargin: 0,
        };
      }

      let totalRevenue = 0;
      let totalCost = 0;
      let totalQty = 0;
      let minPrice = Infinity;
      let maxPrice = -Infinity;

      for (const item of relevantItems) {
        totalRevenue += item.line_revenue;
        totalCost += item.line_cost;
        totalQty += item.quantity;
        if (item.selling_price < minPrice) minPrice = item.selling_price;
        if (item.selling_price > maxPrice) maxPrice = item.selling_price;
      }

      totalRevenue = round2(totalRevenue);
      totalCost = round2(totalCost);
      const totalProfit = round2(totalRevenue - totalCost);
      const avgPrice = totalQty > 0 ? round2(totalRevenue / totalQty) : 0;
      const avgMargin = totalRevenue > 0 ? round2((totalProfit / totalRevenue) * 100) : 0;

      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        category: prod.category,
        currentCost: prod.cost_price,
        recommendedPrice: prod.recommended_price,
        minimumPrice: prod.minimum_price,
        timesSold: relevantItems.length,
        totalQuantity: totalQty,
        totalRevenue,
        totalProfit,
        avgSellingPrice: avgPrice,
        minSellingPrice: isFinite(minPrice) ? minPrice : 0,
        maxSellingPrice: isFinite(maxPrice) ? maxPrice : 0,
        avgMargin,
      };
    });
  },

  async getCustomerAnalytics() {
    const db = ensureDb();
    const customers = db.customers;
    const sales = await this.getSales();

    return customers.map((c) => {
      const custSales = sales.filter((s) => s.customer_id === c.id);
      const sp = db.profiles.find((p) => p.id === c.assigned_salesperson_id);

      let revenue = 0;
      let cost = 0;
      let paid = 0;

      for (const s of custSales) {
        revenue += s.total_revenue;
        cost += s.total_cost;
        paid += s.total_paid || 0;
      }

      revenue = round2(revenue);
      cost = round2(cost);
      paid = round2(paid);
      const profit = round2(revenue - cost);
      const outstanding = Math.max(0, round2(revenue - paid));

      return {
        customerId: c.id,
        customerName: c.name,
        company: c.company,
        phone: c.phone,
        salespersonName: sp ? sp.full_name : 'Unassigned',
        salesCount: custSales.length,
        revenue,
        profit,
        paid,
        outstanding,
      };
    });
  },
};
