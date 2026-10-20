export type UserRole = 'admin' | 'supervisor' | 'merchant' | 'customer' | 'captain';

export interface UserAddress {
  governorate: string;
  city: string;
  street: string;
  building: string;
  landmark: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  storeName?: string;
  address?: UserAddress;
  isBanned?: boolean;
  banReason?: string;
  debt?: number;
  totalSales?: number;
  ordersCount?: number;
  permissions?: string[];
  vehicleType?: string;
  nationalId?: string;
  captainStatus?: 'pending' | 'approved' | 'rejected';
  walletBalance?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  description: string;
  category: 'خضروات' | 'فواكه' | 'بقوليات وحبوب' | 'أجبان وألبان' | 'مجففات وعطارة' | string;
  price: number;
  unit: 'كيلو' | 'نصف كيلو' | 'جرام' | 'ربطة' | 'طبق' | 'كيس' | 'قطعة' | string;
  stock: number;
  image: string;
  isHidden?: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
  total: number;
}

export type OrderStatus = 'new' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'instapay' | 'vodafone_cash';

export interface DeliveryRep {
  name: string;
  phone: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: UserAddress;
  merchantId: string;
  merchantName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus: 'pending' | 'verified';
  deliveryRep?: DeliveryRep;
  captainId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  orderId?: string;
  type: 'order_payment' | 'commission' | 'debt_settlement' | 'wallet_topup';
  amount: number;
  paymentMethod: string;
  reference?: string;
  status: 'completed' | 'pending';
  notes: string;
  createdAt: string;
}

export interface AdBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'top_banner' | 'popup' | 'sponsored';
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PasswordResetRequest {
  id: string;
  phone: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  requestedAt: string;
  status: 'pending' | 'resolved';
}

export interface AppSettings {
  storeName: string;
  logo: string;
  bannerImage: string;
  currency: string;
  deliveryFee: number;
  commissionPercent: number;
  instapayHandle: string;
  instapayPhone: string;
  vodafoneCashNumber: string;
  captainModeEnabled: boolean;
  termsAndConditions: string;
  returnPolicy: string;
  whatsappBannedMerchantTemplate: string;
  whatsappPasswordResetTemplate: string;
  whatsappDeliveryRepTemplate: string;
}
