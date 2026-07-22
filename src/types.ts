export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  tag?: string;
  imageUrl: string;
  category: 'pillows' | 'bedding' | 'mattresses' | 'best-sellers';
  description: string;
  specs?: Record<string, string>;
  sizes?: { size: string; price: number; oldPrice?: number }[];
  serialNumber?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface WarrantyRequest {
  id: string;
  customerName: string;
  phone: string;
  productType: string;
  productName?: string;
  serialNumber?: string;
  invoiceNumber: string;
  purchaseDate: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'delivering' | 'delivered';
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  isActive: boolean;
  createdAt: string;
}

