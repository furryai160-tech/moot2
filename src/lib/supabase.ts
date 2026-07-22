import { createClient } from '@supabase/supabase-js';
import { Order, CartItem, WarrantyRequest } from '../types';

// Read configuration from environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Validate if we have configured actual Supabase variables
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here';

// Initialize Client (wrapped safely to prevent crashing on invalid URL)
export let supabase: any = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Supabase initialization failed:', error);
  }
}

// User representation interface
export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  isAdmin?: boolean;
  isDesigner?: boolean;
}

/**
 * AUTHENTICATION HELPERS
 */
function getEmailFromPhoneOrEmail(input: string): string {
  const clean = input.trim();
  if (clean.includes('@')) {
    return clean;
  }
  // It's a phone number, clean any non-digits
  const digits = clean.replace(/[^0-9]/g, '');
  return `${digits}@morbido.com`;
}

export async function signUpUser(emailOrPhone: string, password: string, name: string, phone: string): Promise<{ user: AppUser | null; error: string | null }> {
  const resolvedEmail = getEmailFromPhoneOrEmail(emailOrPhone);

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: resolvedEmail,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        // Save profile in user_profiles table (optional but good practice)
        const appUser: AppUser = {
          id: data.user.id,
          email: resolvedEmail,
          name: name,
          phone: phone,
          createdAt: data.user.created_at,
        };
        
        await supabase.from('profiles').upsert({
          id: appUser.id,
          name: appUser.name,
          phone: appUser.phone,
          email: appUser.email,
        });
        
        return { user: appUser, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'فشلت عملية إنشاء الحساب.' };
    }
  }

  // Fallback to localStorage Mock DB
  const mockUsers = JSON.parse(localStorage.getItem('morbido_users') || '[]');
  if (mockUsers.some((u: any) => u.email === resolvedEmail || u.phone === phone)) {
    return { user: null, error: 'رقم الموبايل أو البريد الإلكتروني مسجل بالفعل!' };
  }

  const newUser: AppUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    email: resolvedEmail,
    name,
    phone,
    createdAt: new Date().toISOString(),
  };

  mockUsers.push({ ...newUser, password }); // Warning: plain text password is only for mock sandbox!
  localStorage.setItem('morbido_users', JSON.stringify(mockUsers));
  localStorage.setItem('morbido_current_user', JSON.stringify(newUser));

  return { user: newUser, error: null };
}

export async function signInUser(emailOrPhone: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
  const cleanInput = emailOrPhone.trim();

  // Check Admin first
  const adminPhone = localStorage.getItem('morbido_admin_phone') || '01228495250';
  const adminPassword = localStorage.getItem('morbido_admin_password') || '01228495250';

  if (cleanInput === adminPhone && password === adminPassword) {
    const adminUser: AppUser = {
      id: 'admin_user',
      email: 'admin@morbido.com',
      name: 'مسؤول النظام (الأدمن)',
      phone: adminPhone,
      createdAt: new Date().toISOString(),
      isAdmin: true,
    };
    localStorage.setItem('morbido_current_user', JSON.stringify(adminUser));
    return { user: adminUser, error: null };
  }

  // Check Designer second
  const designerPhone = localStorage.getItem('morbido_designer_phone') || '01069820990';
  const designerPassword = localStorage.getItem('morbido_designer_password') || '01069820990';

  if (cleanInput === designerPhone && password === designerPassword) {
    const designerUser: AppUser = {
      id: 'designer_user',
      email: 'designer@morbido.com',
      name: 'مصمم الموقع (Designer)',
      phone: designerPhone,
      createdAt: new Date().toISOString(),
      isDesigner: true,
    };
    localStorage.setItem('morbido_current_user', JSON.stringify(designerUser));
    return { user: designerUser, error: null };
  }

  const resolvedEmail = getEmailFromPhoneOrEmail(emailOrPhone);

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
      if (error) throw error;
      if (data.user) {
        // Fetch custom profile data if available
        let name = data.user.user_metadata?.full_name || '';
        let phone = data.user.user_metadata?.phone || '';
        
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (profile) {
            name = profile.name || name;
            phone = profile.phone || phone;
          }
        } catch (_) {}

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || resolvedEmail,
          name: name || 'مستخدم موربيدو',
          phone,
          createdAt: data.user.created_at,
        };
        return { user: appUser, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'بيانات الدخول أو كلمة المرور غير صحيحة.' };
    }
  }

  // Fallback to localStorage Mock DB
  const mockUsers = JSON.parse(localStorage.getItem('morbido_users') || '[]');
  const found = mockUsers.find((u: any) => 
    (u.email === resolvedEmail || u.phone === emailOrPhone.trim()) && u.password === password
  );
  if (!found) {
    return { user: null, error: 'رقم الموبايل / البريد الإلكتروني أو كلمة المرور غير صحيحة!' };
  }

  const appUser: AppUser = {
    id: found.id,
    email: found.email,
    name: found.name,
    phone: found.phone,
    createdAt: found.createdAt,
  };
  localStorage.setItem('morbido_current_user', JSON.stringify(appUser));
  return { user: appUser, error: null };
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('morbido_current_user');
}

