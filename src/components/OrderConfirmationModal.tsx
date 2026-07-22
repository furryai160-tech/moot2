import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Truck, MapPin, Receipt, Phone, AlertCircle, CreditCard, ShieldCheck, Star } from 'lucide-react';
import { CartItem, Order, Coupon } from '../types';
import { GOVERNORATES } from '../data';
import { saveOrderToDatabase } from '../lib/supabase';
import { sendTelegramOrderNotification } from '../lib/telegram';

interface OrderConfirmationModalProps {
  cartItems: CartItem[];
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onClearCart: () => void;
  onAddReview?: (review: { name: string; location: string; productName: string; rating: number; comment: string }) => void;
  currentUser?: any;
  coupons?: Coupon[];
}

export default function OrderConfirmationModal({
  cartItems,
  onClose,
  onOrderSuccess,
  onClearCart,
  onAddReview,
  currentUser,
  coupons = [],
}: OrderConfirmationModalProps) {
  // Review / Rating States
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [selectedProductReview, setSelectedProductReview] = useState<string>('');
  const [reviewSubmittedSuccessfully, setReviewSubmittedSuccessfully] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    city: 'القاهرة',
    address: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || currentUser.name || '',
        phone: prev.phone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'fawaiterk'>('cod');
  const [isRedirectingToFawaterk, setIsRedirectingToFawaterk] = useState(false);

  const [error, setError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Validate applied coupon if subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      const minVal = appliedCoupon.minOrderValue || 0;
      if (subtotal < minVal) {
        setAppliedCoupon(null);
        setCouponSuccess(null);
        setCouponError(`هذا الكوبون يتطلب الحد الأدنى لقيمة المشتريات ${minVal} ج.م`);
      }
    }
  }, [subtotal, appliedCoupon]);

  const handleApplyCoupon = () => {
    setCouponError(null);
    setCouponSuccess(null);
    
    if (!couponCode.trim()) {
      setCouponError('يرجى إدخال رمز الكوبون أولاً');
      return;
    }

    const found = coupons?.find(c => c.code.trim().toUpperCase() === couponCode.trim().toUpperCase());
    
    if (!found) {
      setCouponError('هذا الكوبون غير موجود أو غير صالح');
      return;
    }

    if (!found.isActive) {
      setCouponError('هذا الكوبون انتهت صلاحيته أو غير نشط حالياً');
      return;
    }

    const minVal = found.minOrderValue || 0;
    if (subtotal < minVal) {
      setCouponError(`هذا الكوبون يتطلب الحد الأدنى لقيمة المشتريات ${minVal} ج.م`);
      return;
    }

    setAppliedCoupon(found);
    const discAmount = found.type === 'percentage' 
      ? Math.round(subtotal * (found.value / 100)) 
      : found.value;
    
    setCouponSuccess(`تم تطبيق الكوبون بنجاح! خصم بقيمة ${discAmount.toLocaleString('ar-EG')} ج.م`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? Math.round(subtotal * (appliedCoupon.value / 100)) 
        : appliedCoupon.value)
    : 0;

  const isFreeShipping = subtotal >= 2000;
  const shippingCost = isFreeShipping ? 0 : 50;
  const total = Math.max(0, subtotal - discount + shippingCost);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleFinishOrder = async (orderId: string, method: 'cod' | 'fawaiterk', isPaid: boolean) => {
    const newOrder: Order = {
      id: orderId,
      customerName: formData.customerName,
      phone: formData.phone,
      city: formData.city,
      address: formData.address,
      items: [...cartItems],
      total: total,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('ar-EG'),
    };

    // Save to Supabase (utilizes localStorage fallback gracefully if keys aren't active yet)
    await saveOrderToDatabase(newOrder, method, isPaid ? 'paid' : 'pending');

    // Send Telegram Notification if configured
    try {
      await sendTelegramOrderNotification(newOrder, method, isPaid);
    } catch (err) {
      console.error('Failed to trigger Telegram notification:', err);
    }

    setSubmittedOrder(newOrder);
    if (newOrder.items && newOrder.items.length > 0) {
      setSelectedProductReview(newOrder.items[0].product.name);
    } else {
      setSelectedProductReview('موقع موربيدو والخدمة بشكل عام');
    }
    onOrderSuccess(newOrder);
    onClearCart();
    setError('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddReview && submittedOrder) {
      onAddReview({
        name: submittedOrder.customerName,
        location: submittedOrder.city,
        productName: selectedProductReview || 'موقع موربيدو والخدمة بشكل عام',
        rating: userRating,
        comment: userComment || 'تقييم ممتاز وخامة رائعة!',
      });
      setReviewSubmittedSuccessfully(true);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.address) {
      setError('يرجى ملء جميع الحقول الإلزامية لتأكيد الطلب.');
      return;
    }

    // Phone validation
    const cleanPhone = formData.phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setError('يرجى إدخال رقم موبايل مصري صحيح ومكون من ١١ رقم (مثال: 01012345678).');
      return;
    }

    const orderId = 'FBO-' + Math.floor(100000 + Math.random() * 900000);

    if (paymentMethod === 'fawaiterk') {
      // Call real Fawaterk API to create invoice and redirect
      setIsRedirectingToFawaterk(true);
      setError('');
      try {
        const response = await fetch('/api/fawaterk/create-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customerName: formData.customerName,
            phone: formData.phone,
            address: formData.address,
            email: currentUser?.email || null,
            total,
            cartItems: cartItems.map(item => ({
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.payment_url) {
          throw new Error(data.error || 'فشل الاتصال ببوابة الدفع');
        }
        // Save order in pending state before redirecting
        await handleFinishOrder(orderId, 'fawaiterk', false);
        // Redirect to Fawaterk hosted payment page
        window.location.href = data.payment_url;
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء الاتصال ببوابة الدفع. حاول مجدداً.');
        setIsRedirectingToFawaterk(false);
      }
    } else {
      handleFinishOrder(orderId, 'cod', false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-light flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-lg font-extrabold text-charcoal">
              {submittedOrder ? 'فاتورة الشراء المعتمدة' : 'إتمام الشراء وشحن المنتجات'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          {submittedOrder ? (
            // Order Receipt and Success State
            <div className="space-y-6 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-charcoal">تهانينا! تم تأكيد طلبك بنجاح</h3>
                <p className="text-muted-gray text-xs sm:text-sm mt-2 leading-relaxed max-w-md mx-auto">
                  نشكرك على تسوقك من <strong>موربيدو</strong>. تم تسجيل طلبك برقم (<strong>{submittedOrder.id}</strong>) وسيقوم ممثل خدمة العملاء بالاتصال بك هاتفياً لتأكيد الشحن فوراً.
                </p>
              </div>

              {/* Invoice Layout */}
              <div className="border border-border-light rounded-xl overflow-hidden bg-[#fbfbfb] max-w-md mx-auto text-right text-xs sm:text-sm">
                <div className="bg-primary/5 p-3.5 border-b border-border-light flex justify-between items-center font-bold">
                  <span className="text-primary">{submittedOrder.id}</span>
                  <span className="text-charcoal">رقم الطلب والفاتورة</span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="font-bold text-charcoal">{submittedOrder.customerName}</span>
                    <span className="text-muted-gray">الاسم:</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-charcoal">{submittedOrder.phone}</span>
                    <span className="text-muted-gray">رقم الموبايل:</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-charcoal">{submittedOrder.city} - {submittedOrder.address}</span>
                    <span className="text-muted-gray">عنوان الشحن:</span>
                  </div>
                  
                  {/* Bought items list inside invoice */}
                  <div className="pt-2">
                    <span className="text-muted-gray block mb-2 font-bold">المنتجات المطلوبة:</span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto bg-white p-2 border border-gray-100 rounded-lg">
                      {submittedOrder.items.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center text-xs">
                          <span className="text-primary font-bold">
                            {(item.product.price * item.quantity).toLocaleString('ar-EG')} جنيه
                          </span>
                          <span className="text-charcoal line-clamp-1 max-w-[200px]">
                            {item.product.name} ({item.quantity}×)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-dashed border-gray-300 flex justify-between items-center text-base font-extrabold text-charcoal">
                    <span className="text-primary">{submittedOrder.total.toLocaleString('ar-EG')} جنيه</span>
                    <span>الإجمالي الكلي المستحق:</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center text-xs sm:text-sm text-primary font-medium bg-primary/10 py-3 px-4 rounded-xl max-w-md mx-auto">
                <Truck className="w-5 h-5 shrink-0" />
                <span>الشحن متوقع خلال ٤٨ ساعة عمل إلى محافظة {submittedOrder.city}!</span>
              </div>

              {/* Optional rating and comment form */}
              <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-5 max-w-md mx-auto text-right space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-2 justify-end">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                  <h4 className="font-extrabold text-charcoal text-sm sm:text-base">قيم تجربتك أو منتجاتك (اختياري)</h4>
                </div>

                {reviewSubmittedSuccessfully ? (
                  <div className="bg-green-50 text-green-700 text-xs sm:text-sm p-4 rounded-xl text-center font-bold">
                    🎉 شكراً جزيلاً لمشاركتنا رأيك القيم! تم تسجيل تقييمك بنجاح وسيكون ظاهراً للجميع في صفحة المتجر الرئيسية.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <p className="text-[11px] text-muted-gray leading-relaxed font-light">
                      يسعدنا جداً معرفة رأيك في الخامات والخدمة لمساعدتنا في تقديم الأفضل دائماً. إذا كنت لا ترغب، يمكنك ببساطة تخطي ذلك والعودة للمتجر.
                    </p>

                    {/* Product Selector to rate */}
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-bold text-charcoal block mb-1">اختر المنتج الذي تود تقييمه:</label>
                      <select
                        value={selectedProductReview}
                        onChange={(e) => setSelectedProductReview(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-charcoal focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        {submittedOrder.items.map((item) => (
                          <option key={item.product.id} value={item.product.name}>
                            {item.product.name}
                          </option>
                        ))}
                        <option value="موقع موربيدو والخدمة بشكل عام">موقع موربيدو والخدمة بشكل عام</option>
                      </select>
                    </div>

                    {/* Star Rating Select buttons */}
                    <div className="flex justify-center items-center gap-1 py-1" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="p-1 hover:scale-125 transition-transform duration-150 cursor-pointer focus:outline-none"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= userRating 
                                ? 'text-amber-500 fill-amber-500' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>

                    {/* Review text */}
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-bold text-charcoal block mb-1">اكتب رأيك أو تعليقك:</label>
                      <textarea
                        rows={2}
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder="رأيك في جودة المنتج، سرعة التجاوب والتوصيل..."
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none text-right font-light"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>إرسال التقييم الآن</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="border border-gray-200 hover:bg-gray-100 text-muted-gray px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
                      >
                        تخطي وتجاوز
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  العودة للمتجر الرئيسي
                </button>
              </div>
            </div>
          ) : isRedirectingToFawaterk ? (
            // Redirecting to Fawaterk – loading screen
            <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-8 w-full max-w-md relative overflow-hidden shadow-xl">
                <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-[#49B2A4]/15 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 border-4 border-[#49B2A4] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-black">
                    <span className="text-[#49B2A4]">FAWATERK</span>{' '}
                    <span className="text-white">فواتيرك</span>
                  </h3>
                  <p className="text-blue-200 text-sm leading-relaxed">
                    جاري تحضير بوابة الدفع الآمنة...
                    <br />
                    <span className="text-[11px] text-blue-300">سيتم تحويلك لصفحة الدفع الآن</span>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 bg-white/10 rounded-lg px-4 py-2">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span className="text-[11px] text-blue-200">تشفير SSL آمن 256-بت</span>
                  </div>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-start gap-2 text-sm w-full max-w-md text-right">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">فشل الاتصال ببوابة الدفع</p>
                    <p className="text-xs mt-1">{error}</p>
                    <button
                      onClick={() => { setError(''); setIsRedirectingToFawaterk(false); }}
                      className="mt-2 text-xs underline text-red-500 cursor-pointer"
                    >
                      الرجوع للمحاولة مجدداً
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Delivery detail form
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Form Col (3/5) */}
              <form onSubmit={handleSubmitOrder} className="md:col-span-3 space-y-4">
                <h3 className="text-base font-bold text-charcoal pb-2 border-b border-border-light flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  بيانات التوصيل والشحن
                </h3>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-bold text-charcoal">اسم المستلم بالكامل <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="الاسم بالكامل كما سيكتب على بوليصة الشحن"
                    className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-bold text-charcoal">رقم موبايل فعال (للتوصيل) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="01xxxxxxxxx"
                      className="w-full bg-gray-50 border border-border-light rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-gray" />
                  </div>
                  <p className="text-[10px] text-muted-gray">يرجى التأكد من تشغيل الخط لتلقي اتصالات مندوب شركة الشحن.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-charcoal">المحافظة <span className="text-red-500">*</span></label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                    >
                      {GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-charcoal">العنوان بالتفصيل <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="رقم الشقة، الدور، المبنى، اسم الشارع"
                      className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                    />
                  </div>
                </div>

                {/* Payment Selection Selector */}
                <div className="space-y-2 pt-2 text-right">
                  <label className="text-xs sm:text-sm font-bold text-charcoal block">طريقة السداد والدفع <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3.5 rounded-xl border text-right flex flex-col justify-between cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <Truck className="w-5 h-5 text-primary" />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {paymentMethod === 'cod' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs sm:text-sm font-black text-charcoal">الدفع عند الاستلام (كاش)</p>
                        <p className="text-[10px] text-muted-gray mt-0.5 leading-relaxed">افحص المنتج وجربه في بيتك وادفع لمندوب الشحن بعد المعاينة الكاملة</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('fawaiterk')}
                      className={`p-3.5 rounded-xl border text-right flex flex-col justify-between cursor-pointer transition-all ${
                        paymentMethod === 'fawaiterk'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'fawaiterk' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {paymentMethod === 'fawaiterk' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs sm:text-sm font-black text-charcoal">فيزا / ماستر كارد (فواتيرك)</p>
                        <p className="text-[10px] text-muted-gray mt-0.5 leading-relaxed">ادفع الآن ببطاقتك البنكية بأمان تام وسرعة عبر بوابة فواتيرك Fawaterk الشهيرة</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                  <p className="text-[11px] sm:text-xs text-yellow-800 leading-relaxed">
                    * <strong>ملحوظة:</strong> يتم تسليم البضائع ومعاينتها من قبل العميل قبل السداد بالكامل لمندوب الشحن، ضماناً لجودتنا العالية وثقتنا في جودة منتجاتنا.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {paymentMethod === 'fawaiterk' ? 'الانتقال لبوابة فواتيرك للدفع' : 'تأكيد الطلب والشحن الآن'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 border border-border-light rounded-lg hover:bg-gray-100 font-bold text-xs sm:text-sm text-muted-gray cursor-pointer"
                  >
                    الرجوع للسلة
                  </button>
                </div>

              </form>

              {/* Cart Summary Col (2/5) */}
              <div className="md:col-span-2 space-y-4 bg-gray-50 p-4 rounded-xl border border-border-light h-fit text-right">
                <h3 className="text-sm font-bold text-charcoal pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                  ملخص سلة الشراء
                </h3>

                {/* Scrolled list of items */}
                <div className="divide-y divide-gray-200 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-primary font-bold">
                      {(item.product.price * item.quantity).toLocaleString('ar-EG')} جنيه
                    </span>
                      <div className="text-charcoal font-medium max-w-[150px] truncate">
                        <span>{item.product.name}</span>
                        <span className="text-muted-gray text-[10px] block font-normal">
                          {item.quantity} وحدة × {item.product.price.toLocaleString('ar-EG')} جنيه
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <span className="text-xs font-bold text-charcoal block">هل لديك كوبون خصم؟</span>
                  <div className="flex gap-2">
                    {appliedCoupon ? (
                      <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg px-3 py-2 flex items-center justify-between font-bold flex-row-reverse">
                        <button 
                          type="button" 
                          onClick={handleRemoveCoupon}
                          className="text-red-500 hover:text-red-700 text-xs shrink-0 cursor-pointer hover:bg-red-50 px-2 py-1 rounded"
                        >
                          حذف الكوبون
                        </button>
                        <span>تم تطبيق الكوبون: <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] text-emerald-950 font-black">{appliedCoupon.code}</span></span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0"
                        >
                          تطبيق
                        </button>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="مثال: MORBIDO10"
                          className="flex-1 bg-white border border-border-light rounded-lg px-3 py-1.5 text-xs text-right font-bold uppercase placeholder:font-normal focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 font-bold leading-relaxed">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-emerald-600 font-bold leading-relaxed">{couponSuccess}</p>}
                </div>

                {/* Financial overview */}
                <div className="border-t border-gray-200 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-gray">
                    <span>{subtotal.toLocaleString('ar-EG')} جنيه</span>
                    <span>قيمة المشتريات:</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>-{discount.toLocaleString('ar-EG')} جنيه</span>
                      <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-gray">
                    <span>
                      {isFreeShipping ? 'شحن مجاني' : `${shippingCost.toLocaleString('ar-EG')} جنيه`}
                    </span>
                    <span>تكلفة الشحن:</span>
                  </div>
                  
                  <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between text-sm font-extrabold text-charcoal">
                    <span className="text-primary">{total.toLocaleString('ar-EG')} جنيه</span>
                    <span>الإجمالي الكلي:</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-border-light text-[10px] text-muted-gray leading-relaxed flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>نوصل بضمان وراحة لجميع المحافظات المصرية والقرى خلال ٢-٤ أيام كحد أقصى.</span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
