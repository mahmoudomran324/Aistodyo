import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import type { Order, User, AppSettings } from '../types';
import { api } from '../services/api';

interface CaptainPortalProps {
  currentUser: User | null;
  settings: AppSettings;
  onOpenAuth: () => void;
  onBackToStore: () => void;
}

export const CaptainPortal: React.FC<CaptainPortalProps> = ({
  currentUser,
  settings,
  onOpenAuth,
  onBackToStore
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const isCaptain = currentUser?.role === 'captain';
  const isApproved = currentUser?.captainStatus === 'approved' || currentUser?.role === 'admin';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await api.getOrders();
      // Show orders that are out_for_delivery or preparing
      setOrders(allOrders.filter(o => o.status === 'out_for_delivery' || o.status === 'preparing'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCaptain) {
      fetchOrders();
    }
  }, [currentUser]);

  const handleDeliverOrder = async (orderId: string) => {
    if (!window.confirm('تأكيد تسليم الطلب واستلام المبلغ من العميل؟')) return;
    try {
      await api.updateOrderStatus(orderId, {
        status: 'delivered',
        captainId: currentUser?.id
      });
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الحالة');
    }
  };

  if (!currentUser || !isCaptain) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900">
            انضم لأسطول كباتن ومناديب "بلدي"
          </h3>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            فرص عمل وتوصيل مرنة مع مزارع وتجار بلدي. اربح مع كل طلب يتم توصيله واستلم مستحقاتك بشفافية كاملة.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              تسجيل كابتن جديد / تسجيل الدخول
            </button>
            <button
              onClick={onBackToStore}
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-600 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6" />
            <h2 className="text-2xl font-black">بوابة كابتن التوصيل</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
              {currentUser.name}
            </span>
          </div>
          <p className="text-xs md:text-sm text-amber-100 mt-1">
            وسيلة النقل: {currentUser.vehicleType || 'موتوسيكل'} • استلام وتوصيل الشحنات للعملاء
          </p>
        </div>

        <button
          onClick={onBackToStore}
          className="px-4 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition shadow-xs"
        >
          العودة للمتجر
        </button>
      </div>

      {/* Orders to Deliver */}
      <div className="space-y-4">
        <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>الطلبات الجاهزة للتوصيل والتسليم ({orders.length})</span>
        </h4>

        {orders.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
            لا توجد شحنات جاهزة للتوصيل في الوقت الحالي.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <span className="font-black text-gray-900 text-sm">طلب #{order.id}</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {order.merchantName}
                  </span>
                </div>

                <div className="space-y-1.5 text-gray-600">
                  <p className="flex items-center gap-1.5">
                    <strong className="text-gray-900">العميل:</strong> {order.customerName}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <a href={`tel:${order.customerPhone}`} className="text-emerald-800 font-bold underline">
                      {order.customerPhone}
                    </a>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      {order.customerAddress.governorate}، {order.customerAddress.city}، {order.customerAddress.street}، عقار {order.customerAddress.building}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm">
                    المبلغ المطلوب تحصيله: {order.total.toFixed(1)} {settings.currency}
                  </span>

                  <button
                    onClick={() => handleDeliverOrder(order.id)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>تم التسليم بنجاح</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
