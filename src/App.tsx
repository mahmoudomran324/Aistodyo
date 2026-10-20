import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Sparkles, 
  Filter, 
  MapPin, 
  Phone, 
  Truck, 
  ArrowLeft, 
  CheckCircle2, 
  Receipt, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import type { 
  User, 
  Product, 
  OrderItem, 
  AppSettings, 
  AdBanner 
} from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { QualityTermsModal } from './components/QualityTermsModal';
import { CustomerFinancials } from './components/CustomerFinancials';
import { MerchantDashboard } from './components/MerchantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CaptainPortal } from './components/CaptainPortal';
import { soundAlert } from './utils/audioAlert';

const CATEGORIES = [
  'الكل',
  'خضروات',
  'فواكه',
  'بقوليات وحبوب',
  'أجبان وألبان',
  'مجففات وعطارة'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('baladi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<AppSettings>({
    storeName: 'بلدي - متجر أحلى بقالة',
    logo: '',
    bannerImage: '',
    currency: 'ج.م',
    deliveryFee: 15,
    commissionPercent: 5,
    instapayHandle: 'baladi@instapay',
    instapayPhone: '01012345678',
    vodafoneCashNumber: '01098765432',
    captainModeEnabled: false,
    termsAndConditions: 'ميثاق الجودة وسياسة المتجر: جميع منتجات المتجر تخضع للفرز الأول وضمان الجودة الفائقة. يلتزم التاجر بتسليم خضار وفاكهة ومجففات وألبان طازجة وسليمة 100%. في حال وجود أي منتج تالف أو مخالف للمواصفات، يتم الاسترجاع فوراً مجاناً وبدون أي مصاريف إضافية على العميل، مع تحميل التاجر كامل المسؤولية.',
    returnPolicy: 'يحق للعميل معاينة الطلب عند الاستلام ورفض أو استبدال أي صنف غير مطابق للجودة دون أي تكاليف نقل أو خدمة إضافية.',
    whatsappBannedMerchantTemplate: 'مرحباً {merchant_name}، نود إعلامكم بإيقاف متجركم مؤقتاً بسبب: {reason}. الخطوات المطلوبة: {steps}',
    whatsappPasswordResetTemplate: 'مرحباً {user_name}، بيانات الدخول الخاصة بحسابك في متجر بلدي: البريد/الهاتف: {login_id}، كلمة المرور: {password}',
    whatsappDeliveryRepTemplate: 'مرحباً {customer_name}، طلبك رقم {order_id} خرج للتوصيل! المندوب اتحرك: اسمه {rep_name}، تليفونه: {rep_phone}'
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [merchantsList, setMerchantsList] = useState<User[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view navigation
  const [activeView, setActiveView] = useState<'store' | 'merchant' | 'admin' | 'customer' | 'captain'>('store');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cartItems, setCartItems] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('baladi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Background check for merchant orders to trigger siren
  const [hasUnpreparedOrders, setHasUnpreparedOrders] = useState(false);

  // Check initial quality popup
  useEffect(() => {
    const hasSeenTerms = localStorage.getItem('baladi_terms_viewed');
    if (!hasSeenTerms) {
      setIsTermsOpen(true);
      localStorage.setItem('baladi_terms_viewed', 'true');
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('baladi_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('baladi_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('baladi_user');
    }
  }, [currentUser]);

  // Fetch initial app data
  const loadAppData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedProducts, fetchedUsers, fetchedAds] = await Promise.all([
        api.getSettings(),
        api.getProducts(),
        api.getUsers('merchant'),
        api.getAds(true)
      ]);
      setSettings(fetchedSettings);
      setProducts(fetchedProducts);
      setMerchantsList(fetchedUsers);
      setAds(fetchedAds);
    } catch (e) {
      console.error('Error loading app data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  // Poll orders if current user is merchant
  useEffect(() => {
    if (currentUser?.role === 'merchant') {
      const checkMerchantOrders = async () => {
        try {
          const merchantOrders = await api.getOrders({ merchantId: currentUser.id });
          const hasNew = merchantOrders.some(o => o.status === 'new');
          setHasUnpreparedOrders(hasNew);
          if (hasNew) {
            soundAlert.playNewOrderAlarm();
          } else {
            soundAlert.stopAlarm();
          }
        } catch (e) {
          console.error(e);
        }
      };
      checkMerchantOrders();
      const interval = setInterval(checkMerchantOrders, 5000);
      return () => {
        clearInterval(interval);
        soundAlert.stopAlarm();
      };
    } else {
      soundAlert.stopAlarm();
    }
  }, [currentUser]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          unit: product.unit,
          image: product.image,
          total: product.price * quantity,
          merchantId: product.merchantId,
          merchantName: product.merchantName
        } as any
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Auth operations
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Route user directly to their respective view as requested
    if (user.role === 'admin' || user.role === 'supervisor') {
      setActiveView('admin');
    } else if (user.role === 'merchant') {
      setActiveView('merchant');
    } else if (user.role === 'captain') {
      setActiveView('captain');
    } else {
      setActiveView('customer');
    }
  };

  const handleLogout = () => {
    soundAlert.stopAlarm();
    setCurrentUser(null);
    setActiveView('store');
  };

  // Filter products for store
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'الكل' && p.category !== selectedCategory) {
      return false;
    }
    if (selectedMerchantId && p.merchantId !== selectedMerchantId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchMerchant = p.merchantName?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchMerchant) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fbfdfa] text-gray-900 flex flex-col font-['Cairo',sans-serif]">
      {/* Header */}
      <Header
        currentUser={currentUser}
        settings={settings}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenTerms={() => setIsTermsOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
        hasUnpreparedOrders={hasUnpreparedOrders}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeView === 'store' && (
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
            {/* HERO ADS BANNER SLIDER */}
            {ads.length > 0 && (
              <div className="relative rounded-3xl overflow-hidden shadow-md border border-emerald-100 bg-emerald-900 text-white min-h-[160px] md:min-h-[220px] flex items-center">
                <img
                  src={ads[0].image}
                  alt={ads[0].title}
                  className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay"
                />
                <div className="relative z-10 p-6 md:p-10 max-w-2xl space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[11px] font-black tracking-wider uppercase">
                    عروض اليوم الطازجة
                  </span>
                  <h2 className="text-xl md:text-3xl font-black leading-tight text-white drop-shadow-sm">
                    {ads[0].title}
                  </h2>
                  <p className="text-xs md:text-sm text-emerald-100 max-w-lg leading-relaxed">
                    {ads[0].description}
                  </p>
                </div>
              </div>
            )}

            {/* Quality Commitment Ribbon */}
            <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <div className="p-1.5 bg-emerald-700 text-white rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>ضمان بلدي الذهبي: خضار وفاكهة ومجففات فرز أول 100%، واسترجاع فوري مجاني.</span>
              </div>
              <button
                onClick={() => setIsTermsOpen(true)}
                className="text-emerald-800 font-extrabold hover:underline"
              >
                قراءة شروط الاسترجاع ←
              </button>
            </div>

            {/* Filter Section: Categories & Merchants */}
            <div className="space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all shadow-xs ${
                      selectedCategory === cat
                        ? 'bg-emerald-800 text-white shadow-md scale-102'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Merchant / Farm filter picker */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-gray-700">تصفية حسب التاجر / المزرعة:</span>
                  <select
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">جميع التجار والمزارع ({products.length} صنف)</option>
                    {merchantsList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.storeName || m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-semibold text-gray-500">
                  عرض {filteredProducts.length} صنف طازج
                </span>
              </div>
            </div>

            {/* PRODUCTS GRID (عرض شبكة وليس قائمة) */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">
                <RefreshCw className="w-10 h-10 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-sm">جاري تحميل تشكيلة المنتجات الطازجة...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-gray-800 text-base">لا توجد أصناف مطابقة للبحث أو القسم</h4>
                <p className="text-xs text-gray-400 mt-1">جرب تغيير القسم أو مسح كلمة البحث.</p>
                <button
                  onClick={() => { setSelectedCategory('الكل'); setSelectedMerchantId(''); setSearchQuery(''); }}
                  className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  عرض جميع الأصناف
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={settings.currency}
                    onAddToCart={handleAddToCart}
                    onSelectMerchant={(mId) => setSelectedMerchantId(mId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MERCHANT VIEW */}
        {activeView === 'merchant' && currentUser?.role === 'merchant' && (
          <MerchantDashboard
            currentUser={currentUser}
            settings={settings}
            onBackToStore={() => setActiveView('store')}
          />
        )}

        {/* ADMIN VIEW */}
        {activeView === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && (
          <AdminDashboard
            currentUser={currentUser}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
            onBackToStore={() => setActiveView('store')}
          />
        )}

        {/* CUSTOMER FINANCIALS & ORDERS VIEW */}
        {activeView === 'customer' && currentUser && (
          <CustomerFinancials
            currentUser={currentUser}
            settings={settings}
            onBackToStore={() => setActiveView('store')}
          />
        )}

        {/* CAPTAIN PORTAL */}
        {activeView === 'captain' && (
          <CaptainPortal
            currentUser={currentUser}
            settings={settings}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBackToStore={() => setActiveView('store')}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        settings={settings}
        onOrderSuccess={(order) => {
          // If customer is logged in, navigate to their orders view
          if (currentUser) {
            setActiveView('customer');
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        captainModeEnabled={settings.captainModeEnabled}
      />

      {/* Quality Charter & Return Policy Modal */}
      <QualityTermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        termsText={settings.termsAndConditions}
        returnPolicyText={settings.returnPolicy}
      />

      {/* Footer */}
      <footer className="bg-emerald-950 text-white text-xs border-t border-emerald-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h4 className="text-base font-black text-emerald-300">
              {settings.storeName}
            </h4>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              المنصة الرائدة لشراء الخضار، الفاكهة، البقوليات، الأجبان، والمجففات البلدية الطازجة مباشرة من المزارع وتجار الجملة المعتمدين.
            </p>
          </div>

          <div className="space-y-1.5 text-gray-300">
            <h5 className="font-bold text-white text-xs mb-2">طرق الدفع المعتمدة</h5>
            <p>• الدفع نقداً عند الاستلام (كاش)</p>
            <p>• إنستاباي InstaPay ({settings.instapayHandle || 'baladi@instapay'})</p>
            <p>• فودافون كاش ({settings.vodafoneCashNumber || '01098765432'})</p>
          </div>

          <div className="space-y-1.5 text-gray-300">
            <h5 className="font-bold text-white text-xs mb-2">ميثاق الجودة والحماية</h5>
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-emerald-400 hover:underline block text-right font-semibold"
            >
              شروط الاسترجاع المجاني الفوري
            </button>
            <p className="text-[11px] text-gray-400">
              حظر فوري لأي تاجر يخالف معايير الفرز الأول أو يورد بضاعة تالفة.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs">الدخول والإدارة</h5>
            <p className="text-[11px] text-gray-400">
              بوابة تسجيل الدخول الموحدة للعملاء، التجار، المشرفين، والإدارة العامة.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition"
            >
              تسجيل الدخول / إنشاء حساب
            </button>
          </div>
        </div>

        <div className="bg-emerald-950/80 border-t border-emerald-900/60 py-3 text-center text-[11px] text-gray-400">
          جميع الحقوق محفوظة © {new Date().getFullYear()} {settings.storeName}
        </div>
      </footer>
    </div>
  );
}
