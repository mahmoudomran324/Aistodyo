import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, X, AlertCircle, CheckCircle, Phone, Mail, Lock, User as UserIcon, Store, MapPin, Truck } from 'lucide-react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  captainModeEnabled: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  captainModeEnabled
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states - completely empty by default for security
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('customer');
  const [regStoreName, setRegStoreName] = useState('');
  const [regGovernorate, setRegGovernorate] = useState('القاهرة');
  const [regCity, setRegCity] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regBuilding, setRegBuilding] = useState('');
  const [regLandmark, setRegLandmark] = useState('');
  const [regVehicleType, setRegVehicleType] = useState('دراجة نارية / موتوسيكل');

  // Forgot password form
  const [forgotPhone, setForgotPhone] = useState('');

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError('يرجى كتابة البريد/الهاتف وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(loginIdentifier.trim(), loginPassword.trim());
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError('يرجى ملء كافة الحقول الأساسية: الاسم، الهاتف، وكلمة المرور');
      return;
    }

    if (regRole === 'merchant' && !regStoreName.trim()) {
      setError('يرجى إدخال اسم المتجر أو المزرعة');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
        role: regRole,
        storeName: regStoreName,
        vehicleType: regRole === 'captain' ? regVehicleType : undefined,
        address: {
          governorate: regGovernorate,
          city: regCity || 'المدينة',
          street: regStreet || 'الشارع الرئيسي',
          building: regBuilding || '1',
          landmark: regLandmark
        }
      });
      setSuccessMessage('تم إنشاء حسابك بنجاح! يتم الآن تسجيل دخولك...');
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotPhone.trim()) {
      setError('يرجى كتابة رقم هاتفك المسجل لدينا');
      return;
    }

    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotPhone.trim());
      setSuccessMessage(res.message);
      setForgotPhone('');
    } catch (err: any) {
      setError(err.message || 'فشل إرسال طلب استعادة كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">بوابة الدخول والحسابات - متجر بلدي</h3>
            <p className="text-xs text-emerald-150 text-emerald-100 mt-0.5">
              {tab === 'login' && 'تسجيل الدخول الموحد للعملاء والتجار والإدارة'}
              {tab === 'register' && 'انضم إلينا كعميل أو تاجر شريك'}
              {tab === 'forgot' && 'استرجاع كلمة المرور عبر الإدارة وواتساب'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-sm font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); resetMessages(); }}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); resetMessages(); }}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-all ${
              tab === 'register'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            حساب جديد
          </button>
          <button
            type="button"
            onClick={() => { setTab('forgot'); resetMessages(); }}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-all ${
              tab === 'forgot'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            نسيت كلمة السر
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="اكتب البريد الإلكتروني أو رقم الهاتف المسجل..."
                    className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); resetMessages(); }}
                    className="text-xs text-emerald-700 hover:underline font-medium"
                  >
                    نسيت كلمة السر؟
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="اكتب كلمة المرور الخاصة بك..."
                    className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول للمتجر'}
              </button>

              <div className="pt-3 text-center border-t border-gray-150">
                <p className="text-xs text-gray-500">
                  ليس لديك حساب بعد؟{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); resetMessages(); }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    سجّل حساباً جديداً الآن
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">نوع الحساب</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('customer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      regRole === 'customer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    عميل (مشتري)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('merchant')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      regRole === 'merchant'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    تاجر (مزرعة / متجر)
                  </button>

                  {captainModeEnabled && (
                    <button
                      type="button"
                      onClick={() => setRegRole('captain')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        regRole === 'captain'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      مندوب / كابتن
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="اكتب اسمك الثلاثي..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Merchant Store Name */}
              {regRole === 'merchant' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم المتجر أو المزرعة</label>
                  <input
                    type="text"
                    required
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    placeholder="مثال: مزرعة بلدي للخضار الطازج..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Captain vehicle */}
              {regRole === 'captain' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">وسيلة التوصيل</label>
                  <select
                    value={regVehicleType}
                    onChange={(e) => setRegVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="دراجة نارية / موتوسيكل">دراجة نارية / موتوسيكل</option>
                    <option value="سيارة نقل خفيف / سوزوكي">سيارة نقل خفيف / سوزوكي</option>
                    <option value="دراجة هوائية / سكوتر">دراجة هوائية / سكوتر</option>
                  </select>
                </div>
              )}

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف (للتواصل وواتساب)</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="اختر كلمة مرور قوية..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Address details */}
              <div className="pt-2 border-t border-gray-200">
                <span className="block text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  العنوان بالتفصيل لضمان سرعة التوصيل
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-0.5">المحافظة</label>
                    <input
                      type="text"
                      value={regGovernorate}
                      onChange={(e) => setRegGovernorate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                      placeholder="القاهرة، الجيزة..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">المدينة / الحي</label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                      placeholder="المعادي، الدقي..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div className="col-span-2">
                    <label className="block text-gray-600 mb-0.5">الشارع</label>
                    <input
                      type="text"
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                      placeholder="اسم الشارع بالتفصيل..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">رقم العقار</label>
                    <input
                      type="text"
                      value={regBuilding}
                      onChange={(e) => setRegBuilding(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                      placeholder="رقم 15..."
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <label className="block text-gray-600 mb-0.5">علامة مميزة (اختياري)</label>
                  <input
                    type="text"
                    value={regLandmark}
                    onChange={(e) => setRegLandmark(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                    placeholder="بجوار مسجد... أو أمام صيدلية..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'جاري إنشاء الحساب...' : 'تأكيد التسجيل في المتجر'}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-500">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); resetMessages(); }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
                اكتب رقم هاتفك المسجل في المتجر، وسيقوم المشرف المختص بمراجعة الطلب وإرسال بيانات الدخول المعتمدة أو رابط تعيين كلمة المرور إليك مباشرة عبر <strong>رسالة واتساب فورية</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الهاتف المسجل
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="أدخل رقم هاتفك (مثال: 01012345678)..."
                    className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب الاستعادة للإدارة'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setTab('login'); resetMessages(); }}
                  className="text-xs text-gray-600 hover:text-emerald-700 underline font-medium"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
