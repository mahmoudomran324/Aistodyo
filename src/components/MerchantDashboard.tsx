import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Volume2, 
  VolumeX, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit3, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Phone, 
  User as UserIcon,
  Store,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Order, Product, User, AppSettings, OrderStatus } from '../types';
import { api } from '../services/api';
import { soundAlert } from '../utils/audioAlert';

interface MerchantDashboardProps {
  currentUser: User;
  settings: AppSettings;
  onBackToStore: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  currentUser,
  settings,
  onBackToStore
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'finances'>('orders');

  // Audio alert state
  const [isAudioRinging, setIsAudioRinging] = useState(false);

  // Delivery Rep Modal state
  const [repModalOrder, setRepModalOrder] = useState<Order | null>(null);
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');

  // Add / Edit Product Modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('خضروات');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('كيلو');
  const [prodStock, setProdStock] = useState('50');
  const [prodImage, setProdImage] = useState('');
  const [imageFileName, setImageFileName] = useState('');

  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchantData = async () => {
    try {
      const [fetchedOrders, fetchedProducts] = await Promise.all([
        api.getOrders({ merchantId: currentUser.id }),
        api.getProducts({ merchantId: currentUser.id, includeHidden: true })
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);

      // Check if there are any 'new' orders to sound the continuous siren
      const hasNew = fetchedOrders.some(o => o.status === 'new');
      if (hasNew) {
        setIsAudioRinging(true);
        soundAlert.playNewOrderAlarm();
      } else {
        if (isAudioRinging) {
          setIsAudioRinging(false);
          soundAlert.stopAlarm();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(fetchMerchantData, 4000);
    return () => {
      clearInterval(interval);
      soundAlert.stopAlarm();
    };
  }, [currentUser.id]);

  // Handle status changes
  const handleStartPreparing = async (orderId: string) => {
    try {
      // STOP SOUND IMMEDIATELY
      soundAlert.stopAlarm();
      setIsAudioRinging(false);

      await api.updateOrderStatus(orderId, { status: 'preparing' });
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الحالة');
    }
  };

  const handleOpenDeliveryModal = (order: Order) => {
    setRepModalOrder(order);
    setRepName('');
    setRepPhone('');
  };

  const handleConfirmDeliveryRep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repModalOrder) return;
    if (!repName.trim() || !repPhone.trim()) {
      alert('يرجى إدخال اسم المندوب ورقم هاتفه');
      return;
    }

    try {
      await api.updateOrderStatus(repModalOrder.id, {
        status: 'out_for_delivery',
        deliveryRep: {
          name: repName.trim(),
          phone: repPhone.trim()
        }
      });
      setRepModalOrder(null);
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل المندوب');
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    if (!window.confirm('هل تم تسليم الطلب للعميل واستلام الحساب؟')) return;
    try {
      await api.updateOrderStatus(orderId, { status: 'delivered' });
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الحالة');
    }
  };

  // Image Upload helper from file/camera
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDescription('');
    setProdCategory('خضروات');
    setProdPrice('');
    setProdUnit('كيلو');
    setProdStock('50');
    setProdImage('');
    setImageFileName('');
    setError(null);
    setProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDescription(p.description);
    setProdCategory(p.category);
    setProdPrice(String(p.price));
    setProdUnit(p.unit);
    setProdStock(String(p.stock));
    setProdImage(p.image);
    setImageFileName('');
    setError(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim()) {
      setError('يرجى إدخال اسم المنتج والسعر');
      return;
    }

    try {
      setSavingProduct(true);
      const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';
      const payload = {
        merchantId: currentUser.id,
        merchantName: currentUser.storeName || currentUser.name,
        name: prodName.trim(),
        description: prodDescription.trim(),
        category: prodCategory,
        price: parseFloat(prodPrice),
        unit: prodUnit,
        stock: parseInt(prodStock, 10) || 0,
        image: prodImage || fallbackImage
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }

      setProductModalOpen(false);
      fetchMerchantData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ المنتج');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من متجرك؟')) return;
    try {
      await api.deleteProduct(id);
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  const handleToggleProductVisibility = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { isHidden: !p.isHidden });
      fetchMerchantData();
    } catch (err: any) {
      alert(err.message || 'فشل التحديث');
    }
  };

  // Financial calculations
  const totalSales = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalOrdersCount = orders.length;
  const currentDebt = currentUser.debt || 0;
  const commissionPercent = settings.commissionPercent || 5;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* LOUD SIREN ALERT BANNER (If new orders are waiting) */}
      {isAudioRinging && (
        <div className="p-4 md:p-5 bg-red-600 text-white rounded-3xl shadow-2xl border-4 border-yellow-300 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white text-red-600 rounded-2xl animate-bounce">
              <BellRing className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                🚨 طلب جديد وصل الآن! تنبيه صوتي مستمر عالي
              </h3>
              <p className="text-xs md:text-sm text-red-100 mt-0.5">
                اضغط على زر "إيقاف الصوت وبدء التجهيز" لتأكيد استلام الطلب والبدء في الفرز.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const firstNew = orders.find(o => o.status === 'new');
              if (firstNew) {
                handleStartPreparing(firstNew.id);
              } else {
                soundAlert.stopAlarm();
                setIsAudioRinging(false);
              }
            }}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-sm md:text-base rounded-2xl shadow-xl hover:scale-105 transition flex items-center gap-2"
          >
            <VolumeX className="w-5 h-5 text-red-700" />
            <span>🛑 إيقاف الصوت - جاري التجهيز</span>
          </button>
        </div>
      )}

      {/* Top Banner & Profile Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-300" />
            <h2 className="text-2xl font-black">{currentUser.storeName || currentUser.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-xs font-bold border border-emerald-400">
              تاجر معتمد
            </span>
          </div>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">
            إدارة الطلبات الفورية، نظام التنبيه الصوتي، كتالوج المنتجات، والماليات والمديونية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Test Button */}
          <button
            onClick={() => soundAlert.playTestChime()}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            title="اختبار نغمة التنبيه"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            <span>اختبار الصوت</span>
          </button>

          <button
            onClick={onBackToStore}
            className="px-4 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl hover:bg-emerald-50 transition shadow-xs"
          >
            معاينة المتجر العام
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">مبيعات المتجر</span>
          <span className="text-xl md:text-2xl font-black text-emerald-950 mt-1 block">
            {totalSales.toFixed(1)} <span className="text-xs text-emerald-700">{settings.currency}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">عدد الطلبات</span>
          <span className="text-xl md:text-2xl font-black text-blue-950 mt-1 block">
            {totalOrdersCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">عمولة المنصة ({commissionPercent}%)</span>
          <span className="text-xl md:text-2xl font-black text-purple-950 mt-1 block">
            {((totalSales * commissionPercent) / 100).toFixed(1)} <span className="text-xs text-purple-700">{settings.currency}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">المديونية المستحقة للإدارة</span>
          <span className="text-xl md:text-2xl font-black text-rose-600 mt-1 block">
            {currentDebt.toFixed(1)} <span className="text-xs text-rose-700">{settings.currency}</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>إدارة الطلبات ({orders.length})</span>
          {orders.some(o => o.status === 'new') && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] animate-pulse">
              جديد
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>أصناف ومنتجات متجري ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'finances'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>الماليات والمديونية</span>
        </button>
      </div>

      {/* ================= TAB 1: ORDERS ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <h4 className="font-bold text-gray-700">لا توجد طلبات واردة حالياً</h4>
              <p className="text-xs text-gray-400 mt-1">عند قيام أي عميل بطلب منتجاتك سيصلك إشعار صوتي عالي فوراً.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border transition-all ${
                  order.status === 'new'
                    ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400 shadow-md'
                    : 'bg-white border-gray-200 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-900">
                      طلب #{order.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'new' && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white rounded-full flex items-center gap-1 animate-pulse">
                        <BellRing className="w-3.5 h-3.5" />
                        طلب جديد (ينتظر التجهيز)
                      </span>
                    )}
                    {order.status === 'preparing' && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 rounded-full flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري التجهيز والفرز
                      </span>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-900 rounded-full flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        خرج للتوصيل ({order.deliveryRep?.name})
                      </span>
                    )}
                    {order.status === 'delivered' && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        تم التسليم
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="py-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-gray-50/80 p-3 rounded-xl my-3">
                  <div>
                    <span className="text-gray-500 block">اسم العميل:</span>
                    <strong className="text-gray-900 text-sm">{order.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">هاتف العميل:</span>
                    <a href={`tel:${order.customerPhone}`} className="text-emerald-700 font-bold hover:underline">
                      {order.customerPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500 block">عنوان التوصيل:</span>
                    <span className="text-gray-800 font-medium">
                      {order.customerAddress.governorate}، {order.customerAddress.city}، {order.customerAddress.street}، عقار {order.customerAddress.building} {order.customerAddress.landmark ? `(${order.customerAddress.landmark})` : ''}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-gray-700 block mb-1">الأصناف المطلوبة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-150 flex justify-between items-center">
                        <span className="font-medium text-gray-800">{it.name}</span>
                        <span className="font-bold text-emerald-800">
                          {it.quantity} {it.unit} × {it.price} = {it.total.toFixed(1)} {settings.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons based on lifecycle */}
                <div className="pt-4 mt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-gray-500">إجمالي الطلب: </span>
                    <strong className="text-sm font-black text-emerald-950">
                      {order.total.toFixed(1)} {settings.currency}
                    </strong>
                    <span className="mr-2 text-gray-400">
                      ({order.paymentMethod === 'cash' ? 'كاش' : order.paymentMethod === 'instapay' ? 'إنستاباي' : 'فودافون كاش'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* BUTTON 1: START PREPARING (STOPS SIREN) */}
                    {order.status === 'new' && (
                      <button
                        onClick={() => handleStartPreparing(order.id)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <VolumeX className="w-4 h-4" />
                        <span>إيقاف الصوت - جاري التجهيز</span>
                      </button>
                    )}

                    {/* BUTTON 2: OUT FOR DELIVERY (OPENS DELIVERY REP POPUP) */}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleOpenDeliveryModal(order)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        <span>خرج للتوصيل (تحديد المندوب)</span>
                      </button>
                    )}

                    {/* BUTTON 3: MARK DELIVERED */}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleMarkDelivered(order.id)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>تأكيد التسليم بنجاح</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 2: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-gray-900">
              قائمة المنتجات المعروضة في المتجر (تظهر فوراً للعملاء)
            </h4>
            <button
              onClick={openAddProductModal}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد بالصورة</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-3 flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                  p.isHidden ? 'border-dashed border-gray-300 opacity-60 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 mb-2">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    {p.isHidden && (
                      <div className="absolute inset-0 bg-black/50 text-white text-[11px] font-bold flex items-center justify-center">
                        مخفي عن العملاء
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {p.category}
                  </span>
                  <h5 className="font-bold text-xs md:text-sm text-gray-900 mt-1 line-clamp-1">
                    {p.name}
                  </h5>
                  <p className="text-xs font-black text-emerald-900 mt-1">
                    {p.price} {settings.currency} / {p.unit}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    الكمية المتاحة: {p.stock} {p.unit}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-gray-150 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleToggleProductVisibility(p)}
                    className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
                    title={p.isHidden ? 'إظهار في المتجر' : 'إخفاء مؤقت'}
                  >
                    {p.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditProductModal(p)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="تعديل الصنف"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: FINANCES ================= */}
      {activeTab === 'finances' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h4 className="font-bold text-base text-gray-900">
            كشف حساب التاجر والمديونية المستحقة
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            يتم احتساب عمولة المنصة بنسبة ({commissionPercent}%) على إجمالي المبيعات، ويتم تسوية وتصفير المديونية دورياً من قبل إدارة بلدي بعد التأكد الفعلي من التحويل.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-xs text-gray-500 block">إجمالي مبيعاتك المحققة</span>
              <strong className="text-xl font-black text-gray-900 block mt-1">
                {totalSales.toFixed(1)} {settings.currency}
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-xs text-purple-700 block">إجمالي عمولات المنصة المستحقة</span>
              <strong className="text-xl font-black text-purple-900 block mt-1">
                {((totalSales * commissionPercent) / 100).toFixed(1)} {settings.currency}
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs text-rose-700 block">المديونية الحالية غير المسددة</span>
              <strong className="text-xl font-black text-rose-900 block mt-1">
                {currentDebt.toFixed(1)} {settings.currency}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELIVERY REP INPUT ================= */}
      {repModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-700" />
                <h4 className="font-bold text-base text-purple-950">بيانات مندوب التوصيل</h4>
              </div>
              <button onClick={() => setRepModalOrder(null)} className="text-gray-400 hover:text-gray-600">
                <VolumeX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              بمجرد التأكيد، سيصل إشعار فوري للعميل: <strong>"المندوب اتحرك، اسمه كذا وتليفونه كذا"</strong> مع أزرار اتصال وواتساب.
            </p>

            <form onSubmit={handleConfirmDeliveryRep} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم المندوب</label>
                <input
                  type="text"
                  required
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="مثال: كابتن محمد حسن..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">رقم هاتف المندوب</label>
                <input
                  type="tel"
                  required
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRepModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md"
                >
                  تأكيد وإرسال الإشعار للعميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT PRODUCT ================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-base text-gray-900">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمتجر'}
              </h4>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <VolumeX className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="مثال: طماطم بلدي فرز أول قطفة الفجر..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">القسم والتصنيف</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="خضروات">خضروات طازجة</option>
                    <option value="فواكه">فواكه موسمية</option>
                    <option value="بقوليات وحبوب">بقوليات وحبوب</option>
                    <option value="أجبان وألبان">أجبان وألبان بلدية</option>
                    <option value="مجففات وعطارة">مجففات وعطارة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">وحدة البيع</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="كيلو">كيلو</option>
                    <option value="نصف كيلو">نصف كيلو</option>
                    <option value="جرام">جرام</option>
                    <option value="ربطة">ربطة</option>
                    <option value="طبق">طبق</option>
                    <option value="كيس">كيس</option>
                    <option value="قطعة">قطعة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">السعر ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="مثال: 15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">الكمية المتوفرة</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <label className="block text-gray-800 font-bold">صورة المنتج (رفع من الهاتف أو الكمبيوتر)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                    <Upload className="w-4 h-4" />
                    <span>اختر صورة من جهازك</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  {imageFileName && (
                    <span className="text-[11px] text-gray-600 truncate">{imageFileName}</span>
                  )}
                </div>

                {prodImage && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-300 mt-2">
                    <img src={prodImage} alt="معاينة" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">وصف المنتج (اختياري)</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="وصف مختصر لمصدر وجودة المنتج..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ ونشر في المتجر فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
