import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import type { 
  User, 
  Product, 
  Order, 
  FinancialTransaction, 
  AdBanner, 
  PasswordResetRequest 
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support large base64 uploads for images (vegetable photos, logos, ad banners)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ===================== AUTH ROUTES =====================
  app.post('/api/auth/login', (req, res) => {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم / البريد وكلمة المرور' });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const data = db.getDb();
    const user = data.users.find(u => {
      const emailMatch = u.email && u.email.toLowerCase() === cleanInput;
      const phoneMatch = u.phone && u.phone.trim() === cleanInput;
      // Handle the exact admin domain "www.bekalte.com" or "bekalte.com"
      const adminDomainMatch = (cleanInput === 'www.bekalte.com' || cleanInput === 'bekalte.com') && 
                               (u.email.toLowerCase() === 'www.bekalte.com' || u.role === 'admin');
      return (emailMatch || phoneMatch || adminDomainMatch) && u.password === cleanPassword;
    });

    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد/الهاتف وكلمة المرور' });
    }

    if (user.isBanned) {
      return res.status(403).json({ 
        error: `تم إيقاف هذا الحساب مؤقتاً: ${user.banReason || 'مخالفة الشروط والأحكام'}`, 
        isBanned: true,
        banReason: user.banReason 
      });
    }

    const { password: _, ...userWithoutPass } = user;
    return res.json({ user: userWithoutPass });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, phone, email, password, role, storeName, address, vehicleType, nationalId } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف وكلمة المرور مطلوبة' });
    }

    const data = db.getDb();
    const cleanPhone = String(phone).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    const existing = data.users.find(u => 
      u.phone === cleanPhone || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );

    if (existing) {
      return res.status(400).json({ error: 'رقم الهاتف أو البريد الإلكتروني مسجل بالفعل' });
    }

    const newUserRole = role === 'merchant' ? 'merchant' : role === 'captain' ? 'captain' : 'customer';

    const newUser: User = {
      id: `${newUserRole}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      email: cleanEmail || `${cleanPhone}@baladi.local`,
      phone: cleanPhone,
      password: String(password).trim(),
      role: newUserRole,
      storeName: storeName ? storeName.trim() : undefined,
      address: address || {
        governorate: 'القاهرة',
        city: 'المدينة',
        street: 'الشارع',
        building: '1',
        landmark: ''
      },
      isBanned: false,
      debt: 0,
      totalSales: 0,
      ordersCount: 0,
      vehicleType,
      nationalId,
      captainStatus: newUserRole === 'captain' ? 'pending' : undefined,
      walletBalance: 0,
      createdAt: new Date().toISOString()
    };

    db.updateDb(database => {
      database.users.push(newUser);
    });

    const { password: _, ...userWithoutPass } = newUser;
    return res.status(201).json({ user: userWithoutPass });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف المسجل' });
    }

    const cleanPhone = String(phone).trim();
    const data = db.getDb();
    const user = data.users.find(u => u.phone.trim() === cleanPhone);

    const newRequest: PasswordResetRequest = {
      id: `req-${Date.now()}`,
      phone: cleanPhone,
      userName: user ? user.name : 'عميل جديد',
      userEmail: user ? user.email : '',
      userRole: user ? user.role : 'customer',
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    db.updateDb(database => {
      database.passwordResetRequests.unshift(newRequest);
    });

    return res.json({ 
      success: true, 
      message: 'تم إرسال طلب استعادة كلمة المرور للإدارة، وسيتم إرسال بيانات الدخول إليك عبر واتساب فوراً.' 
    });
  });

  app.get('/api/auth/forgot-password-requests', (req, res) => {
    const data = db.getDb();
    return res.json(data.passwordResetRequests);
  });

  app.post('/api/auth/resolve-forgot-password', (req, res) => {
    const { id } = req.body;
    db.updateDb(database => {
      const item = database.passwordResetRequests.find(r => r.id === id);
      if (item) {
        item.status = 'resolved';
      }
    });
    return res.json({ success: true });
  });

  // ===================== PRODUCTS ROUTES =====================
  app.get('/api/products', (req, res) => {
    const { category, merchantId, search, includeHidden } = req.query;
    const data = db.getDb();

    // Get list of banned merchants
    const bannedMerchantIds = new Set(
      data.users.filter(u => u.role === 'merchant' && u.isBanned).map(u => u.id)
    );

    let products = data.products;

    // Filter out products of banned merchants unless explicitly requested by admin
    if (includeHidden !== 'true') {
      products = products.filter(p => !p.isHidden && !bannedMerchantIds.has(p.merchantId));
    }

    if (category && category !== 'الكل') {
      products = products.filter(p => p.category === category);
    }

    if (merchantId) {
      products = products.filter(p => p.merchantId === merchantId);
    }

    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return res.json(products);
  });

  app.post('/api/products', (req, res) => {
    const { merchantId, merchantName, name, description, category, price, unit, stock, image } = req.body;

    if (!name || !price || !unit) {
      return res.status(400).json({ error: 'اسم المنتج، السعر، ووحدة القياس مطلوبة' });
    }

    const data = db.getDb();
    const merchant = data.users.find(u => u.id === merchantId);

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      merchantId: merchantId || 'merchant-1',
      merchantName: merchant?.storeName || merchantName || 'مزرعة بلدي',
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category || 'خضروات',
      price: parseFloat(price) || 0,
      unit: unit || 'كيلو',
      stock: parseInt(stock, 10) || 50,
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
      isHidden: false,
      createdAt: new Date().toISOString()
    };

    db.updateDb(database => {
      database.products.unshift(newProduct);
    });

    return res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    let updatedProduct: Product | null = null;
    db.updateDb(database => {
      const idx = database.products.findIndex(p => p.id === id);
      if (idx !== -1) {
        database.products[idx] = {
          ...database.products[idx],
          ...updates,
          price: updates.price !== undefined ? parseFloat(updates.price) : database.products[idx].price,
          stock: updates.stock !== undefined ? parseInt(updates.stock, 10) : database.products[idx].stock,
        };
        updatedProduct = database.products[idx];
      }
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    return res.json(updatedProduct);
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.updateDb(database => {
      database.products = database.products.filter(p => p.id !== id);
    });
    return res.json({ success: true });
  });

  // ===================== ORDERS ROUTES =====================
  app.get('/api/orders', (req, res) => {
    const { customerId, merchantId, captainId } = req.query;
    const data = db.getDb();

    let orders = data.orders;
    if (customerId) {
      orders = orders.filter(o => o.customerId === customerId);
    }
    if (merchantId) {
      orders = orders.filter(o => o.merchantId === merchantId);
    }
    if (captainId) {
      orders = orders.filter(o => o.captainId === captainId || o.status === 'out_for_delivery');
    }

    // Sort newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const { 
      customerId, 
      customerName, 
      customerPhone, 
      customerAddress, 
      merchantId, 
      merchantName, 
      items, 
      paymentMethod, 
      paymentReference,
      notes 
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'سلة المشتريات فارغة' });
    }

    const data = db.getDb();
    const deliveryFee = data.settings.deliveryFee || 15;
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryFee;

    const commissionPercent = data.settings.commissionPercent || 5;
    const commissionAmount = (subtotal * commissionPercent) / 100;

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      customerId: customerId || 'customer-1',
      customerName: customerName || 'عميل بلدي',
      customerPhone: customerPhone || '01000000000',
      customerAddress: customerAddress || {
        governorate: 'القاهرة',
        city: 'المدينة',
        street: 'الشارع',
        building: '1',
        landmark: ''
      },
      merchantId: merchantId || 'merchant-1',
      merchantName: merchantName || 'مزرعة بلدي',
      items,
      subtotal,
      deliveryFee,
      total,
      status: 'new', // triggers loud continuous sound for merchant!
      paymentMethod: paymentMethod || 'cash',
      paymentReference: paymentReference || '',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'verified',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Financial transaction recording
    const newTransaction: FinancialTransaction = {
      id: `TRX-${Date.now()}`,
      userId: newOrder.customerId,
      userName: newOrder.customerName,
      userRole: 'customer',
      orderId: newOrder.id,
      type: 'order_payment',
      amount: total,
      paymentMethod: paymentMethod || 'cash',
      reference: paymentReference || `كود: ${orderId}`,
      status: 'completed',
      notes: `سداد طلب رقم ${orderId} من ${newOrder.merchantName}`,
      createdAt: new Date().toISOString()
    };

    db.updateDb(database => {
      database.orders.unshift(newOrder);
      database.transactions.unshift(newTransaction);

      // Update merchant sales and debt
      const merchant = database.users.find(u => u.id === newOrder.merchantId);
      if (merchant) {
        merchant.totalSales = (merchant.totalSales || 0) + subtotal;
        merchant.ordersCount = (merchant.ordersCount || 0) + 1;
        merchant.debt = (merchant.debt || 0) + commissionAmount;
      }
    });

    return res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, deliveryRep, captainId } = req.body;

    let updatedOrder: Order | null = null;
    db.updateDb(database => {
      const order = database.orders.find(o => o.id === id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        if (deliveryRep) {
          order.deliveryRep = deliveryRep;
        }
        if (captainId) {
          order.captainId = captainId;
        }
        updatedOrder = order;
      }
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    return res.json(updatedOrder);
  });

  // ===================== USERS & MERCHANTS ROUTES =====================
  app.get('/api/users', (req, res) => {
    const { role } = req.query;
    const data = db.getDb();
    let users = data.users;
    if (role) {
      users = users.filter(u => u.role === role);
    }
    // Omit passwords
    const safeUsers = users.map(({ password: _, ...rest }) => rest);
    return res.json(safeUsers);
  });

  app.post('/api/users', (req, res) => {
    const { name, phone, email, password, role, storeName, address, permissions, vehicleType } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف وكلمة المرور والدور مطلوبة' });
    }

    const data = db.getDb();
    const cleanPhone = String(phone).trim();
    if (data.users.some(u => u.phone === cleanPhone)) {
      return res.status(400).json({ error: 'رقم الهاتف مسجل بالفعل' });
    }

    const newUser: User = {
      id: `${role}-${Date.now()}`,
      name: name.trim(),
      email: email ? email.trim() : `${cleanPhone}@baladi.local`,
      phone: cleanPhone,
      password: String(password).trim(),
      role,
      storeName: storeName ? storeName.trim() : undefined,
      address,
      permissions: permissions || [],
      vehicleType,
      isBanned: false,
      debt: 0,
      totalSales: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString()
    };

    db.updateDb(database => {
      database.users.push(newUser);
    });

    const { password: _, ...safe } = newUser;
    return res.status(201).json(safe);
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.updateDb(database => {
      database.users = database.users.filter(u => u.id !== id);
      // If merchant deleted, delete products
      database.products = database.products.filter(p => p.merchantId !== id);
    });
    return res.json({ success: true });
  });

  app.post('/api/merchants/:id/ban', (req, res) => {
    const { id } = req.params;
    const { reason, steps } = req.body;

    const data = db.getDb();
    const merchant = data.users.find(u => u.id === id);

    if (!merchant) {
      return res.status(404).json({ error: 'التاجر غير موجود' });
    }

    db.updateDb(database => {
      const m = database.users.find(u => u.id === id);
      if (m) {
        m.isBanned = true;
        m.banReason = reason || 'إيقاف مؤقت من إدارة بلدي';
      }
      // Hide all products of this merchant
      database.products.forEach(p => {
        if (p.merchantId === id) {
          p.isHidden = true;
        }
      });
    });

    // Generate WhatsApp text
    const template = data.settings.whatsappBannedMerchantTemplate || 
      'مرحباً {merchant_name}، نود إخطاركم بأنه تم إيقاف متجركم مؤقتاً بسبب: {reason}. الخطوات المطلوبة: {steps}';
    const message = template
      .replace('{merchant_name}', merchant.name)
      .replace('{reason}', reason || 'مخالفة معايير الجودة')
      .replace('{steps}', steps || 'يرجى مراجعة إدارة بلدي لحل المشكلة');

    const cleanPhone = merchant.phone.replace(/^0/, '20');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return res.json({ success: true, whatsappUrl, message });
  });

  app.post('/api/merchants/:id/unban', (req, res) => {
    const { id } = req.params;

    db.updateDb(database => {
      const m = database.users.find(u => u.id === id);
      if (m) {
        m.isBanned = false;
        m.banReason = undefined;
      }
      // Unhide products
      database.products.forEach(p => {
        if (p.merchantId === id) {
          p.isHidden = false;
        }
      });
    });

    return res.json({ success: true });
  });

  app.post('/api/merchants/:id/settle-debt', (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    let clearedAmount = 0;
    db.updateDb(database => {
      const m = database.users.find(u => u.id === id);
      if (m) {
        clearedAmount = m.debt || 0;
        m.debt = 0;

        database.transactions.unshift({
          id: `TRX-${Date.now()}`,
          userId: m.id,
          userName: m.storeName || m.name,
          userRole: 'merchant',
          type: 'debt_settlement',
          amount: clearedAmount,
          paymentMethod: 'إيصال سداد معتمد',
          reference: `تصفير مديونية تاجر`,
          status: 'completed',
          notes: notes || 'تم تصفير مديونية التاجر بنجاح بعد التحقق من السداد الفعلي من قبل الإدارة',
          createdAt: new Date().toISOString()
        });
      }
    });

    return res.json({ success: true, clearedAmount });
  });

  app.post('/api/users/:id/toggle-ban', (req, res) => {
    const { id } = req.params;
    let isBanned = false;
    db.updateDb(database => {
      const u = database.users.find(user => user.id === id);
      if (u) {
        u.isBanned = !u.isBanned;
        isBanned = u.isBanned;
      }
    });
    return res.json({ success: true, isBanned });
  });

  // ===================== TRANSACTIONS ROUTES =====================
  app.get('/api/transactions', (req, res) => {
    const { userId } = req.query;
    const data = db.getDb();
    let txs = data.transactions;
    if (userId) {
      txs = txs.filter(t => t.userId === userId);
    }
    txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(txs);
  });

  // ===================== ADS ROUTES =====================
  app.get('/api/ads', (req, res) => {
    const { activeOnly } = req.query;
    const data = db.getDb();
    let ads = data.ads;
    if (activeOnly === 'true') {
      const today = new Date().toISOString().slice(0, 10);
      ads = ads.filter(a => a.isActive && (!a.endDate || a.endDate >= today));
    }
    return res.json(ads);
  });

  app.post('/api/ads', (req, res) => {
    const { title, description, image, type, startDate, endDate, isActive } = req.body;

    if (!title || !image) {
      return res.status(400).json({ error: 'عنوان الإعلان وصورة الإعلان مطلوبة' });
    }

    const newAd: AdBanner = {
      id: `ad-${Date.now()}`,
      title: title.trim(),
      description: description ? description.trim() : '',
      image,
      type: type || 'top_banner',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString()
    };

    db.updateDb(database => {
      database.ads.unshift(newAd);
    });

    return res.status(201).json(newAd);
  });

  app.put('/api/ads/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    let updatedAd: AdBanner | null = null;
    db.updateDb(database => {
      const idx = database.ads.findIndex(a => a.id === id);
      if (idx !== -1) {
        database.ads[idx] = { ...database.ads[idx], ...updates };
        updatedAd = database.ads[idx];
      }
    });

    if (!updatedAd) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    return res.json(updatedAd);
  });

  app.delete('/api/ads/:id', (req, res) => {
    const { id } = req.params;
    db.updateDb(database => {
      database.ads = database.ads.filter(a => a.id !== id);
    });
    return res.json({ success: true });
  });

  // ===================== SETTINGS ROUTES =====================
  app.get('/api/settings', (req, res) => {
    const data = db.getDb();
    return res.json(data.settings);
  });

  app.put('/api/settings', (req, res) => {
    const updates = req.body;
    let newSettings: any = null;
    db.updateDb(database => {
      database.settings = { ...database.settings, ...updates };
      newSettings = database.settings;
    });
    return res.json(newSettings);
  });

  // ===================== STATS ROUTE =====================
  app.get('/api/stats', (req, res) => {
    const data = db.getDb();
    const totalOrders = data.orders.length;
    const totalSales = data.orders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalMerchants = data.users.filter(u => u.role === 'merchant').length;
    const totalCustomers = data.users.filter(u => u.role === 'customer').length;
    const totalDebt = data.users.filter(u => u.role === 'merchant').reduce((sum, m) => sum + (m.debt || 0), 0);
    const activeProducts = data.products.filter(p => !p.isHidden).length;

    return res.json({
      totalOrders,
      totalSales,
      totalMerchants,
      totalCustomers,
      totalDebt,
      activeProducts
    });
  });

  // ===================== VITE OR STATIC SERVING =====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`متجر بلدي - الخادم يعمل على المنفذ ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
