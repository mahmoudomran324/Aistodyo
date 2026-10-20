import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Calendar, 
  Store, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import type { Order, FinancialTransaction, User, AppSettings } from '../types';
import { api } from '../services/api';

interface CustomerFinancialsProps {
  currentUser: User;
  settings: AppSettings;
  onBackToStore: () => void;
}

export const CustomerFinancials: React.FC<CustomerFinancialsProps> = ({
  currentUser,
  settings,
  onBackToStore
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'ledger'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedTransactions] = await Promise.all([
        api.getOrders({ customerId: currentUser.id }),
        api.getTransactions(currentUser.id)
      ]);
      setOrders(fetchedOrders);
      setTransactions(fetchedTransactions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for order status updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            جديد (بانتظار موافقة التاجر)
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            جاري التجهيز والفرز
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-900 flex items-center gap-1 animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            خرج للتوصيل مع المندوب
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            تم التسليم بنجاح
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
            ملغي
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black">حساب العميل والصفحة المالية</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
              {currentUser.name}
            </span>
          </div>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">
            متابعة حالة طلباتك لحظة بلحظة وسجل المعاملات والمدفوعات الموثقة في قاعدة البيانات
          </p>
        </div>

        <button
          onClick={onBackToStore}
          className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition shadow-xs"
        >
          العودة للمتجر والشراء
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>طلباتي ومتابعة الشحنات ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>سجل المدفوعات والمعاملات المالية ({transactions.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">جاري تحديث البيانات والطلبات...</p>
        </div>
      ) : activeTab === 'orders' ? (
        /* ================= ORDERS LIST ================= */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-700 text-base">لا توجد طلبات سابقة</h4>
              <p className="text-xs text-gray-400 mt-1">
                ابدأ بتصفح المتجر واختيار الخضار والفاكهة والألبان الطازجة الآن.
              </p>
              <button
                onClick={onBackToStore}
                className="mt-4 px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-150">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-emerald-950">
                      طلب #{order.id}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleString('ar-EG')}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {order.merchantName}
                    </span>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* SPECIAL NOTIFICATION BANNER WHEN OUT FOR DELIVERY */}
                {order.status === 'out_for_delivery' && order.deliveryRep && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl shadow-xs animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
                        <Truck className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm md:text-base text-purple-950">
                            🚚 المندوب اتحرك في الطريق إليك الآن!
                          </span>
                        </div>
                        <p className="text-xs text-purple-900 mt-1">
                          اسم المندوب: <strong>{order.deliveryRep.name}</strong> • رقم الهاتف: <strong>{order.deliveryRep.phone}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={`tel:${order.deliveryRep.phone}`}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        اتصال هاتفي
                      </a>
                      <a
                        href={`https://wa.me/${order.deliveryRep.phone.replace(/^0/, '20')}?text=${encodeURIComponent(`مرحباً كابتن ${order.deliveryRep.name}، بخصوص طلب بلدي رقم ${order.id}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        واتساب
                      </a>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} × {item.price} {settings.currency} ({item.unit})
                        </p>
                      </div>
                      <span className="font-black text-emerald-800 text-xs">
                        {item.total.toFixed(1)} {settings.currency}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer & Price */}
                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2 border-t border-gray-100">
                  <div>
                    <span>طريقة الدفع: </span>
                    <strong className="text-gray-900">
                      {order.paymentMethod === 'cash' ? 'كاش عند الاستلام' :
                       order.paymentMethod === 'instapay' ? 'إنستاباي InstaPay' : 'فودافون كاش'}
                    </strong>
                    {order.paymentReference && (
                      <span className="mr-2 text-gray-500 font-mono">({order.paymentReference})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      التوصيل: {order.deliveryFee} {settings.currency}
                    </span>
                    <span className="text-sm font-black text-emerald-950">
                      الإجمالي: {order.total.toFixed(1)} {settings.currency}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ================= FINANCIAL LEDGER ================= */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h4 className="font-bold text-sm text-gray-900">
              سجل المعاملات والمدفوعات الموثقة في قاعدة البيانات
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              كل عملية شراء أو سداد تسجل تلقائياً بقيد مالي رسمي لضمان الشفافية.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              لا توجد قيود مالية مسجلة بعد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 text-gray-700 border-b font-bold">
                  <tr>
                    <th className="py-3 px-4">رقم المعاملة</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">رقم الطلب</th>
                    <th className="py-3 px-4">وسيلة الدفع</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-900">{tx.id}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {tx.orderId || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-medium">
                          {tx.paymentMethod === 'cash' ? 'كاش' :
                           tx.paymentMethod === 'instapay' ? 'إنستاباي' :
                           tx.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-800">
                        {tx.amount.toFixed(1)} {settings.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          معتمدة ومسجلة
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px] max-w-xs truncate">
                        {tx.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
