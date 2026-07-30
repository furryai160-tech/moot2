import React, { useState, useEffect } from 'react';
import { 
  X, User, ShoppingBag, Phone, Mail, Calendar, MapPin, 
  CreditCard, CheckCircle2, Clock, Truck, Edit2, Save, 
  AlertCircle, ChevronDown, ChevronUp, Package, ShieldCheck, LogOut, Download,
  Printer, Receipt, FileText
} from 'lucide-react';
import { AppUser, getOrdersFromDatabase, getWarrantiesFromDatabase, supabase } from '../lib/supabase';
import { Order, WarrantyRequest } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onUpdateUser: (updatedUser: AppUser) => void;
  onLogout?: () => void;
  onOpenWarranty?: (info?: any) => void;
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUpdateUser,
  onLogout,
  onOpenWarranty
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'warranties' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [warranties, setWarranties] = useState<WarrantyRequest[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWarranties, setLoadingWarranties] = useState(true);
  
  // Printable Invoice state for customer
  const [selectedInvoiceModalOrder, setSelectedInvoiceModalOrder] = useState<Order | null>(null);
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Expanded orders tracker (to see full items list)
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Warranty certificate downloading state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadCertificate = async (warranty: WarrantyRequest) => {
    setDownloadingId(warranty.id);
    try {
      // Create an offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 850;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas rendering context not available');

      // Background color - elegant warm ivory / soft cream
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer gold border (double frame)
      ctx.strokeStyle = '#c5a880'; // gold color
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.strokeStyle = '#c5a880';
      ctx.lineWidth = 3;
      ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

      // Inner green/gold corner decoration
      ctx.fillStyle = '#1d3e2d'; // elegant dark green (Morbido brand vibe)
      const accentSize = 60;
      // Top left
      ctx.fillRect(38, 38, accentSize, accentSize);
      // Top right
      ctx.fillRect(canvas.width - 38 - accentSize, 38, accentSize, accentSize);
      // Bottom left
      ctx.fillRect(38, canvas.height - 38 - accentSize, accentSize, accentSize);
      // Bottom right
      ctx.fillRect(canvas.width - 38 - accentSize, canvas.height - 38 - accentSize, accentSize, accentSize);

      // Draw gold inner stars
      ctx.fillStyle = '#c5a880';
      ctx.font = '24px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', 38 + accentSize/2, 38 + accentSize/2 + 8);
      ctx.fillText('★', canvas.width - 38 - accentSize/2, 38 + accentSize/2 + 8);
      ctx.fillText('★', 38 + accentSize/2, canvas.height - 38 - accentSize/2 + 8);
      ctx.fillText('★', canvas.width - 38 - accentSize/2, canvas.height - 38 - accentSize/2 + 8);

      // Header Title
      ctx.fillStyle = '#1d3e2d';
      ctx.font = 'bold 36px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MORBIDO MATTRESSES', canvas.width / 2, 100);

      ctx.fillStyle = '#c5a880';
      ctx.font = 'bold 20px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.fillText('لمستقبل مريح والراحة المثالية - شركة موربيدو للمراتب والمفروشات', canvas.width / 2, 135);

      // Divider
      ctx.strokeStyle = '#c5a880';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 250, 165);
      ctx.lineTo(canvas.width / 2 + 250, 165);
      ctx.stroke();

      // Certificate Type
      ctx.fillStyle = '#1d3e2d';
      ctx.font = 'bold 44px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.fillText('شهادة ضمان إلكترونية معتمدة', canvas.width / 2, 225);

      ctx.fillStyle = '#555555';
      ctx.font = '16px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.fillText('تؤكد شركة موربيدو للمراتب والمفروشات تفعيل الضمان الرسمي للمنتج الموضح أدناه', canvas.width / 2, 265);

      // Main Card Area for Info
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e8e5e0';
      ctx.lineWidth = 1;
      const cardX = 150;
      const cardY = 300;
      const cardW = canvas.width - 300;
      const cardH = 380;
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      // Info details with beautiful alignments
      const labelX = 1010;
      const valueX = 460;

      const rows = [
        { label: 'اسم العميل الكريم:', val: warranty.customerName, color: '#1d3e2d', font: 'bold 20px' },
        { label: 'المنتج المضمون:', val: warranty.productName || warranty.productType, color: '#1d3e2d', font: 'bold 18px' },
        { label: 'الرقم التسلسلي (S/N):', val: warranty.serialNumber || 'غير متوفر', color: '#333333', font: 'bold 18px' },
        { label: 'رقم الفاتورة الأصلي:', val: warranty.invoiceNumber, color: '#333333', font: 'bold 18px' },
        { label: 'تاريخ شراء المنتج:', val: warranty.purchaseDate, color: '#333333', font: 'bold 18px' },
        { label: 'رمز تفعيل الضمان:', val: warranty.id, color: '#b45309', font: 'bold 18px' },
        { label: 'تاريخ تفعيل الضمان:', val: warranty.createdAt || new Date().toLocaleDateString('ar-EG'), color: '#15803d', font: 'bold 18px' }
      ];

      rows.forEach((row, index) => {
        const y = cardY + 45 + (index * 46);

        // Draw Row Divider
        if (index < rows.length - 1) {
          ctx.strokeStyle = '#f1eee9';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(380, y + 23);
          ctx.lineTo(1020, y + 23);
          ctx.stroke();
        }

        // Draw Label
        ctx.textAlign = 'right';
        ctx.fillStyle = '#777777';
        ctx.font = 'bold 16px "Segoe UI", "Tahoma", "Arial", sans-serif';
        ctx.fillText(row.label, labelX, y + 5);

        // Draw Value
        ctx.textAlign = 'left';
        ctx.fillStyle = row.color;
        ctx.font = `${row.font} "Segoe UI", "Tahoma", "Arial", sans-serif`;
        ctx.fillText(row.val, valueX, y + 5);
      });

      // Seal or Stamp decoration on left card side
      const sealX = 270;
      const sealY = cardY + 190;

      ctx.strokeStyle = '#c5a880';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sealX, sealY, 65, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = '#1d3e2d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sealX, sealY, 58, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#1d3e2d';
      ctx.font = 'bold 12px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MORBIDO', sealX, sealY - 15);
      ctx.font = 'bold 16px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#c5a880';
      ctx.fillText('ضمان معتمد', sealX, sealY + 5);
      ctx.fillStyle = '#1d3e2d';
      ctx.font = '9px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.fillText('SECURE SEAL', sealX, sealY + 25);

      // Footer text
      ctx.fillStyle = '#888888';
      ctx.font = '13px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('يرجى الاحتفاظ بهذه الشهادة الإلكترونية. يسري الضمان وفق الشروط والأحكام الخاصة بشركة موربيدو للمراتب.', canvas.width / 2, 755);
      ctx.fillStyle = '#c5a880';
      ctx.font = 'bold 13px "Segoe UI", "Tahoma", "Arial", sans-serif';
      ctx.fillText('صُنع بكل فخر بمصر - خدمة عملاء موربيدو المتميزة', canvas.width / 2, 780);

      // Convert canvas to jspdf and save
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1200, 850]
      });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 1200, 850);
      pdf.save(`شهادة_ضمان_موربيدو_${warranty.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserOrders();
      loadUserWarranties();
      setName(currentUser.name);
      setPhone(currentUser.phone || '');
      setError(null);
      setSuccess(null);
      setIsEditing(false);
    }
  }, [isOpen, currentUser]);

  const loadUserOrders = async () => {
    setLoadingOrders(true);
    try {
      const allOrders = await getOrdersFromDatabase();
      // Filter orders by phone number (or email)
      const userPhone = currentUser.phone?.trim();
      const userEmail = currentUser.email?.trim();

      const userOrders = allOrders.filter(order => {
        const orderPhone = order.phone?.trim();
        const orderName = order.customerName?.trim();
        
        // Match by phone number or by matching name/email if phone is somehow empty
        return (userPhone && orderPhone === userPhone) || 
               (userEmail && order.email === userEmail) ||
               (orderName && orderName === currentUser.name);
      });

      setOrders(userOrders);
    } catch (err) {
      console.error('Error loading user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadUserWarranties = async () => {
    setLoadingWarranties(true);
    try {
      const allWarranties = await getWarrantiesFromDatabase();
      const userPhone = currentUser.phone?.trim();
      const userEmail = currentUser.email?.trim();

      const userWarranties = allWarranties.filter(w => {
        const wPhone = w.phone?.trim();
        const wName = w.customerName?.trim();

        // Match by phone number, email or name
        return (userPhone && wPhone === userPhone) ||
               (wName && wName === currentUser.name);
      });

      setWarranties(userWarranties);
    } catch (err) {
      console.error('Error loading user warranties:', err);
    } finally {
      setLoadingWarranties(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('يرجى إدخال الاسم بالكامل.');
      return;
    }

    if (phone.trim() && !/^01[0125][0-9]{8}$/.test(phone.trim())) {
      setError('يرجى إدخال رقم موبايل مصري صحيح مكون من ١١ رقم.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser: AppUser = {
        ...currentUser,
        name: name.trim(),
        phone: phone.trim(),
      };

      // 1. Update in Supabase if active
      if (supabase) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          email: currentUser.email,
        });
        if (profileError) throw profileError;
      }

      // 2. Update in Mock Database (localStorage)
      const mockUsers = JSON.parse(localStorage.getItem('morbido_users') || '[]');
      const userIndex = mockUsers.findIndex((u: any) => u.id === currentUser.id || u.email === currentUser.email);
      if (userIndex > -1) {
        mockUsers[userIndex].name = updatedUser.name;
        mockUsers[userIndex].phone = updatedUser.phone;
        localStorage.setItem('morbido_users', JSON.stringify(mockUsers));
      }

      // 3. Update current user in session
      localStorage.setItem('morbido_current_user', JSON.stringify(updatedUser));
      
      onUpdateUser(updatedUser);
      setSuccess('تم تحديث بيانات ملفك الشخصي بنجاح!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'فشل تحديث البيانات. يرجى المحاولة لاحقاً.');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusBadge = (status: 'pending' | 'delivering' | 'delivered') => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم التوصيل</span>
          </span>
        );
      case 'delivering':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-200">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            <span>جاري التوصيل</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string, status: string) => {
    const isPaid = status === 'paid';
    const methodText = method === 'fawaiterk' ? 'فيزا/كارت' : 'الدفع عند الاستلام';
    
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 bg-green-100/60 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold">
          <span>{methodText}</span>
          <span>•</span>
          <span>مدفوع</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
          <span>{methodText}</span>
          <span>•</span>
          <span>غير مدفوع</span>
        </span>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-none sm:rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 text-right flex flex-col border border-gray-100 h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-charcoal">
                حساب العميل الشخصي
              </h2>
              <p className="text-[11px] text-muted-gray mt-0.5">
                أهلاً بك يا {currentUser.name} في عالم نوم ملوكي مريح
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 bg-white text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-gray hover:text-charcoal hover:bg-gray-50/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>سجل الطلبات ({orders.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('warranties')}
            className={`flex-1 py-3 font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'warranties'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-gray hover:text-charcoal hover:bg-gray-50/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>الضمانات المفعّلة ({warranties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-gray hover:text-charcoal hover:bg-gray-50/50'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>ملفي الشخصي</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-charcoal mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span>الطلبات التي قمت بتسجيلها برقمك</span>
              </h3>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-gray">جاري تحميل سجل طلباتك من الخادم...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-gray">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">لا يوجد أي طلبات سابقة حتى الآن</h4>
                  <p className="text-xs text-muted-gray max-w-sm mx-auto mt-1.5 leading-relaxed">
                    يبدو أنك لم تقم بتسجيل أي طلبات شراء بعد باستخدام رقم الهاتف الحالي ({currentUser.phone || 'غير مسجل'}). تصفح منتجاتنا الآن وابدأ الشراء!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-2 bg-primary text-white text-xs font-black rounded-lg hover:bg-primary-hover shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <span>تصفح المنتجات الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = !!expandedOrders[order.id];
                    return (
                      <div 
                        key={order.id} 
                        className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
                      >
                        {/* Order Summary Header */}
                        <div 
                          onClick={() => toggleOrderExpand(order.id)}
                          className="p-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {order.id}
                              </span>
                              <span className="text-xs font-bold text-charcoal">
                                {order.createdAt}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-gray">
                              المستلم: <span className="font-bold text-charcoal">{order.customerName}</span> • موبايل: <span className="font-bold text-charcoal" dir="ltr">{order.phone}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-gray">القيمة الإجمالية:</p>
                              <p className="text-sm font-black text-primary">
                                {order.total.toLocaleString('ar-EG')} ج.م
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Detailed Items (Collapsible) */}
                        {isExpanded && (
                          <div className="p-4 border-t border-gray-100 space-y-4 bg-white">
                            {/* Products List */}
                            <div className="space-y-3">
                              <p className="text-xs font-black text-charcoal border-b border-gray-100 pb-1.5">
                                تفاصيل المنتجات المشتراة:
                              </p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-start text-xs">
                                  {item.product.imageUrl && (
                                    <img 
                                      src={item.product.imageUrl} 
                                      alt={item.product.name} 
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="flex-1 space-y-0.5">
                                    <h5 className="font-bold text-charcoal line-clamp-1">{item.product.name}</h5>
                                    <p className="text-[10px] text-muted-gray">
                                      {item.selectedSize ? `المقاس: ${item.selectedSize} • ` : ''}
                                      الكمية: <span className="font-bold text-charcoal">{item.quantity}</span>
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <span className="font-bold text-charcoal">
                                      {(item.product.price * item.quantity).toLocaleString('ar-EG')} ج.م
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Delivery & Payment Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 bg-gray-50/30 p-3 rounded-lg text-xs leading-relaxed">
                              <div>
                                <p className="text-muted-gray font-bold mb-1 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>عنوان التوصيل:</span>
                                </p>
                                <p className="text-charcoal font-medium pr-4.5">
                                  محافظة {order.city} - {order.address}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-gray font-bold mb-1 flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>طريقة وحالة الدفع:</span>
                                </p>
                                <div className="pr-4.5 mt-1">
                                  {getPaymentBadge((order as any).paymentMethod || 'cod', (order as any).paymentStatus || 'pending')}
                                </div>
                              </div>
                            </div>

                            {/* Saved Electronic Invoice & Warranty Actions */}
                            {(() => {
                              const existingWarranty = warranties.find(
                                w => w.invoiceNumber === order.id || w.invoiceNumber === `INV-${order.id}` || w.invoiceNumber === String(order.id)
                              );

                              return (
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-xl space-y-3 shadow-sm">
                                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-black">
                                      <Receipt className="w-4 h-4 text-teal-400" />
                                      <span>الفاتورة الرقمية المحفوظة (تاريخ الشراء: {order.createdAt})</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-teal-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                                      رقم الفاتورة: INV-{order.id}
                                    </span>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInvoiceModalOrder(order)}
                                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/15"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-teal-300" />
                                      <span>معاينة / طباعة الفاتورة</span>
                                    </button>

                                    {existingWarranty ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadCertificate(existingWarranty)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                                        <span>الضمان مفعّل (تحميل الشهادة PDF)</span>
                                      </button>
                                    ) : (() => {
                                      const mattressItem = order.items?.find((item: any) => {
                                        const cat = item.product?.category;
                                        const name = (item.product?.name || '').toLowerCase();
                                        return cat === 'mattresses' || name.includes('مرتبة') || name.includes('مرتبه');
                                      });

                                      if (mattressItem) {
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onClose();
                                              if (onOpenWarranty) {
                                                onOpenWarranty({
                                                  productName: mattressItem.product?.name || 'مرتبة موربيدو',
                                                  serialNumber: 'MRB-' + order.id,
                                                  invoiceNumber: order.id,
                                                  purchaseDate: order.createdAt,
                                                  productType: 'مرتبة طبية',
                                                  customerName: order.customerName,
                                                  phone: order.phone,
                                                  sizeName: mattressItem.selectedSize || ''
                                                });
                                              }
                                            }}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm animate-pulse"
                                          >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>⚡ تفعيل الضمان الـ ١٠ سنوات بنقرة واحدة</span>
                                          </button>
                                        );
                                      }

                                      return (
                                        <div className="flex-1 bg-white/10 text-amber-300 py-1.5 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-white/10">
                                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                          <span>الضمان للمراتب الطبية فقط (المخدات والمفروشات غير خاضعة للضمان)</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* Fast Assistance Callout */}
                            <div className="flex items-center justify-between text-[11px] bg-primary/5 p-2.5 rounded-lg border border-primary/10">
                              <span className="font-medium text-charcoal">هل تريد الاستفسار عن حالة شحن هذا الطلب؟</span>
                              <a 
                                href="tel:01034462884"
                                className="text-primary font-black hover:underline inline-flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>اتصل بنا: 01034462884</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'warranties' && (
            <div className="space-y-4 text-right">
              <h3 className="text-sm font-black text-charcoal mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>شهادات الضمان التي قمت بتفعيلها لمنتجاتك</span>
              </h3>

              {loadingWarranties ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-gray">جاري تحميل شهادات الضمان...</p>
                </div>
              ) : warranties.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-gray">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">لا توجد ضمانات مفعّلة حالياً</h4>
                  <p className="text-xs text-muted-gray max-w-sm mx-auto mt-1.5 leading-relaxed">
                    لم تقم بتفعيل أي كفالة ضمان إلكترونية بعد باستخدام رقم هاتفك الحالي ({currentUser.phone || 'غير مسجل'}). يمكنك تفعيل الضمان بسهولة من الصفحة الرئيسية.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {warranties.map((warranty) => (
                    <div 
                      key={warranty.id} 
                      className="border border-emerald-100 rounded-xl bg-gradient-to-br from-emerald-50/10 to-white shadow-sm overflow-hidden p-4 relative border-r-4 border-r-emerald-500 text-right"
                    >
                      {/* Top status */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-black">
                          {warranty.id}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-black border border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ضمان فعال ومدد</span>
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-gray">المنتج المضمون:</p>
                          <p className="font-black text-charcoal mt-0.5">{warranty.productName || warranty.productType}</p>
                        </div>

                        {warranty.serialNumber && (
                          <div>
                            <p className="text-[10px] text-muted-gray">الرقم التسلسلي (S/N):</p>
                            <p className="font-mono font-bold text-slate-700 mt-0.5 bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100">{warranty.serialNumber}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-dashed border-gray-100">
                          <div>
                            <p className="text-[9px] text-muted-gray">رقم الفاتورة:</p>
                            <p className="font-semibold text-charcoal">{warranty.invoiceNumber}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-muted-gray">تاريخ الشراء:</p>
                            <p className="font-semibold text-charcoal">{warranty.purchaseDate}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-2 text-[10px]">
                          <span className="text-muted-gray">تاريخ تفعيل الضمان:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {warranty.createdAt || 'اليوم'}
                          </span>
                        </div>

                        {/* Download Certificate PDF button */}
                        <button
                          onClick={() => handleDownloadCertificate(warranty)}
                          disabled={downloadingId !== null}
                          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {downloadingId === warranty.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>جاري تجهيز الشهادة...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل شهادة الضمان (PDF)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-charcoal font-medium">
                  <p className="font-bold text-primary mb-0.5">تأمين حسابك الشخصي في موربيدو</p>
                  <span>بياناتك الشخصية تُستخدم لتسهيل وتأكيد عمليات الشراء وتتبع الشحنات الخاصة بك وتفعيل كفالة الضمان تلقائياً على المنتجات التي تطلبها.</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-100 text-green-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">الاسم بالكامل <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white text-right outline-none transition-all disabled:opacity-60 disabled:bg-gray-100 disabled:cursor-not-allowed font-semibold"
                    />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">رقم الموبايل <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white text-left outline-none transition-all disabled:opacity-60 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                      dir="ltr"
                    />
                    <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                {/* Email Address (Disabled for security) */}
                <div className="space-y-1 opacity-75">
                  <label className="text-xs font-bold text-charcoal block">
                    البريد الإلكتروني <span className="text-[10px] text-muted-gray font-normal">(حساب الدخول - لا يمكن تعديله)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-left outline-none cursor-not-allowed font-medium text-gray-500"
                      dir="ltr"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                {/* Joined Date */}
                <div className="flex items-center gap-2 text-xs text-muted-gray pt-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>تاريخ التسجيل بالمتجر:</span>
                  <span className="font-bold text-charcoal">
                    {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير محدد'}
                  </span>
                </div>

                {/* Edit Controls */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-charcoal py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-gray-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>تعديل البيانات</span>
                      </button>
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            onLogout();
                            onClose();
                          }}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>تسجيل الخروج</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55"
                      >
                        {savingProfile ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>حفظ التعديلات</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setName(currentUser.name);
                          setPhone(currentUser.phone || '');
                          setError(null);
                        }}
                        className="px-4 bg-white hover:bg-gray-50 text-muted-gray hover:text-charcoal border border-gray-200 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span>إلغاء</span>
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Customer Printable Official Tax Invoice Modal */}
      {selectedInvoiceModalOrder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-200 text-right font-sans my-auto animate-in zoom-in-95 duration-200">
            
            {/* Control Bar */}
            <div className="bg-gray-100 p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#004D95]" />
                <h3 className="font-extrabold text-sm sm:text-base text-charcoal">
                  الفاتورة الضريبية الرسمية لطلبك (رقم INV-{selectedInvoiceModalOrder.id})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    document.body.classList.remove('printing-labels-mode');
                    document.body.classList.add('printing-invoice-mode');
                    setTimeout(() => {
                      window.focus();
                      try {
                        window.print();
                      } catch (e) {
                        console.error('Print failed:', e);
                      }
                      setTimeout(() => {
                        document.body.classList.remove('printing-invoice-mode');
                      }, 1000);
                    }, 100);
                  }}
                  className="bg-[#004D95] hover:bg-[#00386c] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInvoiceModalOrder(null)}
                  className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div id="printable-invoice" className="p-6 sm:p-8 bg-white space-y-6 text-charcoal text-xs sm:text-sm">
              
              {/* Header */}
              <div className="border-b-2 border-[#004D95] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#004D95] tracking-tight">موربيدو Morbido</span>
                    <span className="bg-[#004D95]/10 text-[#004D95] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#004D95]/20">
                      علامة تجارية مسجلة
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-700">شركة مصانع موربيدو لصناعة المراتب والمفروشات الطبية</p>
                  <p className="text-[11px] text-gray-500 font-mono">الرقم الضريبي الموحد: 525-965-122 | السجل التجاري: 18452</p>
                  <p className="text-[11px] text-gray-500">المركز الرئيسي والمصنع: دمنهور - البحيرة | خدمة العملاء: 01228495250</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left font-mono space-y-1 min-w-[180px]">
                  <div className="text-xs font-black text-[#004D95]">فاتورة مبيعات ضريبية</div>
                  <div className="text-[11px] font-bold text-gray-800">رقم الفاتورة: INV-{selectedInvoiceModalOrder.id}</div>
                  <div className="text-[10px] text-gray-500">
                    تاريخ الشراء: {selectedInvoiceModalOrder.createdAt}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700">
                    حالة الدفع: {selectedInvoiceModalOrder.paymentStatus === 'paid' ? '✅ مسدد بالكامل' : '⏳ دفع عند الاستلام'}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5">بيانات المشتري:</span>
                  <p className="font-black text-sm text-charcoal">{selectedInvoiceModalOrder.customerName}</p>
                  <p className="font-mono font-bold text-[#004D95] mt-0.5 dir-ltr text-right">📞 {selectedInvoiceModalOrder.phone}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5">عنوان ومكان التوصيل:</span>
                  <p className="font-bold text-gray-800">محافظة {selectedInvoiceModalOrder.city}</p>
                  <p className="text-xs text-gray-600">{selectedInvoiceModalOrder.address}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-gray-800">المنتجات والمقاسات المسجلة بالفاتورة:</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#004D95] text-white text-[11px] font-bold">
                        <th className="p-2.5">م</th>
                        <th className="p-2.5">اسم المنتج</th>
                        <th className="p-2.5">المقاس / التعديل الخاص</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-left">سعر الفئة</th>
                        <th className="p-2.5 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs font-medium">
                      {selectedInvoiceModalOrder.items && selectedInvoiceModalOrder.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono text-gray-400">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-charcoal">{item.product?.name}</td>
                          <td className="p-2.5">
                            {item.selectedSize ? (
                              item.selectedSize.includes('تفصيل') || item.selectedSize.includes('خاص') ? (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded text-[11px]">
                                  📐 {item.selectedSize}
                                </span>
                              ) : (
                                <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[11px]">
                                  📏 مقاس: {item.selectedSize}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400 text-[10px]">قياسي / موحد</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-left font-mono">{(item.product?.price || 0).toLocaleString('ar-EG')} ج.م</td>
                          <td className="p-2.5 text-left font-mono font-bold text-primary">
                            {((item.product?.price || 0) * item.quantity).toLocaleString('ar-EG')} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Warranty Seal */}
              <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-2">
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1 text-xs max-w-xs w-full">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>الكفالة والضمان المعتمد:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                    تُعتبر هذه الفاتورة الإلكترونية شهادة شراء وضمان معتمدة لمدة <strong>١٠ سنوات كاملة</strong> ضد عيوب التصنيع والهبوط.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 w-full sm:w-64 font-mono text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>إجمالي القيمة:</span>
                    <span>{(selectedInvoiceModalOrder.total || 0).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>مصاريف الشحن:</span>
                    <span className="text-emerald-600 font-bold">مجاني</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-sm text-[#004D95]">
                    <span>الصافي المطلوب:</span>
                    <span>{(selectedInvoiceModalOrder.total || 0).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 gap-2">
                <div>
                  <p className="font-bold text-gray-700">موربيدو Morbido - لمستقبل مريح والراحة المثالية</p>
                  <p>الموقع الرسمي: www.morbido-eg.com | الرقم الضريبي الموحد: 525-965-122</p>
                </div>

                <div className="border border-dashed border-[#004D95]/40 rounded-xl p-2 px-4 text-center bg-blue-50/50">
                  <span className="block font-black text-[#004D95] text-xs">ختم واعتماد شركة موربيدو</span>
                  <span className="text-[9px] text-gray-400 font-mono">فاتورة محفوظة إلكترونياً</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
