import React from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Search, 
  Store, 
  Truck, 
  Receipt, 
  Sliders, 
  BellRing
} from 'lucide-react';
import type { User, AppSettings } from '../types';

interface HeaderProps {
  currentUser: User | null;
  settings: AppSettings;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTerms: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeView: 'store' | 'merchant' | 'admin' | 'customer' | 'captain';
  setActiveView: (view: 'store' | 'merchant' | 'admin' | 'customer' | 'captain') => void;
  hasUnpreparedOrders?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onOpenTerms,
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
  hasUnpreparedOrders
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm transition-all">
      {/* Top micro bar for quality & quick notices */}
      <div className="bg-emerald-800 text-emerald-50 text-[11px] md:text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>طازة من المزرعة لباب بيتك • فرز أول معتمد • استرجاع مجاني 100%</span>
          </div>
          <button
            onClick={onOpenTerms}
            className="flex items-center gap-1 hover:text-white underline font-semibold transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            ميثاق الجودة وسياسة الاسترجاع
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 md:gap-6">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveView('store')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
        >
          {settings.logo ? (
            <img 
              src={settings.logo} 
              alt={settings.storeName} 
              className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-xl border border-emerald-200 shadow-xs" 
            />
          ) : (
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-700/20 group-hover:scale-105 transition">
              ب
            </div>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-black text-emerald-950 tracking-tight flex items-center gap-1.5">
              <span>{settings.storeName || 'بلدي - متجر أحلى بقالة'}</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                طبيعي 100%
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 hidden sm:block">سوق الخضار والفاكهة والأجبان والمجففات البلدية</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن خضار، فاكهة، جبن قريش، بقوليات، أعشاب..."
              className="w-full pr-10 pl-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Captain Mode link if enabled */}
          {settings.captainModeEnabled && (
            <button
              onClick={() => setActiveView('captain')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                activeView === 'captain'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              كابتن التوصيل
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition shadow-xs"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden lg:flex flex-col text-right leading-tight">
              <span className="text-[10px] text-gray-500 font-medium">سلة التسوق</span>
              <span className="text-xs font-extrabold text-emerald-950">{cartTotal} {settings.currency}</span>
            </div>
          </button>

          {/* User Account / Navigation */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Role-specific Dashboard shortcut */}
              {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                <button
                  onClick={() => setActiveView('admin')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeView === 'admin'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="لوحة الإدارة والمشرفين"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">لوحة التحكم</span>
                </button>
              )}

              {currentUser.role === 'merchant' && (
                <button
                  onClick={() => setActiveView('merchant')}
                  className={`relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    hasUnpreparedOrders
                      ? 'bg-red-600 text-white animate-pulse shadow-md ring-2 ring-red-400'
                      : activeView === 'merchant'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title="لوحة تحكم المتجر والطلبات"
                >
                  {hasUnpreparedOrders ? (
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                  ) : (
                    <Store className="w-3.5 h-3.5" />
                  )}
                  <span>لوحة متجري</span>
                  {hasUnpreparedOrders && (
                    <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
                  )}
                </button>
              )}

              {currentUser.role === 'customer' && (
                <button
                  onClick={() => setActiveView('customer')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeView === 'customer'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">طلباتي والماليات</span>
                </button>
              )}

              {currentUser.role === 'captain' && (
                <button
                  onClick={() => setActiveView('captain')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeView === 'captain'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>لوحة التوصيل</span>
                </button>
              )}

              {/* User Dropdown / Direct Info */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 pl-2 pr-2 py-1 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-800 leading-none truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {currentUser.role === 'admin' ? 'مدير عام' :
                     currentUser.role === 'supervisor' ? 'مشرف' :
                     currentUser.role === 'merchant' ? 'تاجر' :
                     currentUser.role === 'captain' ? 'كابتن' : 'عميل'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 text-gray-400 hover:text-red-600 transition"
                  title="تسجيل الخروج من الحساب"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md"
            >
              <UserIcon className="w-4 h-4" />
              <span>دخول / تسجيل</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="px-4 pb-2.5 md:hidden">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن خضار، فاكهة، جبن قريش، مجففات..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
