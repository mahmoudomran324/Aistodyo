import type {
  User,
  Product,
  Order,
  FinancialTransaction,
  AdBanner,
  PasswordResetRequest,
  AppSettings,
  OrderStatus
} from '../types.js';

export const api = {
  // Auth
  async login(emailOrPhone: string, password: string):Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
    return data;
  },

  async register(userData: any): Promise<{ user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب');
    return data;
  },

  async forgotPassword(phone: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إرسال الطلب');
    return data;
  },

  async getForgotPasswordRequests(): Promise<PasswordResetRequest[]> {
    const res = await fetch('/api/auth/forgot-password-requests');
    if (!res.ok) throw new Error('فشل جلب طلبات استعادة كلمة المرور');
    return res.json();
  },

  async resolveForgotPassword(id: string): Promise<void> {
    await fetch('/api/auth/resolve-forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  // Products
  async getProducts(params?: { category?: string; merchantId?: string; search?: string; includeHidden?: boolean }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.merchantId) query.append('merchantId', params.merchantId);
    if (params?.search) query.append('search', params.search);
    if (params?.includeHidden) query.append('includeHidden', 'true');

    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('فشل جلب المنتجات');
    return res.json();
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إضافة المنتج');
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تحديث المنتج');
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف المنتج');
  },

  // Orders
  async getOrders(params?: { customerId?: string; merchantId?: string; captainId?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.merchantId) query.append('merchantId', params.merchantId);
    if (params?.captainId) query.append('captainId', params.captainId);

    const res = await fetch(`/api/orders?${query.toString()}`);
    if (!res.ok) throw new Error('فشل جلب الطلبات');
    return res.json();
  },

  async createOrder(orderData: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إرسال الطلب');
    return data;
  },

  async updateOrderStatus(id: string, payload: { status: OrderStatus; deliveryRep?: { name: string; phone: string }; captainId?: string }): Promise<Order> {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تحديث حالة الطلب');
    return data;
  },

  // Users & Merchants
  async getUsers(role?: string): Promise<User[]> {
    const url = role ? `/api/users?role=${role}` : '/api/users';
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب المستخدمين');
    return res.json();
  },

  async createUser(userData: any): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إضافة المستخدم');
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف المستخدم');
  },

  async banMerchant(id: string, reason: string, steps: string): Promise<{ whatsappUrl: string; message: string }> {
    const res = await fetch(`/api/merchants/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, steps })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل حظر التاجر');
    return data;
  },

  async unbanMerchant(id: string): Promise<void> {
    const res = await fetch(`/api/merchants/${id}/unban`, { method: 'POST' });
    if (!res.ok) throw new Error('فشل رفع الحظر عن التاجر');
  },

  async toggleBanUser(id: string): Promise<{ isBanned: boolean }> {
    const res = await fetch(`/api/users/${id}/toggle-ban`, { method: 'POST' });
    if (!res.ok) throw new Error('فشل تغيير حالة الحظر');
    return res.json();
  },

  async settleMerchantDebt(id: string, notes?: string): Promise<{ clearedAmount: number }> {
    const res = await fetch(`/api/merchants/${id}/settle-debt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تصفير المديونية');
    return data;
  },

  // Transactions
  async getTransactions(userId?: string): Promise<FinancialTransaction[]> {
    const url = userId ? `/api/transactions?userId=${userId}` : '/api/transactions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب المعاملات المالية');
    return res.json();
  },

  // Ads
  async getAds(activeOnly?: boolean): Promise<AdBanner[]> {
    const url = activeOnly ? '/api/ads?activeOnly=true' : '/api/ads';
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب الإعلانات');
    return res.json();
  },

  async createAd(adData: any): Promise<AdBanner> {
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إضافة الإعلان');
    return data;
  },

  async updateAd(id: string, updates: Partial<AdBanner>): Promise<AdBanner> {
    const res = await fetch(`/api/ads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تحديث الإعلان');
    return data;
  },

  async deleteAd(id: string): Promise<void> {
    const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف الإعلان');
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('فشل جلب الإعدادات');
    return res.json();
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل حفظ الإعدادات');
    return data;
  },

  // Stats
  async getStats(): Promise<any> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('فشل جلب الإحصائيات');
    return res.json();
  }
};