export function getCurrentUserSync(): AppUser | null {
  const stored = localStorage.getItem('morbido_current_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * DATABASE CRUD HELPERS (ORDERS & WARRANTIES)
 */
export async function saveOrderToDatabase(order: Order, paymentMethod: 'cod' | 'fawaiterk', paymentStatus: 'pending' | 'paid'): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').insert({
        id: order.id,
        customer_name: order.customerName,
        phone: order.phone,
        city: order.city,
        address: order.address,
        items: order.items, // JSONB
        total: order.total,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status: order.status,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving order to Supabase:', err);
    }
  }

  // Fallback: save to LocalStorage so orders are persistently retrievable
  const localOrders = JSON.parse(localStorage.getItem('morbido_orders') || '[]');
  localOrders.push({
    ...order,
    paymentMethod,
    paymentStatus,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem('morbido_orders', JSON.stringify(localOrders));
}

export async function getOrdersFromDatabase(): Promise<any[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(o => ({
        id: o.id,
        customerName: o.customer_name,
        phone: o.phone,
        city: o.city,
        address: o.address,
        items: o.items,
        total: o.total,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        createdAt: new Date(o.created_at).toLocaleDateString('ar-EG'),
      }));
    } catch (err) {
      console.error('Error fetching orders from Supabase:', err);
    }
  }

  // Fallback
  const local = JSON.parse(localStorage.getItem('morbido_orders') || '[]');
  return local.reverse();
}

export async function saveWarrantyToDatabase(warranty: WarrantyRequest): Promise<void> {
  if (supabase) {
    try {
      // Pack productName and serialNumber into notes as JSON to be schema-safe
      const dbNotes = JSON.stringify({
        productName: warranty.productName || '',
        serialNumber: warranty.serialNumber || '',
        originalNotes: warranty.notes || ''
      });

      const { error } = await supabase.from('warranties').insert({
        id: warranty.id,
        customer_name: warranty.customerName,
        phone: warranty.phone,
        product_type: warranty.productType,
        invoice_number: warranty.invoiceNumber,
        purchase_date: warranty.purchaseDate,
        notes: dbNotes,
        status: warranty.status,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving warranty to Supabase:', err);
    }
  }

  // Fallback
  const local = JSON.parse(localStorage.getItem('morbido_warranties') || '[]');
  local.push(warranty);
  localStorage.setItem('morbido_warranties', JSON.stringify(local));
}

export async function getWarrantiesFromDatabase(): Promise<WarrantyRequest[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(w => {
        let productName = '';
        let serialNumber = '';
        let cleanNotes = w.notes || '';

        if (w.notes && w.notes.startsWith('{') && w.notes.endsWith('}')) {
          try {
            const parsed = JSON.parse(w.notes);
            productName = parsed.productName || '';
            serialNumber = parsed.serialNumber || '';
            cleanNotes = parsed.originalNotes || '';
          } catch (_) {
            // Not JSON
          }
        }

        return {
          id: w.id,
          customerName: w.customer_name,
          phone: w.phone,
          productType: w.product_type,
          productName: productName || undefined,
          serialNumber: serialNumber || undefined,
          invoiceNumber: w.invoice_number,
          purchaseDate: w.purchase_date,
          notes: cleanNotes,
          status: w.status,
          createdAt: new Date(w.created_at).toLocaleDateString('ar-EG'),
        };
      });
    } catch (err) {
      console.error('Error fetching warranties from Supabase:', err);
    }
  }

  // Fallback
  const local = JSON.parse(localStorage.getItem('morbido_warranties') || '[]');
  return local.reverse();
}

/**
 * REVIEWS CRUD HELPERS
 */
export interface ReviewRecord {
  id: string;
  name: string;
  location: string;
  productName: string;
  rating: number;
  comment: string;
  verified: boolean;
  date?: string;
  createdAt?: string;
}

export async function saveReviewToDatabase(review: ReviewRecord): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('reviews').insert({
        id: review.id,
        name: review.name,
        location: review.location || 'مصر',
        product_name: review.productName,
        rating: review.rating,
        comment: review.comment,
        verified: review.verified ?? true,
        approved: true,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving review to Supabase:', err);
    }
  }

  // Fallback: save to localStorage
  const localReviews = JSON.parse(localStorage.getItem('morbido_reviews') || '[]');
  localReviews.unshift({
    ...review,
    date: 'اليوم',
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('morbido_reviews', JSON.stringify(localReviews));
}

export async function getReviewsFromDatabase(): Promise<ReviewRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(r => ({
        id: r.id,
        name: r.name,
        location: r.location || 'مصر',
        productName: r.product_name,
        rating: r.rating,
        comment: r.comment,
        verified: r.verified,
        date: new Date(r.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error('Error fetching reviews from Supabase:', err);
    }
  }

  // Fallback
  const local = JSON.parse(localStorage.getItem('morbido_reviews') || '[]');
  return local;
}

export async function deleteReviewFromDatabase(reviewId: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error deleting review from Supabase:', err);
    }
  }
  // Fallback
  const local: any[] = JSON.parse(localStorage.getItem('morbido_reviews') || '[]');
  const updated = local.filter(r => r.id !== reviewId);
  localStorage.setItem('morbido_reviews', JSON.stringify(updated));
}

export { isSupabaseConfigured };
