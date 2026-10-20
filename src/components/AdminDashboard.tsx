import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingBag, 
  Megaphone, 
  Settings, 
  KeyRound, 
  DollarSign, 
  ShieldAlert, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Edit3, 
  Eye, 
  EyeOff, 
  Upload, 
  MessageSquare, 
  Phone, 
  Truck, 
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { 
  User, 
  Product, 
  Order, 
  AdBanner, 
  PasswordResetRequest, 
  AppSettings, 
  FinancialTransaction 
} from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  currentUser: User;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  settings,
  onUpdateSettings,
  onBackToStore
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'merchants' | 'customers' | 'supervisors' | 'products' | 'orders' | 'ads' | 'resets' | 'settings'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [merchants, setMerchants] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Ban merchant modal state
  const [banModalMerchant, setBanModalMerchant] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banSteps, setBanSteps] = useState('');
  const [banSuccessInfo, setBanSuccessInfo] = useState<{ whatsappUrl: string; message: string } | null>(null);

  // Settle debt modal state
  const [debtModalMerchant, setDebtModalMerchant] = useState<User | null>(null);
  const [debtNotes, setDebtNotes] = useState('');

  // Add Merchant/Customer/Supervisor modal state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'merchant' | 'customer' | 'supervisor'>('merchant');
  const [newUserStoreName, setNewUserStoreName] = useState('');
  const [supervisorPerms, setSupervisorPerms] = useState<string[]>(['products', 'orders', 'merchants']);

  // Add Product Modal state
  const [adminProductModal, setAdminProductModal] = useState(false);
  const [prodMerchantId, setProdMerchantId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('خضروات');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('كيلو');
  const [prodStock, setProdStock] = useState('50');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // Add Ad Modal state
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adImage, setAdImage] = useState('');
  const [adType, setAdType] = useState<'top_banner' | 'popup' | 'sponsored'>('top_banner');
  const [adStartDate, setAdStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [adEndDate, setAdEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

  // Settings form state
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Check supervisor permissions
  const isSupervisor = currentUser.role === 'supervisor';
  const hasPerm = (perm: string) => {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(perm);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        fetchedStats,
        allUsers,
        allProducts,
        allOrders,
        allAds,
        resets,
        txs,
        currentSettings
      ] = await Promise.all([
        api.getStats(),
        api.getUsers(),
        api.getProducts({ includeHidden: true }),
        api.getOrders(),
        api.getAds(),
        api.getForgotPasswordRequests(),
        api.getTransactions(),
        api.getSettings()
      ]);

      setStats(fetchedStats);
      setMerchants(allUsers.filter(u => u.role === 'merchant'));
      setCustomers(allUsers.filter(u => u.role === 'customer'));
      setSupervisors(allUsers.filter(u => u.role === 'supervisor'));
      setProducts(allProducts);
      setOrders(allOrders);
      setAds(allAds);
      setResetRequests(resets);
      setTransactions(txs);
      setFormSettings(currentSettings);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // BAN MERCHANT
  const handleConfirmBanMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalMerchant) return;
    try {
      const res = await api.banMerchant(banModalMerchant.id, banReason, banSteps);
      setBanSuccessInfo(res);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'فشل حظر التاجر');
    }
  };

  const handleUnbanMerchant = async (merchantId: string) => {
    if (!window.confirm('هل تريد رفع الحظر عن هذا التاجر وإعادة إظهار كافة منتجاته في المتجر؟')) return;
    try {
      await api.unbanMerchant(merchantId);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'فشل رفع الحظر');
    }
  };

  // SETTLE DEBT
  const handleConfirmSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtModalMerchant) return;
    try {
      await api.settleMerchantDebt(debtModalMerchant.id, debtNotes);
      setDebtModalMerchant(null);
      setDebtNotes('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'فشل تصفير المديونية');
    }
  };

  // BAN/UNBAN CUSTOMER
  const handleToggleCustomerBan = async (customerId: string) => {
    try {
      await api.toggleBanUser(customerId);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // DELETE USER
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد تماماً من حذف (${name})؟ سيتم مسح بياناته بالكامل.`)) return;
    try {
      await api.deleteUser(userId);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CREATE USER
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newUserName.trim(),
        phone: newUserPhone.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
        storeName: newUserRole === 'merchant' ? newUserStoreName.trim() : undefined,
        permissions: newUserRole === 'supervisor' ? supervisorPerms : undefined
      });
      setAddUserModalOpen(false);
      setNewUserName('');
      setNewUserPhone('');
      setNewUserEmail('');
      setNewUserPassword('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء المستخدم');
    }
  };

  // PRODUCT MANAGEMENT
  const handleAdminCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedMerchant = merchants.find(m => m.id === prodMerchantId) || merchants[0];
      await api.createProduct({
        merchantId: selectedMerchant ? selectedMerchant.id : 'merchant-1',
        merchantName: selectedMerchant ? (selectedMerchant.storeName || selectedMerchant.name) : 'مزرعة بلدي',
        name: prodName.trim(),
        description: prodDesc.trim(),
        category: prodCategory,
        price: parseFloat(prodPrice),
        unit: prodUnit,
        stock: parseInt(prodStock, 10) || 50,
        image: prodImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'
      });
      setAdminProductModal(false);
      setProdName('');
      setProdPrice('');
      setProdImage('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة المنتج');
    }
  };

  const handleToggleProductHide = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { isHidden: !p.isHidden });
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;
    try {
      await api.deleteProduct(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ADS MANAGEMENT
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adImage) {
      alert('يرجى رفع صورة الإعلان');
      return;
    }
    try {
      await api.createAd({
        title: adTitle.trim(),
        description: adDesc.trim(),
        image: adImage,
        type: adType,
        startDate: adStartDate,
        endDate: adEndDate,
        isActive: true
      });
      setAdModalOpen(false);
      setAdTitle('');
      setAdDesc('');
      setAdImage('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'فشل نشر الإعلان');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
    try {
      await api.deleteAd(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // RESOLVE PASSWORD RESET VIA WHATSAPP
  const handleResolvePasswordReset = async (req: PasswordResetRequest) => {
    const user = customers.find(c => c.phone === req.phone) || merchants.find(m => m.phone === req.phone);
    const template = formSettings.whatsappPasswordResetTemplate || 
      'مرحباً {user_name}، بيانات الدخول الخاصة بحسابك في متجر بلدي: البريد/الهاتف: {login_id}، كلمة المرور: {password}';
    
    const message = template
      .replace('{user_name}', req.userName || 'عميلنا العزيز')
      .replace('{login_id}', req.phone)
      .replace('{password}', user ? (user as any).password || '123456' : '123456');

    const cleanPhone = req.phone.replace(/^0/, '20');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    await api.resolveForgotPassword(req.id);
    loadAllData();
    window.open(waUrl, '_blank');
  };

  // SAVE SETTINGS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(formSettings);
      onUpdateSettings(updated);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 2500);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    }
  };

  // Image upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'ad' | 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (target === 'product') setProdImage(res);
        if (target === 'ad') setAdImage(res);
        if (target === 'logo') setFormSettings(s => ({ ...s, logo: res }));
        if (target === 'banner') setFormSettings(s => ({ ...s, bannerImage: res }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black">
              لوحة التحكم المركزية - {formSettings.storeName}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-xs font-bold border border-emerald-500">
              {currentUser.role === 'admin' ? 'مدير عام كامل الصلاحيات' : 'مشرف معتمد'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">
            إدارة التجار، الرقابة على المنتجات، تصفير المديونية، الإعلانات الممولة، وإعدادات المنصة
          </p>
        </div>

        <button
          onClick={onBackToStore}
          className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5"
        >
          <span>زيارة واجهة المتجر</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap border-b border-gray-200 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          نظرة عامة والماليات
        </button>

        {hasPerm('merchants') && (
          <button
            onClick={() => setActiveTab('merchants')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'merchants'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            إدارة التجار والمديونية ({merchants.length})
          </button>
        )}

        {hasPerm('customers') && (
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'customers'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            إدارة العملاء ({customers.length})
          </button>
        )}

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('supervisors')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'supervisors'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            المشرفين والصلاحيات ({supervisors.length})
          </button>
        )}

        {hasPerm('products') && (
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'products'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            المنتجات والرقابة ({products.length})
          </button>
        )}

        {hasPerm('orders') && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            متابعة الطلبات ({orders.length})
          </button>
        )}

        {hasPerm('ads') && (
          <button
            onClick={() => setActiveTab('ads')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'ads'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            الإعلانات الممولة ({ads.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('resets')}
          className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition relative ${
            activeTab === 'resets'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          طلبات نسيت كلمة السر ({resetRequests.filter(r => r.status === 'pending').length})
          {resetRequests.some(r => r.status === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block mr-1"></span>
          )}
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            الإعدادات والماليات
          </button>
        )}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-bold block">إجمالي المبيعات</span>
              <strong className="text-xl font-black text-emerald-950 block mt-1">
                {stats.totalSales.toFixed(1)} {formSettings.currency}
              </strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-bold block">عدد الطلبات</span>
              <strong className="text-xl font-black text-blue-950 block mt-1">
                {stats.totalOrders}
              </strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-bold block">إجمالي التجار</span>
              <strong className="text-xl font-black text-amber-950 block mt-1">
                {stats.totalMerchants}
              </strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-bold block">إجمالي العملاء</span>
              <strong className="text-xl font-black text-indigo-950 block mt-1">
                {stats.totalCustomers}
              </strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-bold block">إجمالي المديونيات</span>
              <strong className="text-xl font-black text-rose-600 block mt-1">
                {stats.totalDebt.toFixed(1)} {formSettings.currency}
              </strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-500 font-bold block">المنتجات النشطة</span>
              <strong className="text-xl font-black text-teal-950 block mt-1">
                {stats.activeProducts}
              </strong>
            </div>
          </div>

          {/* Recent Financial Ledger */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-900">سجل المعاملات المالية الموثقة للمنصة</h4>
                <p className="text-xs text-gray-500">توثيق عمليات الشراء، تصفير مديونيات التجار، والتحويلات</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">رقم المعاملة</th>
                    <th className="py-2.5 px-4">التاريخ</th>
                    <th className="py-2.5 px-4">الطرف</th>
                    <th className="py-2.5 px-4">النوع</th>
                    <th className="py-2.5 px-4">وسيلة الدفع</th>
                    <th className="py-2.5 px-4">المبلغ</th>
                    <th className="py-2.5 px-4">البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {transactions.slice(0, 15).map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-900">{tx.id}</td>
                      <td className="py-2.5 px-4 text-gray-500">{new Date(tx.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="py-2.5 px-4 font-semibold">{tx.userName}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'debt_settlement' ? 'bg-purple-100 text-purple-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {tx.type === 'debt_settlement' ? 'تصفير مديونية' : 'سداد طلب'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">{tx.paymentMethod}</td>
                      <td className="py-2.5 px-4 font-black text-emerald-800">{tx.amount.toFixed(1)} {formSettings.currency}</td>
                      <td className="py-2.5 px-4 text-gray-500 max-w-xs truncate">{tx.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MERCHANTS ================= */}
      {activeTab === 'merchants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-gray-900">
              قائمة التجار وإدارة المديونية والحظر المؤقت
            </h4>
            <button
              onClick={() => {
                setNewUserRole('merchant');
                setAddUserModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تاجر جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">اسم التاجر / المتجر</th>
                    <th className="py-3 px-4">رقم الهاتف</th>
                    <th className="py-3 px-4">إجمالي المبيعات</th>
                    <th className="py-3 px-4">المديونية الحالية</th>
                    <th className="py-3 px-4">حالة الحساب</th>
                    <th className="py-3 px-4 text-center">الإجراءات الإدارية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {merchants.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <strong className="block text-gray-900">{m.storeName || m.name}</strong>
                        <span className="text-[11px] text-gray-500">{m.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">{m.phone}</td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {(m.totalSales || 0).toFixed(1)} {formSettings.currency}
                      </td>
                      <td className="py-3 px-4 font-black text-rose-600">
                        {(m.debt || 0).toFixed(1)} {formSettings.currency}
                      </td>
                      <td className="py-3 px-4">
                        {m.isBanned ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            محظور مؤقتاً ({m.banReason})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            نشط ومنتجاته معروضة
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Settle Debt Button */}
                          <button
                            onClick={() => {
                              setDebtModalMerchant(m);
                              setDebtNotes('');
                            }}
                            className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition"
                            title="تصفير المديونية بعد التحقق من السداد"
                          >
                            تصفير المديونية
                          </button>

                          {/* Ban / Unban Button */}
                          {m.isBanned ? (
                            <button
                              onClick={() => handleUnbanMerchant(m.id)}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold text-[11px] transition"
                            >
                              رفع الحظر
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setBanModalMerchant(m);
                                setBanReason('تأخر في سداد المديونية المستحقة / مخالفة معايير الجودة');
                                setBanSteps('يرجى سداد مديونية المنصة والتواصل مع المشرف المسؤول لإعادة فتح المتجر');
                                setBanSuccessInfo(null);
                              }}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg font-bold text-[11px] transition"
                            >
                              حظر مؤقت وإخفاء المنتجات
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(m.id, m.name)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="حذف التاجر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CUSTOMERS ================= */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-gray-900">
              قائمة العملاء المسجلين
            </h4>
            <button
              onClick={() => {
                setNewUserRole('customer');
                setAddUserModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل يدوياً</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">اسم العميل</th>
                    <th className="py-3 px-4">الهاتف</th>
                    <th className="py-3 px-4">العنوان المسجل</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono">{c.phone}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {c.address ? `${c.address.governorate} - ${c.address.city} - ${c.address.street}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {c.isBanned ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            محظور
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            نشط
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleCustomerBan(c.id)}
                            className="text-xs text-amber-700 hover:underline font-semibold"
                          >
                            {c.isBanned ? 'إلغاء الحظر' : 'حظر العميل'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(c.id, c.name)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="حذف العميل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SUPERVISORS ================= */}
      {activeTab === 'supervisors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-base text-gray-900">
                إدارة المشرفين وتحديد الصلاحيات المخصصة
              </h4>
              <p className="text-xs text-gray-500">
                يمكن لكل مشرف إدارة أقسام محددة دون الوصول لكامل إعدادات النظام.
              </p>
            </div>
            <button
              onClick={() => {
                setNewUserRole('supervisor');
                setAddUserModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشرف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisors.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <div>
                    <h5 className="font-bold text-sm text-gray-900">{s.name}</h5>
                    <span className="text-[11px] text-gray-500">{s.phone}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(s.id, s.name)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="حذف المشرف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-600 block mb-1">
                    الأقسام والصلاحيات المصرح بها:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(s.permissions || []).map(perm => (
                      <span key={perm} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        {perm === 'products' ? 'المنتجات' :
                         perm === 'merchants' ? 'التجار' :
                         perm === 'customers' ? 'العملاء' :
                         perm === 'orders' ? 'الطلبات' :
                         perm === 'ads' ? 'الإعلانات' : perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-gray-900">
              كتالوج المنتجات والرقابة على جودة البضاعة
            </h4>
            <button
              onClick={() => setAdminProductModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج لأي تاجر بالصورة</span>
            </button>
          </div>

          {/* GRID LAYOUT FOR PRODUCTS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {products.map(p => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-3 flex flex-col justify-between shadow-xs transition ${
                  p.isHidden ? 'opacity-60 bg-gray-50 border-red-200' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 mb-2">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    {p.isHidden && (
                      <div className="absolute inset-0 bg-red-900/60 text-white text-[10px] font-bold flex items-center justify-center p-1 text-center">
                        مخفي للمخالفة أو حظر التاجر
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {p.category}
                  </span>
                  <h5 className="font-bold text-xs text-gray-900 mt-1 line-clamp-1">{p.name}</h5>
                  <p className="text-[11px] text-gray-500 truncate">{p.merchantName}</p>
                  <p className="text-xs font-black text-emerald-900 mt-1">
                    {p.price} {formSettings.currency} / {p.unit}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-gray-150 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleProductHide(p)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                    title={p.isHidden ? 'إظهار المنتج في المتجر' : 'إخفاء المنتج للمخالفة'}
                  >
                    {p.isHidden ? <EyeOff className="w-4 h-4 text-red-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="حذف المنتج"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 6: ORDERS ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h4 className="font-bold text-base text-gray-900">
            متابعة حركة كافة الطلبات المباشرة
          </h4>
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-emerald-950 font-black">طلب #{order.id}</strong>
                    <span className="text-gray-500">{new Date(order.createdAt).toLocaleString('ar-EG')}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                      {order.merchantName}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    العميل: <strong>{order.customerName}</strong> ({order.customerPhone}) • العنوان: {order.customerAddress.governorate}، {order.customerAddress.city}، {order.customerAddress.street}
                  </p>
                  {order.deliveryRep && (
                    <p className="text-purple-900 font-semibold mt-0.5">
                      🚚 المندوب: {order.deliveryRep.name} ({order.deliveryRep.phone})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-sm text-emerald-900">
                    {order.total.toFixed(1)} {formSettings.currency}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-bold ${
                    order.status === 'new' ? 'bg-red-100 text-red-800' :
                    order.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {order.status === 'new' ? 'جديد' :
                     order.status === 'preparing' ? 'جاري التجهيز' :
                     order.status === 'out_for_delivery' ? 'خرج للتوصيل' : 'تم التسليم'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 7: ADS ================= */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-base text-gray-900">
                نظام الإعلانات الممولة (صور فعلية من جهازك)
              </h4>
              <p className="text-xs text-gray-500">
                إضافة حملات إعلانية تظهر في واجهة المتجر كمصدر دخل إضافي دون روابط خارجية.
              </p>
            </div>
            <button
              onClick={() => setAdModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>رفع إعلان جديد بالصورة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map(ad => (
              <div key={ad.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between">
                <div className="relative aspect-16/9 bg-gray-100">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-800">
                    {ad.type === 'top_banner' ? 'بانر رئيسي' : 'إعلان ممول'}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h5 className="font-bold text-sm text-gray-900">{ad.title}</h5>
                  <p className="text-xs text-gray-500 line-clamp-2">{ad.description}</p>
                  <p className="text-[11px] text-gray-400">
                    الفترة: من {ad.startDate} إلى {ad.endDate}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-xs">
                  <span className={ad.isActive ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                    {ad.isActive ? '● نشط حالياً' : 'متوقف'}
                  </span>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="حذف الإعلان"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 8: FORGOT PASSWORD REQUESTS ================= */}
      {activeTab === 'resets' && (
        <div className="space-y-4">
          <h4 className="font-bold text-base text-gray-900">
            طلبات استعادة كلمة السر الواردة من العملاء والتجار
          </h4>
          <p className="text-xs text-gray-500">
            عند الضغط على زر "إرسال عبر واتساب"، يتم فتح محادثة واتساب تلقائية مع العميل تحتوي على بيانات دخوله.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">رقم الهاتف</th>
                    <th className="py-3 px-4">اسم العضو المسجل</th>
                    <th className="py-3 px-4">وقت الطلب</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {resetRequests.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-bold">{req.phone}</td>
                      <td className="py-3 px-4">{req.userName || 'غير محدد'}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(req.requestedAt).toLocaleString('ar-EG')}</td>
                      <td className="py-3 px-4">
                        {req.status === 'pending' ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            بانتظار إرسال الواتساب
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            تم الإرسال والحل
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleResolvePasswordReset(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 mx-auto shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>إرسال البيانات عبر واتساب</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 9: SETTINGS & FINANCES ================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-xs text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h4 className="font-bold text-base text-gray-900">
                إعدادات المتجر والماليات وأرقام الدفع (InstaPay & Vodafone Cash)
              </h4>
              <p className="text-gray-500 mt-0.5">
                تحديث أرقام التحويل، الشعار، ميثاق الجودة، وتفعيل واجهة الكباتن
              </p>
            </div>
            {settingsSavedMessage && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center gap-1 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                تم حفظ وتطبيق التعديلات بنجاح!
              </span>
            )}
          </div>

          {/* Store Name & Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1">اسم المتجر والتطبيق</label>
              <input
                type="text"
                required
                value={formSettings.storeName}
                onChange={(e) => setFormSettings({ ...formSettings, storeName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">رفع شعار المتجر (صورة من الجهاز)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>اختر صورة الشعار</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                  />
                </label>
                {formSettings.logo && (
                  <img src={formSettings.logo} alt="الشعار" className="w-8 h-8 rounded-lg object-contain border" />
                )}
              </div>
            </div>
          </div>

          {/* InstaPay & Vodafone Cash details */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
            <h5 className="font-bold text-sm text-purple-950">بيانات وأرقام الدفع الإلكتروني</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-purple-900 font-bold mb-1">عنوان حساب إنستاباي (InstaPay Handle)</label>
                <input
                  type="text"
                  value={formSettings.instapayHandle}
                  onChange={(e) => setFormSettings({ ...formSettings, instapayHandle: e.target.value })}
                  placeholder="name@instapay"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-purple-900 font-bold mb-1">رقم هاتف إنستاباي</label>
                <input
                  type="text"
                  value={formSettings.instapayPhone}
                  onChange={(e) => setFormSettings({ ...formSettings, instapayPhone: e.target.value })}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-red-900 font-bold mb-1">رقم محفظة فودافون كاش</label>
                <input
                  type="text"
                  value={formSettings.vodafoneCashNumber}
                  onChange={(e) => setFormSettings({ ...formSettings, vodafoneCashNumber: e.target.value })}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Delivery & Commission & Captain Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1">رسوم التوصيل الافتراضية ({formSettings.currency})</label>
              <input
                type="number"
                value={formSettings.deliveryFee}
                onChange={(e) => setFormSettings({ ...formSettings, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">نسبة عمولة المنصة من التجار (%)</label>
              <input
                type="number"
                value={formSettings.commissionPercent}
                onChange={(e) => setFormSettings({ ...formSettings, commissionPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            {/* Captain Mode switch */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col justify-between">
              <span className="font-bold text-amber-950 block">واجهة الكباتن والتوصيل</span>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={formSettings.captainModeEnabled}
                  onChange={(e) => setFormSettings({ ...formSettings, captainModeEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-[11px] font-bold text-amber-900">
                  {formSettings.captainModeEnabled ? 'ظاهرة حالياً في المتجر' : 'مخفية (حتى تجهيز الأسطول)'}
                </span>
              </label>
            </div>
          </div>

          {/* WhatsApp message templates */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
            <h5 className="font-bold text-sm text-gray-900">قوالب رسائل الواتساب التلقائية</h5>
            <div>
              <label className="block text-gray-700 font-bold mb-1">قالب إشعار حظر تاجر</label>
              <textarea
                rows={2}
                value={formSettings.whatsappBannedMerchantTemplate}
                onChange={(e) => setFormSettings({ ...formSettings, whatsappBannedMerchantTemplate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">قالب إشعار خروج المندوب للتوصيل للعميل</label>
              <textarea
                rows={2}
                value={formSettings.whatsappDeliveryRepTemplate}
                onChange={(e) => setFormSettings({ ...formSettings, whatsappDeliveryRepTemplate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          {/* Terms & Return Policy */}
          <div className="space-y-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">ميثاق الجودة وسياسة المتجر الرسمية</label>
              <textarea
                rows={3}
                value={formSettings.termsAndConditions}
                onChange={(e) => setFormSettings({ ...formSettings, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">سياسة الاسترجاع المجاني الفوري</label>
              <textarea
                rows={2}
                value={formSettings.returnPolicy}
                onChange={(e) => setFormSettings({ ...formSettings, returnPolicy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              حفظ جميع الإعدادات وتطبيقها فوراً
            </button>
          </div>
        </form>
      )}

      {/* ================= MODAL: BAN MERCHANT ================= */}
      {banModalMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2 text-red-700">
                <Ban className="w-5 h-5" />
                <h4 className="font-bold text-base">حظر التاجر مؤقتاً وإخفاء المنتجات</h4>
              </div>
              <button onClick={() => setBanModalMerchant(null)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <p className="text-xs text-gray-600">
              سيتم فوراً إخفاء كافة منتجات التاجر <strong>({banModalMerchant.storeName || banModalMerchant.name})</strong> من المتجر، وإرسال رسالة توضيحية عبر واتساب.
            </p>

            <form onSubmit={handleConfirmBanMerchant} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">سبب الحظر (يظهر للتاجر)</label>
                <textarea
                  rows={2}
                  required
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="مثال: تأخر في سداد المديونية / إرسال بضاعة غير مطابقة للجودة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">الخطوات المطلوبة لحل المشكلة ورفع الحظر</label>
                <textarea
                  rows={2}
                  required
                  value={banSteps}
                  onChange={(e) => setBanSteps(e.target.value)}
                  placeholder="مثال: يرجى التواصل مع الإدارة لسداد المديونية عبر فودافون كاش أو إنستاباي..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              {banSuccessInfo && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <span className="text-emerald-800 font-bold block text-xs">
                    تم تفعيل الحظر وإخفاء المنتجات بنجاح!
                  </span>
                  <a
                    href={banSuccessInfo.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    فتح وإرسال رسالة الواتساب للتاجر الآن
                  </a>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBanModalMerchant(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  إغلاق
                </button>
                {!banSuccessInfo && (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                  >
                    تأكيد الحظر والإخفاء
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SETTLE DEBT ================= */}
      {debtModalMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-base text-purple-950">تصفير مديونية التاجر</h4>
              <button onClick={() => setDebtModalMerchant(null)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <p className="text-xs text-gray-600">
              التاجر: <strong>{debtModalMerchant.storeName || debtModalMerchant.name}</strong> • المديونية الحالية: <strong>{(debtModalMerchant.debt || 0).toFixed(1)} {formSettings.currency}</strong>
            </p>

            <form onSubmit={handleConfirmSettleDebt} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">ملاحظات التحقق من السداد الفعلي</label>
                <textarea
                  rows={2}
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder="مثال: تم التأكد من استلام الحوالة على فودافون كاش كود 88471..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDebtModalMerchant(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md"
                >
                  تأكيد التصفير وتسجيل القيد المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD USER (Merchant/Customer/Supervisor) ================= */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-base text-gray-900">
                {newUserRole === 'merchant' ? 'إضافة تاجر جديد' :
                 newUserRole === 'supervisor' ? 'إضافة مشرف نظام جديد' : 'إضافة عميل جديد'}
              </h4>
              <button onClick={() => setAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="اسم الشخص..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              {newUserRole === 'merchant' && (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">اسم المتجر / المزرعة</label>
                  <input
                    type="text"
                    required
                    value={newUserStoreName}
                    onChange={(e) => setNewUserStoreName(e.target.value)}
                    placeholder="مثال: مزارع بلدي..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-bold mb-1">رقم الهاتف (اسم الدخول)</label>
                <input
                  type="tel"
                  required
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="كلمة المرور..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              {newUserRole === 'supervisor' && (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">صلاحيات المشرف</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'products', label: 'المنتجات والرقابة' },
                      { key: 'merchants', label: 'إدارة التجار' },
                      { key: 'customers', label: 'إدارة العملاء' },
                      { key: 'orders', label: 'متابعة الطلبات' },
                      { key: 'ads', label: 'الإعلانات الممولة' }
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={supervisorPerms.includes(perm.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSupervisorPerms([...supervisorPerms, perm.key]);
                            } else {
                              setSupervisorPerms(supervisorPerms.filter(k => k !== perm.key));
                            }
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span className="text-[11px] font-semibold">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md"
                >
                  تأكيد الإضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PRODUCT FOR MERCHANT ================= */}
      {adminProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-base text-gray-900">إضافة منتج من الإدارة</h4>
              <button onClick={() => setAdminProductModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <form onSubmit={handleAdminCreateProduct} className="space-y-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">التاجر المالك للمنتج</label>
                <select
                  value={prodMerchantId}
                  onChange={(e) => setProdMerchantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                >
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.storeName || m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="طماطم، خيار، تفاح، جبن..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">القسم</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  >
                    <option value="خضروات">خضروات</option>
                    <option value="فواكه">فواكه</option>
                    <option value="بقوليات وحبوب">بقوليات وحبوب</option>
                    <option value="أجبان وألبان">أجبان وألبان</option>
                    <option value="مجففات وعطارة">مجففات وعطارة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">وحدة البيع</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  >
                    <option value="كيلو">كيلو</option>
                    <option value="نصف كيلو">نصف كيلو</option>
                    <option value="جرام">جرام</option>
                    <option value="ربطة">ربطة</option>
                    <option value="طبق">طبق</option>
                    <option value="كيس">كيس</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">السعر ({formSettings.currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">الكمية</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">صورة المنتج (رفع من الهاتف أو الكمبيوتر)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من الجهاز</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'product')}
                      className="hidden"
                    />
                  </label>
                  {prodImage && (
                    <img src={prodImage} alt="معاينة" className="w-10 h-10 rounded-lg object-cover border" />
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdminProductModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md"
                >
                  نشر المنتج في المتجر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD AD ================= */}
      {adModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-base text-gray-900">إضافة إعلان ممول جديد</h4>
              <button onClick={() => setAdModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">عنوان الإعلان</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="مثال: مهرجان الخضار والفاكهة الطازجة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">تفاصيل العرض</label>
                <textarea
                  rows={2}
                  value={adDesc}
                  onChange={(e) => setAdDesc(e.target.value)}
                  placeholder="وصف تفصيلي للخصم أو العرض..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">صورة الإعلان (رفع من الجهاز)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>اختر ملف الصورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'ad')}
                      className="hidden"
                    />
                  </label>
                  {adImage && (
                    <img src={adImage} alt="معاينة" className="w-16 h-10 rounded-lg object-cover border" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">تاريخ البداية</label>
                  <input
                    type="date"
                    value={adStartDate}
                    onChange={(e) => setAdStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">تاريخ النهاية</label>
                  <input
                    type="date"
                    value={adEndDate}
                    onChange={(e) => setAdEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md"
                >
                  نشر الإعلان فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
