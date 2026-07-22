import { X, Trash2, ShoppingBag, Plus, Minus, ShieldCheck, MapPin } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  onRemoveItem: (productId: string, selectedSize?: string) => void;
  onStartCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onStartCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  // Free shipping threshold: 2000 EGP
  const shippingThreshold = 2000;
  const isFreeShipping = subtotal >= shippingThreshold;
  const shippingCost = subtotal === 0 ? 0 : (isFreeShipping ? 0 : 50);
  const total = subtotal + shippingCost;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Semi-transparent backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border-light flex justify-between items-center bg-gray-50 flex-shrink-0 text-right">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-charcoal">سلة التسوق الخاصة بك</h2>
            <span className="bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-full">
              {cartItems.length} منتجات
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic Shipping Counter */}
        {subtotal > 0 && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 text-right text-xs sm:text-sm text-primary font-medium">
            {isFreeShipping ? (
              <div className="flex items-center gap-2 justify-end">
                <span>تهانينا! لقد حصلت على <strong>شحن مجاني</strong> لطلبك!</span>
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              </div>
            ) : (
              <div className="space-y-1">
                <p>أضف بقيمة <strong>{(shippingThreshold - subtotal).toLocaleString('ar-EG')} جنيه</strong> إضافية للحصول على شحن مجاني!</p>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drawer Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-right">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-muted-gray">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-charcoal">السلة فارغة حالياً</h3>
              <p className="text-muted-gray text-xs sm:text-sm max-w-xs">
                تصفح تشكيلتنا الفاخرة من المخدات الطبية والفندقية واللحف لتبدأ التسوق وتجهيز بيت العمر.
              </p>
              <button 
                onClick={onClose}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all duration-300 cursor-pointer"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const uniqueKey = item.product.id + (item.selectedSize ? `-${item.selectedSize}` : '');
                return (
                  <div 
                    key={uniqueKey}
                    className="flex gap-3 border border-border-light rounded-xl p-3 bg-white shadow-sm hover:shadow transition-all duration-200 align-start"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg overflow-hidden border border-border-light flex-shrink-0">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <button 
                            onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="حذف من السلة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="text-right flex-1 pr-2">
                            <h4 className="font-bold text-charcoal text-xs sm:text-sm line-clamp-1">
                              {item.product.name}
                            </h4>
                            {item.selectedSize && (
                              <span className="inline-block bg-[#004D95]/10 text-[#004D95] text-[10px] px-1.5 py-0.5 rounded font-black mt-1">
                                مقاس: {item.selectedSize}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-primary font-bold text-xs sm:text-sm mt-1">
                          {item.product.price.toLocaleString('ar-EG')} جنيه
                        </p>
                      </div>

                      {/* Quantity modifier */}
                      <div className="flex justify-between items-center mt-2 bg-gray-50 border border-border-light rounded px-2 py-1 max-w-[100px]">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedSize)}
                          className="p-0.5 rounded hover:bg-gray-200 text-muted-gray cursor-pointer"
                          title="تقليل"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-charcoal text-xs sm:text-sm">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                          className="p-0.5 rounded hover:bg-gray-200 text-muted-gray cursor-pointer"
                          title="زيادة"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer summary */}
        {cartItems.length > 0 && (
          <div className="border-t border-border-light p-4 sm:p-6 bg-gray-50 flex-shrink-0 text-right space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-muted-gray">
                <span>{(subtotal).toLocaleString('ar-EG')} جنيه</span>
                <span>المجموع الفرعي:</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-muted-gray">
                <span>
                  {shippingCost === 0 ? 'شحن مجاني' : `${shippingCost.toLocaleString('ar-EG')} جنيه`}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  مصاريف الشحن:
                </span>
              </div>
              <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between text-base font-extrabold text-charcoal">
                <span className="text-primary">{(total).toLocaleString('ar-EG')} جنيه</span>
                <span>الإجمالي الكلي:</span>
              </div>
            </div>

            <button
              onClick={onStartCheckout}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              إتمام طلب الشراء الآن
            </button>
            <p className="text-[11px] text-center text-muted-gray">
              الدفع عند الاستلام كاش أو فيزا بعد معاينة وجودة المنتجات الفاخرة!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
