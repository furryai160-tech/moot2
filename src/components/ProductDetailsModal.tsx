import { useState } from 'react';
import { X, ShoppingCart, Plus, Minus, Star, CheckCircle, Shield, Share2, Link, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedSize?: string) => void;
  initialSize?: string;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  initialSize,
}: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(() => {
    if (initialSize && product.sizes && product.sizes.some(s => s.size === initialSize)) {
      return initialSize;
    }
    return product.sizes && product.sizes.length > 0 ? product.sizes[0].size : undefined;
  });

  const increment = () => setQuantity(prev => prev + 1);
  const decrement = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const activePrice = selectedSize && product.sizes
    ? (product.sizes.find(s => s.size === selectedSize)?.price ?? product.price)
    : product.price;

  const activeOldPrice = selectedSize && product.sizes
    ? (product.sizes.find(s => s.size === selectedSize)?.oldPrice ?? product.oldPrice)
    : product.oldPrice;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedSize);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-charcoal text-right">تفاصيل المنتج الفاخر</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
            
            {/* Right Side: Product Image Display */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-border-light shadow-inner">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {product.tag && (
                  <span className="absolute top-4 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full font-bold shadow">
                    {product.tag}
                  </span>
                )}
              </div>
              
              {/* Core reassurance badges */}
              <div className="grid grid-cols-2 gap-3 bg-[#fbfbfb] p-3 rounded-xl border border-border-light">
                <div className="flex items-center gap-2 justify-end text-xs text-muted-gray">
                  <span>صنع في مصر</span>
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 justify-end text-xs text-muted-gray">
                  <span>ضمان ١٠ سنوات حقيقي</span>
                  <Shield className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Left Side: Product Specifications & Add action */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-2 text-amber-400 justify-start">
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <span className="text-sm font-bold text-[#1a1c1c]">{product.rating || '4.5'}</span>
                  <span className="text-xs text-muted-gray">(شراء مؤكد من قبل عملائنا)</span>
                </div>

                {/* Name */}
                <h1 className="text-xl md:text-2xl font-bold text-charcoal mb-3 leading-snug">
                  {product.name}
                </h1>

                {/* Price block */}
                <div className="flex items-baseline gap-3 mb-5 justify-start">
                  <span className="text-2xl font-extrabold text-primary">
                    {activePrice.toLocaleString('ar-EG')} جنيه
                  </span>
                  {activeOldPrice && (
                    <span className="text-gray-400 text-sm line-through decoration-status-discount">
                      {activeOldPrice.toLocaleString('ar-EG')} جنيه
                    </span>
                  )}
                </div>

                {/* Sizes Selection Grid */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <label className="text-xs font-black text-charcoal block mb-2">المقاسات المتاحة لهذا المنتج:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.sizes.map((szObj) => {
                        const isSel = selectedSize === szObj.size;
                        return (
                          <button
                            key={szObj.size}
                            type="button"
                            onClick={() => setSelectedSize(szObj.size)}
                            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              isSel 
                                ? 'bg-primary border-primary text-white shadow-sm' 
                                : 'bg-white border-gray-200 text-charcoal hover:bg-gray-50'
                            }`}
                          >
                            <div>{szObj.size}</div>
                            <div className={`text-[10px] mt-0.5 ${isSel ? 'text-white/80' : 'text-primary'}`}>
                              {szObj.price.toLocaleString('ar-EG')} ج.م
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-[#5f5e5e] leading-relaxed text-sm sm:text-base mb-6">
                  {product.description}
                </p>

                {/* Detailed technical specs table */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="border border-border-light rounded-xl overflow-hidden mb-6 bg-[#fbfbfb]">
                    <div className="bg-gray-100 px-4 py-2 font-bold text-xs text-charcoal border-b border-border-light">
                      المواصفات الفنية والقياسات
                    </div>
                    <div className="divide-y divide-border-light text-xs sm:text-sm">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 p-3">
                          <span className="font-bold text-charcoal col-span-1 border-l border-border-light pl-2">
                            {key}
                          </span>
                          <span className="text-muted-gray col-span-2 pr-2">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Share Section */}
                <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-4.5 mb-6 text-right space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-gray font-light">شارك الراحة الفاخرة لموربيدو مع من تحب</span>
                    <h4 className="font-extrabold text-charcoal text-xs sm:text-sm flex items-center gap-1.5 justify-end">
                      <Share2 className="w-4 h-4 text-primary shrink-0" />
                      <span>مشاركة هذا المنتج:</span>
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="bg-gray-200/80 hover:bg-gray-300/80 text-charcoal px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="نسخ رابط المنتج"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-extrabold">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4 text-charcoal" />
                          <span>نسخ الرابط</span>
                        </>
                      )}
                    </button>

                    {/* Facebook Button */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                      </svg>
                      <span>فيسبوك</span>
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `يا هلا! شوف منتج موربيدو الرائع ده: *${product.name}* بسعر ملوكي ${activePrice.toLocaleString('ar-EG')} ج.م فقط! 🛏️✨\nرابط المتجر: ${window.location.href}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Interaction Panel */}
              <div className="border-t border-border-light pt-6 mt-6">
                {addedSuccess ? (
                  <div className="bg-primary/10 border border-primary text-primary p-3 rounded-xl text-center font-bold animate-pulse text-sm">
                    تمت إضافة {quantity} من "{product.name}" إلى السلة بنجاح!
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    
                    {/* Quantity modifier */}
                    <div className="flex items-center justify-between border border-border-light rounded-lg bg-gray-50 p-2 sm:w-1/3">
                      <button 
                        onClick={decrement}
                        className="p-1.5 rounded bg-white hover:bg-gray-200 border border-border-light transition-all active:scale-90 cursor-pointer"
                        title="تقليل الكمية"
                      >
                        <Minus className="w-4 h-4 text-charcoal" />
                      </button>
                      <span className="font-extrabold text-charcoal text-base">
                        {quantity}
                      </span>
                      <button 
                        onClick={increment}
                        className="p-1.5 rounded bg-white hover:bg-gray-200 border border-border-light transition-all active:scale-90 cursor-pointer"
                        title="زيادة الكمية"
                      >
                        <Plus className="w-4 h-4 text-charcoal" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAdd}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white py-3.5 px-6 rounded-lg font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      أضف الكمية ({quantity}) للسلة الآن
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
