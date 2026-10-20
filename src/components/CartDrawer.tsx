import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  CheckCircle, 
  Copy, 
  CreditCard, 
  Banknote, 
  Wallet,
  Sparkles
} from 'lucide-react';
import type { OrderItem, User, AppSettings, PaymentMethod, UserAddress } from '../types';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currentUser: User | null;
  settings: AppSettings;
  onOrderSuccess: (order: any) => void;
  onOpenAuth: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  settings,
  onOrderSuccess,
  onOpenAuth
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Address & Checkout state
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState<UserAddress>(currentUser?.address || {
    governorate: 'القاهرة',
    city: 'المعادي',
    street: '',
    building: '',
    landmark: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const deliveryFee = settings.deliveryFee || 15;
  const grandTotal = subtotal + deliveryFee;

  // Group items by merchant to check if single or multiple
  const merchantId = items.length > 0 ? items[0].productId ? (items[0] as any).merchantId || 'merchant-1' : 'merchant-1' : 'merchant-1';
  const merchantName = items.length > 0 ? (items[0] as any).merchantName || 'مزرعة بلدي' : 'مزرعة بلدي';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!items.length) {
      setError('سلة المشتريات فارغة');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }

    if (!address.street.trim() || !address.building.trim()) {
      setError('يرجى كتابة عنوان التوصيل بالتفصيل (الشارع ورقم العقار)');
      return;
    }

    if (paymentMethod !== 'cash' && !paymentReference.trim()) {
      setError(`يرجى كتابة رقم العملية أو اسم الحساب المحول منه لخدمة ${paymentMethod === 'instapay' ? 'إنستاباي' : 'فودافون كاش'}`);
      return;
    }

    try {
      setSubmitting(true);
      const newOrder = await api.createOrder({
        customerId: currentUser?.id || `guest-${Date.now()}`,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: address,
        merchantId,
        merchantName,
        items,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        notes: orderNotes.trim()
      });

      onClearCart();
      setStep('cart');
      onOrderSuccess(newOrder);
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تأكيد الطلب، يرجى المحاولة ثانية');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Top Header */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base md:text-lg">
              {step === 'cart' ? `سلة المشتريات (${items.length})` : 'إتمام الطلب وتأكيد العنوان'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button
                onClick={() => setStep('cart')}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
                رجوع للسلة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {step === 'cart' ? (
            /* ================= STEP 1: CART ITEMS ================= */
            <>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="font-bold text-gray-700 text-base">سلة التسوق فارغة</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    تصفح تشكيلة الخضار والفاكهة والأجبان والمجففات الطازجة وأضف طلباتك هنا.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    ابدأ التسوق الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 hover:border-emerald-300 transition"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs md:text-sm text-gray-900 truncate">
                          {item.name}
                        </h5>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.price} {settings.currency} / {item.unit}
                        </p>
                        <p className="text-xs font-black text-emerald-800 mt-1">
                          {item.total.toFixed(1)} {settings.currency}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.productId)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      تفريغ السلة بالكامل
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ================= STEP 2: CHECKOUT & ADDRESS & PAYMENT ================= */
            <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
              {!currentUser && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                  <span>هل تود تسجيل الدخول لحفظ عنوانك وتتبع طلباتك؟</span>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="font-bold underline text-emerald-800"
                  >
                    دخول / تسجيل
                  </button>
                </div>
              )}

              {/* Customer Contact */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  بيانات المستلم
                </h5>
                <div>
                  <label className="block text-gray-600 mb-1">الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اسم مستلم الطلب..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">رقم الهاتف للتواصل وتسليم الطلب</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Address Form */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  عنوان التوصيل بالتفصيل
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 mb-0.5">المحافظة</label>
                    <input
                      type="text"
                      required
                      value={address.governorate}
                      onChange={(e) => setAddress({ ...address, governorate: e.target.value })}
                      placeholder="القاهرة..."
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-gray-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">المدينة / الحي</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="المعادي، الدقي..."
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-gray-300 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-gray-600 mb-0.5">اسم الشارع</label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="شارع النصر، متفرع من..."
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-gray-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">رقم العقار / الدور</label>
                    <input
                      type="text"
                      required
                      value={address.building}
                      onChange={(e) => setAddress({ ...address, building: e.target.value })}
                      placeholder="عمارة 15، شقة 4"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-gray-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-0.5">علامة مميزة (اختياري)</label>
                  <input
                    type="text"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="أمام سوبر ماركت، بجوار المسجد..."
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-gray-300 text-xs"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  طريقة الدفع (تسجيل فوري في قاعدة البيانات)
                </h5>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500 font-bold'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-700" />
                    <span>كاش عند الاستلام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instapay')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition ${
                      paymentMethod === 'instapay'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500 font-bold'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-700" />
                    <span>إنستاباي InstaPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vodafone_cash')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition ${
                      paymentMethod === 'vodafone_cash'
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500 font-bold'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-red-700" />
                    <span>فودافون كاش</span>
                  </button>
                </div>

                {/* InstaPay Info Details */}
                {paymentMethod === 'instapay' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-purple-950">
                    <p className="font-bold text-xs flex items-center justify-between">
                      <span>عنوان إنستاباي للدفع:</span>
                      <span className="font-mono text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                        {settings.instapayHandle || 'baladi@instapay'}
                      </span>
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-purple-800">
                        رقم هاتف إنستاباي: <strong>{settings.instapayPhone || '01012345678'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.instapayPhone || '01012345678', 'phone')}
                        className="text-[11px] px-2 py-0.5 bg-purple-200 hover:bg-purple-300 rounded font-semibold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedText === 'phone' ? 'تم النسخ!' : 'نسخ الرقم'}
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        اسم حسابك على إنستاباي أو رقم العملية:
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="اكتب اسم الحساب المحول منه أو رقم المعاملة..."
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-purple-300 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Vodafone Cash Info Details */}
                {paymentMethod === 'vodafone_cash' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-red-950">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-900">
                        محفظة فودافون كاش: <strong>{settings.vodafoneCashNumber || '01098765432'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings.vodafoneCashNumber || '01098765432', 'vodafone')}
                        className="text-[11px] px-2 py-0.5 bg-red-200 hover:bg-red-300 rounded font-semibold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedText === 'vodafone' ? 'تم النسخ!' : 'نسخ الرقم'}
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-red-900 mb-1">
                        رقم المحفظة التي قمت بالتحويل منها:
                      </label>
                      <input
                        type="tel"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="أدخل رقم المحفظة المحول منها للتأكيد..."
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-red-300 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-gray-600 mb-1">ملاحظات إضافية للتاجر أو المندوب (اختياري)</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="مثال: يرجي اختيار الخضار صلب، رن الجرس مرتين..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            </form>
          )}
        </div>

        {/* Bottom Total & Actions */}
        {items.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>إجمالي الأصناف:</span>
                <span className="font-bold">{subtotal.toFixed(1)} {settings.currency}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>رسوم التوصيل:</span>
                <span className="font-bold">{deliveryFee} {settings.currency}</span>
              </div>
              <div className="flex justify-between text-base font-black text-emerald-950 pt-1.5 border-t border-gray-200">
                <span>المجموع النهائي:</span>
                <span className="text-emerald-800">{grandTotal.toFixed(1)} {settings.currency}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>متابعة إتمام الطلب</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                form="checkout-form"
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>جاري تسجيل الطلب وإرسال التنبيه...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>تأكيد الطلب الآن</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
