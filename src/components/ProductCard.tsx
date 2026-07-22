import { Heart, Eye, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
}: ProductCardProps) {
  // Calculate discount percentage if old price exists
  const discount = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0;

  return (
    <div className="product-card group bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-border-light overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex flex-col h-full">
      {/* Product Image Stage */}
      <div className="relative aspect-square bg-[#f3f3f3] overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onOpenDetails(product)}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Badges Stacked on Right */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
          {product.tag && (
            <span className="bg-[#49B2A4] text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
              {product.tag}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-status-discount text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
              خصم {discount}%
            </span>
          )}
        </div>

        {/* Favorite Heart Button - Always visible and easy to tap on mobile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className={`absolute top-3 left-3 z-20 w-8.5 h-8.5 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer ${
            isFavorite ? 'bg-[#E53935] text-white' : 'bg-white/90 hover:bg-white text-primary backdrop-blur-sm'
          }`}
          title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Button for Desktop */}
        <div className="absolute inset-0 bg-black/10 items-center justify-center gap-3 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 hidden lg:flex transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transform hover:scale-110 transition-all duration-300 cursor-pointer"
            title="عرض التفاصيل"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Content info */}
      <div className="p-4 sm:p-5 text-right flex flex-col flex-1 justify-between">
        <div>
          {/* Star Rating Section */}
          <div className="flex items-center gap-1 mb-2 text-amber-400">
            <Star className="w-4 h-4 fill-current text-amber-400" />
            <span className="text-xs font-bold text-muted-gray">{product.rating || '4.5'}</span>
            <span className="text-[10px] text-gray-400 font-normal">(مراجعة ممتازة)</span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onOpenDetails(product)}
            className="font-bold text-charcoal hover:text-primary transition-colors text-sm sm:text-base line-clamp-2 min-h-[2.8em] cursor-pointer mb-2 leading-relaxed"
          >
            {product.name}
          </h3>
        </div>

        <div>
          {/* Prices */}
          <div className="flex flex-wrap items-baseline gap-2 mb-4 justify-start">
            <span className="text-primary font-bold text-base sm:text-lg">
              {product.price.toLocaleString('ar-EG')} جنيه
            </span>
            {product.oldPrice && (
              <span className="text-gray-400 text-xs sm:text-sm line-through decoration-status-discount decoration-1">
                {product.oldPrice.toLocaleString('ar-EG')} جنيه
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            إضافة للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
