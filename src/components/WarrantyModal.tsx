import React, { useState, useRef } from 'react';
import { X, ShieldCheck, Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { saveWarrantyToDatabase } from '../lib/supabase';
import { WarrantyRequest } from '../types';

interface WarrantyModalProps {
  onClose: () => void;
  prefilledInfo?: {
    productName: string;
    serialNumber: string;
    productType: string;
    sizeName?: string;
  } | null;
  currentUser?: any;
}

export default function WarrantyModal({ onClose, prefilledInfo, currentUser }: WarrantyModalProps) {
  const [formData, setFormData] = useState({
    customerName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    productType: prefilledInfo?.productType || 'مرتبة طبية',
    productName: prefilledInfo ? `${prefilledInfo.productName}${prefilledInfo.sizeName ? ` - مقاس ${prefilledInfo.sizeName}` : ''}` : '',
    serialNumber: prefilledInfo?.serialNumber || '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0], // prefill current date for convenience
    notes: '',
  });

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [warrantyCode, setWarrantyCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setInvoiceFile(file);
        setError('');
      } else {
        setError('يرجى تحميل ملف صورة أو PDF فقط.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInvoiceFile(e.target.files[0]);
      setError('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.invoiceNumber || !formData.purchaseDate || !formData.productName || !formData.serialNumber) {
      setError('يرجى ملء جميع الحقول الإلزامية المميزة بنجمة (*)');
      return;
    }
    if (!invoiceFile) {
      setError('يرجى إرفاق صورة الفاتورة لضمان تفعيل صحيح للمنتج.');
      return;
    }

    // Generate a random high-quality Warranty activation code
    const code = 'FBW-' + Math.floor(100000 + Math.random() * 900000);
    
    const newWarranty: WarrantyRequest = {
      id: code,
      customerName: formData.customerName,
      phone: formData.phone,
      productType: formData.productType,
      productName: formData.productName,
      serialNumber: formData.serialNumber,
      invoiceNumber: formData.invoiceNumber,
      purchaseDate: formData.purchaseDate,
      notes: formData.notes,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    try {
      await saveWarrantyToDatabase(newWarranty);
      setWarrantyCode(code);
      setIsSuccess(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات الضمان. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-light flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
            <h2 className="text-lg font-extrabold text-charcoal">تفعيل الضمان الإلكتروني للمنتجات</h2>
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
          {isSuccess ? (
            <div className="text-center py-10 space-y-6 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-extrabold text-charcoal">تم تفعيل الضمان بنجاح!</h3>
              <p className="text-muted-gray text-sm max-w-md mx-auto leading-relaxed">
                أهلاً بك يا <strong>{formData.customerName}</strong> في عائلة موربيدو. لقد تم تسجيل وتفعيل الضمان الإلكتروني لمنتجك (<strong>{formData.productType}</strong>) لمدة <strong>١٠ سنوات كاملة</strong> ضد عيوب الصناعة أو الهبوط.
              </p>

              {/* Warranty Certificate Details Card */}
              <div className="bg-[#fbfbfb] border border-border-light p-5 rounded-xl max-w-md mx-auto text-right space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-100 pb-2">
                  <span className="font-extrabold text-primary">{warrantyCode}</span>
                  <span className="text-muted-gray">رقم شهادة الضمان:</span>
                </div>
                {formData.productName && (
                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-100 pb-2">
                    <span className="text-charcoal font-bold">{formData.productName}</span>
                    <span className="text-muted-gray">اسم المنتج المضمون:</span>
                  </div>
                )}
                {formData.serialNumber && (
                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-100 pb-2">
                    <span className="text-charcoal font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{formData.serialNumber}</span>
                    <span className="text-muted-gray">الرقم التسلسلي (S/N):</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-100 pb-2">
                  <span className="text-charcoal font-medium">{formData.invoiceNumber}</span>
                  <span className="text-muted-gray">رقم فاتورة الشراء:</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-100 pb-2">
                  <span className="text-charcoal font-medium">{formData.purchaseDate}</span>
                  <span className="text-muted-gray">تاريخ الشراء المسجل:</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-charcoal font-medium">{formData.phone}</span>
                  <span className="text-muted-gray">رقم الهاتف المسجل:</span>
                </div>
              </div>

              <div className="text-xs text-muted-gray pt-2">
                * تم إرسال رسالة نصية قصيرة (SMS) إلى هاتفك تحتوي على كود التفعيل ورابط الشهادة.
              </div>

              <button
                onClick={onClose}
                className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-bold shadow transition-all cursor-pointer"
              >
                حفظ العقد وإغلاق
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-right">
              {prefilledInfo ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex flex-col sm:flex-row items-center sm:items-start gap-3 text-right">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-emerald-950">🛡️ تم التحقق بنجاح من أصالة المنتج من موربيدو</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed font-bold">
                      لقد قمنا بالتحقق التلقائي والكامل من الرقم التسلسلي لهذا المنتج. هذا منتج أصلي ومعتمد ومسجل في قاعدة البيانات الرسمية لشركة موربيدو. تم ملء اسم المنتج والرقم التسلسلي بالأسفل، يرجى ملء بياناتك الشخصية الباقية لتفعيل الضمان لمدة ١٠ سنوات.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <p className="text-xs sm:text-sm text-primary leading-relaxed">
                    تلتزم شركة <strong>موربيدو</strong> بتقديم ضمان ممتد وحقيقي لجميع منتجاتها من مراتب ومخدات. يرجى تفعيل الضمان عبر هذا نموذج الإلكتروني والاحتفاظ بالفاتورة لضمان حقوق الصيانة والتبديل المجاني.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Product Info Block (Name & Serial) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-border-light text-right">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-charcoal flex items-center justify-between">
                    <span>اسم المنتج المضمون <span className="text-red-500">*</span></span>
                    {prefilledInfo && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">✓ معتمد وتلقائي</span>}
                  </label>
                  <input
                    type="text"
                    name="productName"
                    required
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="مثال: مرتبة ماريوت الطبية"
                    disabled={!!prefilledInfo}
                    className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none text-right ${
                      prefilledInfo 
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-bold cursor-not-allowed' 
                        : 'bg-gray-50 border-border-light focus:bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-charcoal flex items-center justify-between">
                    <span>الرقم التسلسلي (S/N) <span className="text-red-500">*</span></span>
                    {prefilledInfo && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">✓ تم التحقق منه</span>}
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    required
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    placeholder="مثال: MRB-MAT-12345"
                    disabled={!!prefilledInfo}
                    className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none text-right font-mono ${
                      prefilledInfo 
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-bold cursor-not-allowed' 
                        : 'bg-gray-50 border-border-light focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-charcoal">الاسم بالكامل كما في الفاتورة <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="الاسم الثلاثي أو الثنائي"
                    className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-charcoal">رقم الهاتف للتواصل وتلقي الكود <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-charcoal">نوع المنتج المشتري <span className="text-red-500">*</span></label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                  >
                    <option value="مرتبة طبية">مرتبة طبية من موربيدو</option>
                    <option value="مخدة ميموري فوم">مخدة ميموري فوم الطبية</option>
                    <option value="لحاف فندقي فاخر">لحاف فندقي فاخر</option>
                    <option value="ملاية استيك قطن">ملاية استيك قطن</option>
                    <option value="طقم سرير كامل">طقم سرير جكار كامل</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-charcoal">رقم الفاتورة <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      required
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      placeholder="Invoice-xxxx"
                      className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-charcoal">تاريخ الشراء <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="purchaseDate"
                      required
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Drag and Drop File Upload container - Usability Pattern */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-charcoal">صورة الفاتورة المعتمدة للتفعيل <span className="text-red-500">*</span></label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : invoiceFile ? 'border-primary/50 bg-green-50/20' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  {invoiceFile ? (
                    <>
                      <FileText className="w-8 h-8 text-primary animate-bounce" />
                      <p className="text-sm font-bold text-charcoal">تم اختيار الملف بنجاح!</p>
                      <p className="text-xs text-muted-gray">{invoiceFile.name} ({(invoiceFile.size / 1024).toFixed(1)} KB)</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setInvoiceFile(null); }}
                        className="text-xs text-red-500 hover:underline font-bold mt-1"
                      >
                        حذف وتغيير الملف
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-gray" />
                      <p className="text-xs sm:text-sm font-medium text-charcoal">اسحب وأفلت صورة الفاتورة هنا، أو انقر للتصفح</p>
                      <p className="text-[10px] text-muted-gray">يدعم الملفات من نوع PNG, JPG, JPEG أو PDF بحد أقصى 5 ميجابايت</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-charcoal">ملاحظات أو منتجات إضافية</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="اكتب أي معلومات إضافية عن المتجر أو الموزع المعتمد..."
                  className="w-full bg-gray-50 border border-border-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white text-right"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border-light">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold text-sm sm:text-base transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  تفعيل الضمان فوراً
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-border-light rounded-lg hover:bg-gray-100 font-bold text-sm text-muted-gray cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
