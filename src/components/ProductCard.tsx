import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, Check, Store, Sparkles } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  currency: string;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectMerchant?: (merchantId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onAddToCart,
  onSelectMerchant
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 800);
  };

  const increment = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between">
      {/* Top Image area */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2.5 py-1 text-[11px] font-bold bg-white/95 backdrop-blur-md text-emerald-900 rounded-full shadow-xs border border-emerald-100">
            {product.category}
          </span>
        </div>

        {/* Stock status */}
        <div className="absolute top-2.5 left-2.5">
          {product.stock > 0 ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600/90 text-white rounded-full backdrop-blur-xs">
              متوفر ({product.stock} {product.unit})
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-600/90 text-white rounded-full backdrop-blur-xs">
              نفدت الكمية
            </span>
          )}
        </div>
      </div>

      {/* Details area */}
      <div className="p-3.5 md:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Merchant / Farm tag */}
          <button
            type="button"
            onClick={() => onSelectMerchant && onSelectMerchant(product.merchantId)}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline mb-1 truncate max-w-full"
          >
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate">{product.merchantName}</span>
          </button>

          {/* Product Title */}
          <h3 className="font-bold text-sm md:text-base text-gray-900 leading-snug line-clamp-1 group-hover:text-emerald-800 transition">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Quantity & Action */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg md:text-xl font-black text-emerald-900">{product.price}</span>
              <span className="text-xs font-bold text-emerald-700">{currency}</span>
              <span className="text-[11px] text-gray-400 font-medium">/ {product.unit}</span>
            </div>

            {/* Subtotal preview */}
            <span className="text-[11px] font-bold text-gray-500">
              المجموع: {(product.price * quantity).toFixed(1)} {currency}
            </span>
          </div>

          {/* Quantity Controls & Add to Cart button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={decrement}
                disabled={quantity <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 disabled:opacity-30 transition"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center font-bold text-xs text-gray-800">
                {quantity}
              </span>
              <button
                type="button"
                onClick={increment}
                disabled={quantity >= product.stock}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 disabled:opacity-30 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                addedAnimation
                  ? 'bg-emerald-600 text-white scale-95'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-white hover:shadow-md'
              } disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تمت الإضافة!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>أضف للسلة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
