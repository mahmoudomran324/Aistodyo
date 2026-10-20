import React from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface QualityTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  termsText?: string;
  returnPolicyText?: string;
}

export const QualityTermsModal: React.FC<QualityTermsModalProps> = ({
  isOpen,
  onClose,
  termsText,
  returnPolicyText
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden transform transition-all">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-wide">ميثاق الجودة وسياسة الاسترجاع الفوري</h3>
              <p className="text-xs text-emerald-100 mt-0.5">ضمان طزاجة 100% وحماية كاملة لحقوق المستهلك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-gray-700 max-h-[75vh] overflow-y-auto leading-relaxed">
          {/* Main Warning Box */}
          <div className="p-4 bg-amber-50 border-r-4 border-amber-500 rounded-xl flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm md:text-base">
                تحذير حاسم من البضاعة التالفة أو المخالفة
              </h4>
              <p className="text-xs md:text-sm text-amber-800 mt-1">
                تلتزم منصة "بلدي" بأعلى معايير الفرز الأول. يُحظر تماماً على أي تاجر توريد أي خضار أو فاكهة أو ألبان أو مجففات بها عيوب أو تالفة.
                ويتحمل التاجر المخالف كامل المسؤولية القانونية والمالية مع الإيقاف المؤقت أو النهائي لمتجره.
              </p>
            </div>
          </div>

          {/* Policy Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-700 shrink-0 mt-1" />
              <div>
                <h5 className="font-bold text-emerald-900 text-sm">استرجاع فوري مجاني 100%</h5>
                <p className="text-xs text-emerald-800 mt-1">
                  يحق للعميل فحص المنتجات عند الاستلام، وإرجاع أو استبدال أي صنف غير مطابق دون دفع أي مصاريف شحن أو أتعاب إضافية.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-1" />
              <div>
                <h5 className="font-bold text-blue-900 text-sm">رقابة صارمة للإدارة والمشرفين</h5>
                <p className="text-xs text-blue-800 mt-1">
                  يقوم فريق المشرفين بمراجعة الجودة بصفة دورية وإخفاء أي منتجات لا تطابق معايير الفرز الأول المعتمدة فوراً.
                </p>
              </div>
            </div>
          </div>

          {/* Text Details */}
          <div className="space-y-3 pt-2 text-sm text-gray-600">
            <h4 className="font-bold text-gray-900 text-base border-b pb-2">نص الشروط والأحكام الرسمية:</h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs md:text-sm whitespace-pre-line leading-relaxed">
              {termsText || 'يلتزم المتجر بتسليم الطلبات وفق المواصفات المذكورة، وفي حال وجود أي تلف يتحمل التاجر تكلفة الاسترجاع بالكامل.'}
            </div>

            {returnPolicyText && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs md:text-sm whitespace-pre-line leading-relaxed">
                <span className="font-bold block text-gray-900 mb-1">تفاصيل سياسة الاسترجاع:</span>
                {returnPolicyText}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">متجر بلدي - معاً نحو غذاء طازج ونقي</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition shadow-md hover:shadow-lg"
          >
            موافق وأفهم الشروط
          </button>
        </div>
      </div>
    </div>
  );
};
