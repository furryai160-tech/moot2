import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ShoppingBag, Package, Send, Shield, Key, Plus, Trash2, 
  Edit, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Phone, Search, Eye,
  TrendingUp, Coins, Percent, Map, Settings, Star, FileSpreadsheet, UploadCloud,
  Check, AlertTriangle, QrCode, Printer
} from 'lucide-react';
import { Product, Order, Coupon } from '../types';
import { CATEGORIES } from '../data';
import { getOrdersFromDatabase, saveReviewToDatabase, deleteReviewFromDatabase } from '../lib/supabase';
import { sendTelegramTestMessage } from '../lib/telegram';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

function buildProductQrContent(p: Product, sizeName?: string) {
  const serial = p.serialNumber || `MRB-${p.category ? p.category.substring(0,3).toUpperCase() : 'GEN'}-AUTO`;
  
  // Construct direct deep link that phone cameras can immediately open to launch the verified warranty modal
  const url = `${window.location.origin}/?verify_warranty=true&prod_name=${encodeURIComponent(p.name)}&serial=${encodeURIComponent(serial)}&category=${encodeURIComponent(p.category || '')}${sizeName ? `&size=${encodeURIComponent(sizeName)}` : ''}`;

  return url;
}

function parseArabicNumber(str: any): number {
  if (str === null || str === undefined) return 0;
  const s = String(str)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[^0-9.]/g, '');
  return parseFloat(s) || 0;
}

function parseSizesAndPrices(sizesStr: string): { size: string; price: number; oldPrice?: number }[] {
  if (!sizesStr) return [];
  // Split by pipe, semicolon, arabic comma, or english comma
  const items = sizesStr.split(/[|;،,]/);
  const result: { size: string; price: number; oldPrice?: number }[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    // Split by separator like : or =
    let parts = trimmed.split(/[:=]/);
    if (parts.length < 2) {
      // Check if space separated "160x200 4500"
      const lastSpaceIdx = trimmed.lastIndexOf(' ');
      if (lastSpaceIdx > 0) {
        parts = [trimmed.substring(0, lastSpaceIdx), trimmed.substring(lastSpaceIdx)];
      } else {
        continue;
      }
    }

    const sizeName = parts[0].trim();
    const pricePart = parts[1].trim();

    if (!sizeName || !pricePart) continue;

    let price = 0;
    let oldPrice: number | undefined = undefined;

    // Match parentheses like "4500 (5500)" or "4500 (before 5500)" or "4500/5500"
    const parenMatch = pricePart.match(/([0-9٠-٩\.]+)\s*[\(\/（]\s*(?:قبل\s*|was\s*|before\s*)?([0-9٠-٩\.]+)/);
    if (parenMatch) {
      price = parseArabicNumber(parenMatch[1]);
      oldPrice = parseArabicNumber(parenMatch[2]);
    } else {
      const slashParts = pricePart.split('/');
      if (slashParts.length === 2) {
        price = parseArabicNumber(slashParts[0]);
        oldPrice = parseArabicNumber(slashParts[1]);
      } else {
        price = parseArabicNumber(pricePart);
      }
    }

    if (price > 0) {
      result.push({
        size: sizeName,
        price,
        oldPrice: oldPrice && oldPrice > 0 ? oldPrice : undefined,
      });
    }
  }

  return result;
}

function matchCategory(catStr: string): 'mattresses' | 'pillows' | 'bedding' | 'best-sellers' {
  if (!catStr) return 'mattresses';
  const s = catStr.trim().toLowerCase();
  if (s.includes('مرتب') || s.includes('mattress')) return 'mattresses';
  if (s.includes('مخد') || s.includes('وساد') || s.includes('pillow')) return 'pillows';
  if (s.includes('مفرش') || s.includes('مفروش') || s.includes('bedding') || s.includes('sheet') || s.includes('لحاف') || s.includes('لحف')) return 'bedding';
  if (s.includes('أكثر') || s.includes('اكثر') || s.includes('رواج') || s.includes('best') || s.includes('seller')) return 'best-sellers';
  return 'mattresses';
}

interface AdminDashboardModalProps {
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  triggerToast: (msg: string) => void;
  sitePhrases?: Record<string, string>;
  onUpdatePhrases?: (phrases: Record<string, string>) => void;
  currentUser?: any;
  reviews?: any[];
  onUpdateReviews?: (reviews: any[]) => void;
  cacheMetadata?: any;
  onForceResetCache?: () => void;
  coupons?: Coupon[];
  onUpdateCoupons?: (coupons: Coupon[]) => void;
}

export default function AdminDashboardModal({
  onClose,
  products,
  onUpdateProducts,
  triggerToast,
  sitePhrases,
  onUpdatePhrases,
  currentUser,
  reviews = [],
  onUpdateReviews,
  cacheMetadata,
  onForceResetCache,
  coupons = [],
  onUpdateCoupons,
}: AdminDashboardModalProps) {
  const isDesigner = currentUser?.isDesigner;
  const [activeTab, setActiveTab] = useState<string>(isDesigner ? 'designer_phrases' : 'orders');
  
  // Lists
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // Telegram states
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem('morbido_telegram_token') || '');
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem('morbido_telegram_chat_id') || '');
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Security states
  const [adminPhone, setAdminPhone] = useState(() => localStorage.getItem('morbido_admin_phone') || '01228495250');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('morbido_admin_password') || '01228495250');

  // Designer security states
  const [designerPhone, setDesignerPhone] = useState(() => localStorage.getItem('morbido_designer_phone') || '01069820990');
  const [designerPassword, setDesignerPassword] = useState(() => localStorage.getItem('morbido_designer_password') || '01069820990');

  // Phrases Form local states
  const [phrasesForm, setPhrasesForm] = useState<Record<string, string>>(() => sitePhrases || {});

  useEffect(() => {
    if (sitePhrases) {
      setPhrasesForm(sitePhrases);
    }
  }, [sitePhrases]);

  // Coupons local states
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(0);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      alert('الرجاء إدخال رمز الكوبون.');
      return;
    }
    if (newCouponValue <= 0) {
      alert('الرجاء إدخال قيمة خصم صالحة أكبر من صفر.');
      return;
    }
    if (newCouponType === 'percentage' && newCouponValue > 100) {
      alert('قيمة الخصم بالنسبة المئوية لا يمكن أن تتجاوز 100%.');
      return;
    }

    const uppercaseCode = newCouponCode.trim().toUpperCase();
    
    // Check if duplicate code exists
    if (coupons.some(c => c.code.toUpperCase() === uppercaseCode)) {
      alert('رمز الكوبون هذا موجود بالفعل! يرجى اختيار رمز آخر فريد.');
      return;
    }

    const newCoupon: Coupon = {
      id: 'c-' + Date.now(),
      code: uppercaseCode,
      type: newCouponType,
      value: newCouponValue,
      minOrderValue: newCouponMinOrder,
      isActive: true,
      createdAt: new Date().toLocaleDateString('ar-EG')
    };

    if (onUpdateCoupons) {
      onUpdateCoupons([...coupons, newCoupon]);
      triggerToast(`🎉 تم إنشاء كوبون الخصم الجديد [${uppercaseCode}] بنجاح!`);
      // Reset form
      setNewCouponCode('');
      setNewCouponType('percentage');
      setNewCouponValue(10);
      setNewCouponMinOrder(0);
    }
  };

  const handleToggleCouponStatus = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    if (onUpdateCoupons) {
      onUpdateCoupons(updated);
      triggerToast('تم تحديث حالة تفعيل الكوبون بنجاح!');
    }
  };

  const handleDeleteCoupon = (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الكوبون نهائياً؟')) return;
    const updated = coupons.filter(c => c.id !== id);
    if (onUpdateCoupons) {
      onUpdateCoupons(updated);
      triggerToast('تم حذف الكوبون بنجاح!');
    }
  };

  // Product Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [excelPreviewList, setExcelPreviewList] = useState<Product[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  
  // Form Fields
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodOldPrice, setProdOldPrice] = useState<number | undefined>(undefined);
  const [prodTag, setProdTag] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodCategory, setProdCategory] = useState<Product['category']>('mattresses');
  const [prodDescription, setProdDescription] = useState('');
  const [prodSizes, setProdSizes] = useState<{ size: string; price: number; oldPrice?: number }[]>([]);
  const [prodSerialNumber, setProdSerialNumber] = useState('');
  
  // Size Input Helpers
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizePrice, setNewSizePrice] = useState(0);
  const [newSizeOldPrice, setNewSizeOldPrice] = useState<number | undefined>(undefined);

  // Reviews Tab States
  const [newRevName, setNewRevName] = useState('');
  const [newRevLocation, setNewRevLocation] = useState('القاهرة');
  const [newRevProductName, setNewRevProductName] = useState('');
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevComment, setNewRevComment] = useState('');
  const [newRevDate, setNewRevDate] = useState('اليوم');
  const [newRevVerified, setNewRevVerified] = useState(true);

  // Labels Tab States
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [labelPrintMode, setLabelPrintMode] = useState<'base' | 'sizes'>('base');
  const [labelStyle, setLabelStyle] = useState<'classic' | 'minimal'>('classic');
  const [labelFilterCategory, setLabelFilterCategory] = useState<string>('all');
  const [labelSearch, setLabelSearch] = useState('');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [labelQuantities, setLabelQuantities] = useState<Record<string, number>>({});
  const [bulkQuantity, setBulkQuantity] = useState<number>(1);
  const [labelSeparateProducts, setLabelSeparateProducts] = useState<boolean>(true);
  const [labelShowCutLines, setLabelShowCutLines] = useState<boolean>(true);

  // Dynamic controls for QR and Text size
  const [labelQrSizeMultiplier, setLabelQrSizeMultiplier] = useState<number>(1.0);
  const [labelTextSizeMultiplier, setLabelTextSizeMultiplier] = useState<number>(1.0);

  useEffect(() => {
    if (products && products.length > 0 && !newRevProductName) {
      setNewRevProductName(products[0].name);
    }
  }, [products]);

  // Pre-select all products for labels tab
  useEffect(() => {
    if (products && products.length > 0 && selectedProductIds.length === 0) {
      setSelectedProductIds(products.map(p => p.id));
    }
  }, [products]);

  // QR Code Generation Effect
  useEffect(() => {
    if (activeTab !== 'labels' || selectedProductIds.length === 0) return;

    let isSubscribed = true;
    const generateQrs = async () => {
      const updatedQrs = { ...qrCodes };
      let changed = false;

      for (const id of selectedProductIds) {
        const p = products.find(prod => prod.id === id);
        if (!p) continue;

        // Base QR
        const baseKey = `${p.id}-base-${p.name}-${p.price}-${p.serialNumber || ''}`;
        if (!updatedQrs[baseKey]) {
          try {
            const qrContent = buildProductQrContent(p);
            const qrUrl = await QRCode.toDataURL(qrContent, {
              width: 180,
              margin: 1,
              color: {
                dark: '#0f172a',
                light: '#ffffff'
              }
            });
            updatedQrs[baseKey] = qrUrl;
            changed = true;
          } catch (err) {
            console.error('Error generating base QR code', err);
          }
        }

        // Sizes QR
        if (p.sizes && p.sizes.length > 0) {
          for (const sz of p.sizes) {
            const sizeKey = `${p.id}-${sz.size}-${p.name}-${sz.price}-${p.serialNumber || ''}`;
            if (!updatedQrs[sizeKey]) {
              try {
                const qrContent = buildProductQrContent(p, sz.size);
                const qrUrl = await QRCode.toDataURL(qrContent, {
                  width: 180,
                  margin: 1,
                  color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                  }
                });
                updatedQrs[sizeKey] = qrUrl;
                changed = true;
              } catch (err) {
                console.error('Error generating size QR code', err);
              }
            }
          }
        }
      }

      if (isSubscribed && changed) {
        setQrCodes(updatedQrs);
      }
    };

    generateQrs();
    return () => {
      isSubscribed = false;
    };
  }, [activeTab, selectedProductIds, products, qrCodes]);

  const handleGenerateMissingSerials = () => {
    let count = 0;
    const updatedProducts = products.map(p => {
      if (!p.serialNumber) {
        const catCode = p.category ? p.category.substring(0, 3).toUpperCase() : 'GEN';
        const randHash = Math.random().toString(36).substring(2, 7).toUpperCase();
        count++;
        return {
          ...p,
          serialNumber: `MRB-${catCode}-${randHash}`
        };
      }
      return p;
    });

    if (count > 0) {
      onUpdateProducts(updatedProducts);
      triggerToast(`✅ تم بنجاح توليد أرقام تسلسلية فريدة لـ (${count}) منتج منقوص!`);
    } else {
      triggerToast('جميع المنتجات في المتجر تمتلك بالفعل أرقاماً تسلسلية فريدة!');
    }
  };

  const handleApplyBulkQuantity = () => {
    if (selectedProductIds.length === 0) {
      triggerToast('⚠️ الرجاء تحديد منتج واحد على الأقل أولاً لتطبيق الكمية الجماعية!');
      return;
    }
    const updatedQuantities = { ...labelQuantities };
    selectedProductIds.forEach(id => {
      updatedQuantities[id] = bulkQuantity;
    });
    setLabelQuantities(updatedQuantities);
    triggerToast(`⚡ تم تطبيق كمية (${bulkQuantity}) نسخة على جميع المنتجات المحددة (${selectedProductIds.length})!`);
  };

  const filteredProductsForLabels = React.useMemo(() => {
    return products.filter(p => {
      const matchCategory = labelFilterCategory === 'all' || p.category === labelFilterCategory;
      const matchSearch = labelSearch.trim() === '' || 
        p.name.toLowerCase().includes(labelSearch.toLowerCase()) ||
        (p.serialNumber && p.serialNumber.toLowerCase().includes(labelSearch.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, labelFilterCategory, labelSearch]);

  const labelsToPrint = React.useMemo(() => {
    const list: {
      id: string;
      name: string;
      price: number;
      sizeName?: string;
      warranty: string;
      serialNumber: string;
      qrUrl?: string;
    }[] = [];

    filteredProductsForLabels.forEach(p => {
      if (!selectedProductIds.includes(p.id)) return;

      const serialNumber = p.serialNumber || `MRB-${p.category ? p.category.substring(0,3).toUpperCase() : 'GEN'}-AUTO`;
      const warranty = p.specs?.['الضمان'] || 'ضمان حقيقي ١٠ سنوات من موربيدو';
      const quantity = labelQuantities[p.id] || 1;

      // Compound base key
      const baseKey = `${p.id}-base-${p.name}-${p.price}-${p.serialNumber || ''}`;

      for (let i = 0; i < quantity; i++) {
        if (labelPrintMode === 'base') {
          list.push({
            id: p.id,
            name: p.name,
            price: p.price,
            warranty,
            serialNumber: quantity > 1 ? `${serialNumber}-${i + 1}` : serialNumber,
            qrUrl: qrCodes[baseKey]
          });
        } else {
          if (p.sizes && p.sizes.length > 0) {
            p.sizes.forEach(sz => {
              // Compound size key
              const sizeKey = `${p.id}-${sz.size}-${p.name}-${sz.price}-${p.serialNumber || ''}`;
              list.push({
                id: p.id,
                name: p.name,
                price: sz.price,
                sizeName: sz.size,
                warranty,
                serialNumber: `${serialNumber}-${sz.size.replace(/[^0-9]/g, '')}${quantity > 1 ? `-${i + 1}` : ''}`,
                qrUrl: qrCodes[sizeKey]
              });
            });
          } else {
            list.push({
              id: p.id,
              name: p.name,
              price: p.price,
              warranty,
              serialNumber: quantity > 1 ? `${serialNumber}-${i + 1}` : serialNumber,
              qrUrl: qrCodes[baseKey]
            });
          }
        }
      }
    });

    return list;
  }, [filteredProductsForLabels, selectedProductIds, labelPrintMode, qrCodes, labelQuantities]);

  const groupedLabelsToPrint = React.useMemo(() => {
    const groups: { productId: string; productName: string; labels: typeof labelsToPrint }[] = [];
    labelsToPrint.forEach(lbl => {
      let group = groups.find(g => g.productId === lbl.id);
      if (!group) {
        group = { productId: lbl.id, productName: lbl.name, labels: [] };
        groups.push(group);
      }
      group.labels.push(lbl);
    });
    return groups;
  }, [labelsToPrint]);

  // Load orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const fetched = await getOrdersFromDatabase();
      setOrders(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Telegram Actions
  const handleSaveTelegram = () => {
    localStorage.setItem('morbido_telegram_token', telegramToken.trim());
    localStorage.setItem('morbido_telegram_chat_id', telegramChatId.trim());
    triggerToast('تم حفظ إعدادات بوت تلجرام بنجاح.');
  };

  const handleTestTelegram = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert('الرجاء إدخال التوكن ومعرف الشات أولاً لتجربة الربط.');
      return;
    }
    setTestingTelegram(true);
    const res = await sendTelegramTestMessage(telegramToken.trim(), telegramChatId.trim());
    setTestingTelegram(false);
    if (res.success) {
      triggerToast('تم إرسال الرسالة التجريبية بنجاح! تفقد تطبيق تلجرام.');
    } else {
      alert(`فشل إرسال الرسالة التجريبية:\n${res.message}`);
    }
  };

  // Security Actions
  const handleSaveSecurity = () => {
    if (!adminPhone.trim() || !adminPassword.trim()) {
      alert('الرجاء تعبئة حقل الهاتف وحقل كلمة المرور بشكل صحيح.');
      return;
    }
    localStorage.setItem('morbido_admin_phone', adminPhone.trim());
    localStorage.setItem('morbido_admin_password', adminPassword.trim());
    triggerToast('تم تعديل بيانات الدخول الخاصة بالأدمن بنجاح!');
  };

  const handleSaveDesignerSecurity = () => {
    if (!designerPhone.trim() || !designerPassword.trim()) {
      alert('الرجاء تعبئة حقل الهاتف وحقل كلمة المرور بشكل صحيح.');
      return;
    }
    localStorage.setItem('morbido_designer_phone', designerPhone.trim());
    localStorage.setItem('morbido_designer_password', designerPassword.trim());
    triggerToast('🔐 تم تعديل بيانات الدخول للمصمم بنجاح! يرجى استخدامها في المرة القادمة.');
  };

  const handleUpdatePhraseValue = (key: string, value: string) => {
    setPhrasesForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePhrases = () => {
    if (onUpdatePhrases) {
      onUpdatePhrases(phrasesForm);
      triggerToast('🎉 تم حفظ نصوص وعبارات الموقع بنجاح، ستنعكس التغييرات فوراً على الواجهة!');
    }
  };

  // Products Actions
  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setIsAddingNew(false);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdOldPrice(p.oldPrice);
    setProdTag(p.tag || '');
    setProdImageUrl(p.imageUrl);
    setProdCategory(p.category);
    setProdDescription(p.description);
    setProdSizes(p.sizes || []);
    setProdSerialNumber(p.serialNumber || `MRB-${p.category.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  };

  const handleStartAdd = () => {
    setEditingProduct(null);
    setIsAddingNew(true);
    setProdName('');
    setProdPrice(1000);
    setProdOldPrice(undefined);
    setProdTag('');
    setProdImageUrl('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=60');
    setProdCategory('mattresses');
    setProdDescription('');
    setProdSizes([]);
    setProdSerialNumber(`MRB-MAT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  };

  const handleAddSizeOption = () => {
    if (!newSizeName.trim()) {
      alert('الرجاء إدخال اسم أو مقاس صحيح (مثال: ١٦٠ × ٢٠٠ سم)');
      return;
    }
    if (newSizePrice <= 0) {
      alert('الرجاء إدخال سعر صحيح للمقاس.');
      return;
    }
    setProdSizes(prev => [...prev, { 
      size: newSizeName.trim(), 
      price: newSizePrice,
      oldPrice: newSizeOldPrice && newSizeOldPrice > 0 ? newSizeOldPrice : undefined
    }]);
    setNewSizeName('');
    setNewSizePrice(0);
    setNewSizeOldPrice(undefined);
  };

  const handleRemoveSizeOption = (idx: number) => {
    setProdSizes(prev => prev.filter((_, i) => i !== idx));
  };

  // Reviews Tab Actions
  const handleAddCustomReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevName.trim() || !newRevComment.trim()) {
      alert('الرجاء كتابة اسم المقيم والتعليق بشكل كامل.');
      return;
    }
    const newRev = {
      id: 'adm_' + Date.now().toString(36),
      name: newRevName.trim(),
      location: newRevLocation,
      productName: newRevProductName || 'موقع موربيدو والخدمة بشكل عام',
      rating: newRevRating,
      date: newRevDate.trim() || 'اليوم',
      comment: newRevComment.trim(),
      verified: newRevVerified,
    };
    // Save to Supabase
    await saveReviewToDatabase(newRev);
    if (onUpdateReviews) {
      onUpdateReviews([newRev, ...reviews]);
      triggerToast('🎉 تم إضافة التقييم المخصص بنجاح وسينعكس فوراً على الموقع!');
      // Reset form
      setNewRevName('');
      setNewRevComment('');
      setNewRevDate('اليوم');
    }
  };

  const handleDeleteReview = async (reviewId: any) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟')) return;
    // Delete from Supabase
    await deleteReviewFromDatabase(String(reviewId));
    if (onUpdateReviews) {
      const filtered = reviews.filter(r => String(r.id) !== String(reviewId));
      onUpdateReviews(filtered);
      triggerToast('🗑️ تم حذف التقييم بنجاح.');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المتجر؟')) return;
    const updated = products.filter(p => p.id !== productId);
    onUpdateProducts(updated);
    triggerToast('تم حذف المنتج بنجاح.');
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodImageUrl.trim() || !prodDescription.trim()) {
      alert('الرجاء ملء جميع الحقول الأساسية للمنتج.');
      return;
    }

    if (isAddingNew) {
      const newId = `${prodCategory}-${Math.random().toString(36).substr(2, 9)}`;
      const newProd: Product = {
        id: newId,
        name: prodName,
        price: prodPrice,
        oldPrice: prodOldPrice && prodOldPrice > 0 ? prodOldPrice : undefined,
        tag: prodTag ? prodTag : undefined,
        imageUrl: prodImageUrl,
        category: prodCategory,
        description: prodDescription,
        rating: 4.8,
        specs: {
          'الخامة الأساسية': prodCategory === 'mattresses' ? 'سوست كربونية قوية مع فوم فاخر' : 'ألياف مجهرية ممتازة',
          'البلد المصنع': 'مصر (مصانع موربيدو المعتمدة)',
          'الضمان': 'ضمان حقيقي ١٠ سنوات بختم موربيدو'
        },
        sizes: prodSizes.length > 0 ? prodSizes : undefined,
        serialNumber: prodSerialNumber || `MRB-${prodCategory.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      };
      onUpdateProducts([newProd, ...products]);
      triggerToast('تمت إضافة المنتج الجديد بنجاح!');
      setIsAddingNew(false);
    } else if (editingProduct) {
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            price: prodPrice,
            oldPrice: prodOldPrice && prodOldPrice > 0 ? prodOldPrice : undefined,
            tag: prodTag ? prodTag : undefined,
            imageUrl: prodImageUrl,
            category: prodCategory,
            description: prodDescription,
            sizes: prodSizes.length > 0 ? prodSizes : undefined,
            serialNumber: prodSerialNumber
          };
        }
        return p;
      });
      onUpdateProducts(updated);
      triggerToast('تم تعديل المنتج وحفظ التغييرات بنجاح!');
      setEditingProduct(null);
    }
  };

  // Excel Import Actions
  const handleDownloadTemplate = () => {
    const wsData = [
      {
        "اسم المنتج": "مرتبة موربيدو رويال الطبية",
        "القسم": "مراتب",
        "السعر": 4500,
        "السعر القديم": 6000,
        "الضمان": "ضمان حقيقي ١٠ سنوات بختم موربيدو",
        "رابط الصورة": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600",
        "الوصف": "مرتبة رويال الفاخرة مصممة بنظام السوست المنفصلة لدعم العمود الفقري وتوفير نوم هادئ وصحي.",
        "المقاسات والأسعار": "120x200: 3000 | 160x200: 4500 | 180x200: 5200"
      },
      {
        "اسم المنتج": "مخدة موربيدو فوم الطبية",
        "القسم": "مخدات",
        "السعر": 450,
        "السعر القديم": 600,
        "الضمان": "ضمان حقيقي سنتين",
        "رابط الصورة": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600",
        "الوصف": "مخدة طبية مريحة للغاية مصنوعة من الميموري فوم فائق الجودة لتخفيف آلام الرقبة.",
        "المقاسات والأسعار": "مقاس قياسي: 450"
      },
      {
        "اسم المنتج": "لحاف فندقي ناعم",
        "القسم": "مفروشات",
        "السعر": 1200,
        "السعر القديم": 1800,
        "الضمان": "ضمان سنة ضد التكتل",
        "رابط الصورة": "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600",
        "الوصف": "لحاف فندقي حراري فائق النعومة والتدفئة مصنوع من ألياف مايكروفايبر معالجة.",
        "المقاسات والأسعار": "فردي: 1200 | زوجي: 1600"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "morbido_products_template.xlsx");
    triggerToast("📥 تم تحميل نموذج ملف الإكسل بنجاح!");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (!data || data.length === 0) {
          alert('الملف فارغ أو يحتوي على بيانات غير صالحة.');
          return;
        }

        const parsedProducts: Product[] = [];

        for (const row of data as any[]) {
          let name = '';
          let price = 0;
          let oldPrice: number | undefined = undefined;
          let category: Product['category'] = 'mattresses';
          let imageUrl = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=60';
          let description = '';
          let warranty = 'ضمان حقيقي ١٠ سنوات بختم موربيدو';
          let sizesStr = '';
          let serialNumExcel = '';

          for (const key of Object.keys(row)) {
            const lowerKey = key.trim().toLowerCase();
            const val = row[key];

            if (lowerKey.includes('اسم') || lowerKey.includes('name') || lowerKey.includes('المنتج')) {
              name = String(val).trim();
            } else if (lowerKey.includes('سعر قديم') || lowerKey.includes('السعر القديم') || lowerKey.includes('قبل الخصم') || lowerKey.includes('old price') || lowerKey.includes('oldprice')) {
              const parsed = parseArabicNumber(val);
              if (parsed > 0) oldPrice = parsed;
            } else if (lowerKey.includes('سعر') || lowerKey.includes('السعر') || lowerKey.includes('price')) {
              price = parseArabicNumber(val);
            } else if (lowerKey.includes('قسم') || lowerKey.includes('تصنيف') || lowerKey.includes('فئة') || lowerKey.includes('category') || lowerKey.includes('class')) {
              category = matchCategory(String(val));
            } else if (lowerKey.includes('رابط') || lowerKey.includes('صورة') || lowerKey.includes('الصورة') || lowerKey.includes('image') || lowerKey.includes('url') || lowerKey.includes('link')) {
              imageUrl = String(val).trim();
            } else if (lowerKey.includes('وصف') || lowerKey.includes('الوصف') || lowerKey.includes('desc') || lowerKey.includes('details')) {
              description = String(val).trim();
            } else if (lowerKey.includes('ضمان') || lowerKey.includes('الضمان') || lowerKey.includes('warranty')) {
              warranty = String(val).trim();
            } else if (lowerKey.includes('مقاس') || lowerKey.includes('مقسات') || lowerKey.includes('sizes') || lowerKey.includes('size')) {
              sizesStr = String(val).trim();
            } else if (lowerKey.includes('سيريال') || lowerKey.includes('الرقم التسلسلي') || lowerKey.includes('تسلسلي') || lowerKey.includes('serial') || lowerKey.includes('sn')) {
              serialNumExcel = String(val).trim();
            }
          }

          if (!name) continue;

          const sizes = parseSizesAndPrices(sizesStr);

          if (!description) {
            description = `مرتبة ${name} الطبية الفاخرة المصممة لتوفر أقصى درجات الراحة والدعم للجسم أثناء النوم.`;
          }

          const specs = {
            'الخامة الأساسية': category === 'mattresses' ? 'سوست كربونية قوية مع فوم فاخر' : 'ألياف مجهرية ممتازة',
            'البلد المصنع': 'مصر (مصانع موربيدو المعتمدة)',
            'الضمان': warranty
          };

          const newId = `${category}-${Math.random().toString(36).substr(2, 9)}`;
          const finalSerial = serialNumExcel || `MRB-${category.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

          parsedProducts.push({
            id: newId,
            name,
            price: price || 1000,
            oldPrice,
            imageUrl,
            category,
            description,
            rating: 4.8,
            specs,
            sizes: sizes.length > 0 ? sizes : undefined,
            serialNumber: finalSerial
          });
        }

        if (parsedProducts.length === 0) {
          alert('لم نتمكن من قراءة أي منتجات صالحة من الملف. يرجى التأكد من مطابقة أسماء الأعمدة للتعليمات.');
          return;
        }

        setExcelPreviewList(parsedProducts);
        triggerToast(`📄 تم تحليل (${parsedProducts.length}) منتج من الملف بنجاح! راجع البيانات أدناه قبل تأكيد الاستيراد.`);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء معالجة ملف الإكسل. يرجى التأكد من صيغة الملف.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (excelPreviewList.length === 0) return;
    
    let updatedProducts: Product[] = [];
    if (importMode === 'append') {
      updatedProducts = [...excelPreviewList, ...products];
    } else {
      if (!confirm('هل أنت متأكد من رغبتك في حذف كافة المنتجات الحالية واستبدالها بمنتجات ملف الإكسل فقط؟ هذا الإجراء غير قابل للتراجع.')) {
        return;
      }
      updatedProducts = [...excelPreviewList];
    }
    
    onUpdateProducts(updatedProducts);
    triggerToast(`🎉 تم استيراد (${excelPreviewList.length}) منتج بنجاح وتحديث الكاش الخاص بمتجر موربيدو!`);
    setExcelPreviewList([]);
    setShowExcelUploader(false);
  };

  // Filter orders
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.phone.includes(orderSearch)
  );

  // Analytics Calculations
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const codOrders = orders.filter(o => o.paymentMethod === 'cod');
  const codCount = codOrders.length;
  const codRevenue = codOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const onlineOrders = orders.filter(o => o.paymentMethod === 'fawaiterk');
  const onlineCount = onlineOrders.length;
  const onlineRevenue = onlineOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Group by category to see what category sells most
  const categorySalesMap: Record<string, number> = {
    mattresses: 0,
    pillows: 0,
    bedding: 0,
    'best-sellers': 0
  };

  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

  orders.forEach(o => {
    if (o.items) {
      o.items.forEach((item: any) => {
        const prod = item.product;
        if (!prod) return;
        const prodId = prod.id || 'unknown';
        const prodName = prod.name || 'منتج غير معروف';
        const category = prod.category || 'mattresses';
        const price = prod.price || 0;
        const qty = item.quantity || 1;

        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = { name: prodName, quantity: 0, revenue: 0, category };
        }
        productSalesMap[prodId].quantity += qty;
        productSalesMap[prodId].revenue += (price * qty);

        if (categorySalesMap[category] !== undefined) {
          categorySalesMap[category] += (price * qty);
        } else {
          categorySalesMap[category] = (price * qty);
        }
      });
    }
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const citySalesMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach(o => {
    const city = o.city || 'غير محدد';
    if (!citySalesMap[city]) {
      citySalesMap[city] = { count: 0, revenue: 0 };
    }
    citySalesMap[city].count += 1;
    citySalesMap[city].revenue += (o.total || 0);
  });

  const citySales = Object.entries(citySalesMap)
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative h-full sm:h-auto max-h-[100vh] sm:max-h-[92vh] flex flex-col text-right font-sans animate-in fade-in zoom-in duration-300">
        
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black text-charcoal">
              {isDesigner ? 'لوحة تحكم مصمم الموقع' : 'لوحة تحكم الإدارة ومتابعة المبيعات'}
            </h2>
            <span className="bg-primary/15 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              موربيدو بد Morbido
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-100 border-b border-gray-200 p-2 flex flex-nowrap overflow-x-auto sm:flex-wrap gap-1 justify-start sm:justify-end shrink-0 scrollbar-thin">
          {isDesigner ? (
            <>
              <button
                onClick={() => setActiveTab('designer_security')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'designer_security' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>حساب المصمم والأمان</span>
              </button>

              <button
                onClick={() => setActiveTab('designer_phrases')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'designer_phrases' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>تعديل نصوص الموقع</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'products' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>إدارة المنتجات والمقاسات</span>
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'labels' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>ملصقات الـ QR والباركود</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'reviews' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500" />
                <span>إدارة التقييمات والآراء</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'security' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>الحماية والوصول</span>
              </button>

              <button
                onClick={() => setActiveTab('designer_phrases')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'designer_phrases' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>نصوص الموقع (المصمم)</span>
              </button>

              <button
                onClick={() => setActiveTab('telegram')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'telegram' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>ربط بوت تلجرام</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'products' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>إدارة المنتجات والمقاسات</span>
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'labels' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>ملصقات الـ QR والباركود</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'analytics' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>التقارير والأرباح</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'orders' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>الطلبات الواردة ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'reviews' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500" />
                <span>التقييمات والآراء ({reviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('coupons')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'coupons' ? 'bg-primary text-white shadow' : 'text-charcoal hover:bg-gray-200'
                }`}
              >
                <Percent className="w-4 h-4 text-emerald-500" />
                <span>كوبونات الخصم ({coupons.length})</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-white">
          
          {/* TAB 0: ANALYTICS (التقارير والأرباح) */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300">
              
              {/* Header */}
              <div className="bg-gradient-to-l from-primary/10 to-transparent p-5 rounded-2xl border-r-4 border-primary">
                <h3 className="text-base sm:text-lg font-black text-charcoal">📊 تقارير المبيعات وتحليلات الأرباح</h3>
                <p className="text-xs text-muted-gray mt-1">
                  تتبع إحصائيات متجرك، ومصادر الدخل، والمحافظات والمنتجات الأكثر مبيعاً بدقة ولحظياً.
                </p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <Coins className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-gray">إجمالي المبيعات</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-lg sm:text-xl font-black text-charcoal">{totalRevenue.toLocaleString('ar-EG')} ج.م</p>
                    <p className="text-[10px] text-green-600 font-bold mt-1">
                      💸 شامل كافة المعاملات
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <ShoppingBag className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-gray">حجم الطلبات</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-lg sm:text-xl font-black text-charcoal">{totalOrders.toLocaleString('ar-EG')} طلب</p>
                    <p className="text-[10px] text-blue-600 font-bold mt-1">
                      📈 تم تسجيلها بالكامل
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                      <Percent className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-gray">متوسط قيمة الطلب</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-lg sm:text-xl font-black text-charcoal">{averageOrderValue.toLocaleString('ar-EG')} ج.م</p>
                    <p className="text-[10px] text-purple-600 font-bold mt-1">
                      ⭐ لكل عميل منفرد
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-gray">المبالغ المحصلة</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-lg sm:text-xl font-black text-charcoal">
                      {orders.filter(o => o.paymentStatus === 'paid').reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString('ar-EG')} ج.م
                    </p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">
                      ✅ تم دفعها أو استلامها
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods and Category Share */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Payment Breakdown */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-charcoal text-xs sm:text-sm border-b pb-2">💳 توزيع طرق الدفع المفضلة</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-blue-600 font-mono">
                          {codRevenue.toLocaleString('ar-EG')} ج.م ({codCount} طلبات)
                        </span>
                        <span className="text-charcoal">الدفع عند الاستلام (COD)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${totalRevenue > 0 ? (codRevenue / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-teal-600 font-mono">
                          {onlineRevenue.toLocaleString('ar-EG')} ج.م ({onlineCount} طلبات)
                        </span>
                        <span className="text-charcoal">دفع إلكتروني (فواتيرك)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${totalRevenue > 0 ? (onlineRevenue / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-[11px] text-muted-gray">
                    <span>نسبة الدفع الإلكتروني: <strong className="text-teal-600 font-bold">{totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0}%</strong></span>
                    <span>نسبة الدفع عند الاستلام: <strong className="text-blue-600 font-bold">{totalRevenue > 0 ? Math.round((codRevenue / totalRevenue) * 100) : 0}%</strong></span>
                  </div>
                </div>

                {/* Category Sales Breakdown */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-charcoal text-xs sm:text-sm border-b pb-2">🛍️ المبيعات حسب فئات المتجر</h4>
                  
                  <div className="space-y-3.5">
                    {/* Mattresses */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-primary font-mono">{categorySalesMap['mattresses'].toLocaleString('ar-EG')} ج.م</span>
                        <span className="text-charcoal">المراتب الطبية الفاخرة</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full" 
                          style={{ width: `${totalRevenue > 0 ? (categorySalesMap['mattresses'] / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Pillows */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-purple-600 font-mono">{categorySalesMap['pillows'].toLocaleString('ar-EG')} ج.م</span>
                        <span className="text-charcoal">المخدات الطبية</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full" 
                          style={{ width: `${totalRevenue > 0 ? (categorySalesMap['pillows'] / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Bedding */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-rose-600 font-mono">{categorySalesMap['bedding'].toLocaleString('ar-EG')} ج.م</span>
                        <span className="text-charcoal">المفروشات الفندقية</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full" 
                          style={{ width: `${totalRevenue > 0 ? (categorySalesMap['bedding'] / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Best sellers */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-600 font-mono">{categorySalesMap['best-sellers'].toLocaleString('ar-EG')} ج.م</span>
                        <span className="text-charcoal">الأكثر مبيعاً</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full" 
                          style={{ width: `${totalRevenue > 0 ? (categorySalesMap['best-sellers'] / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Leaderboard & Location sales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Top Selling Products */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-extrabold text-charcoal text-xs sm:text-sm">🏆 المنتجات الـ 5 الأكثر مبيعاً ورواجاً</h4>
                    <p className="text-[10px] text-muted-gray mt-0.5">مرتبة تنازلياً حسب إجمالي الإيرادات المتحققة.</p>
                  </div>

                  {topProducts.length === 0 ? (
                    <p className="text-xs text-muted-gray text-center py-8">لا توجد بيانات مبيعات للمنتجات حالياً.</p>
                  ) : (
                    <div className="space-y-3">
                      {topProducts.map((p, index) => (
                        <div key={index} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                          <div className="text-left">
                            <span className="font-extrabold text-primary font-mono">{p.revenue.toLocaleString('ar-EG')} ج.م</span>
                            <span className="text-muted-gray block text-[10px]">الكمية المباعة: {p.quantity} وحدة</span>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="w-5 h-5 bg-primary/10 text-primary font-black rounded-full flex items-center justify-center text-[10px]">
                              {index + 1}
                            </span>
                            <span className="font-bold text-charcoal line-clamp-1 max-w-[200px]">{p.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Geographical Analysis */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-extrabold text-charcoal text-xs sm:text-sm flex items-center gap-1 justify-end">
                      <Map className="w-4 h-4 text-primary" />
                      <span>📍 تحليل طلبات المحافظات والمدن</span>
                    </h4>
                    <p className="text-[10px] text-muted-gray mt-0.5">توزيع حجم الطلبات والأرباح حسب عناوين الشحن.</p>
                  </div>

                  {citySales.length === 0 ? (
                    <p className="text-xs text-muted-gray text-center py-8">لا توجد بيانات جغرافية للطلبات بعد.</p>
                  ) : (
                    <div className="space-y-3">
                      {citySales.map((c, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <div className="text-left font-mono text-muted-gray">
                              <span className="font-bold text-charcoal">{c.revenue.toLocaleString('ar-EG')} ج.م</span>
                              <span className="mr-1.5 text-[10px]">({c.count} طلبات)</span>
                            </div>
                            <span className="font-bold text-charcoal">{c.city}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary/75 h-full rounded-full" 
                              style={{ width: `${totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 0.5: LABELS & QR PRINTING */}
          {activeTab === 'labels' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-l from-emerald-500/10 to-transparent p-5 rounded-2xl border-r-4 border-emerald-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-right">
                  <h3 className="text-base sm:text-lg font-black text-emerald-900 flex items-center gap-2 justify-end">
                    <QrCode className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span>طباعة ملصقات الباركود والـ QR Code للمنتجات</span>
                  </h3>
                  <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                    قم بتوليد ملصقات مخصصة لكل منتج تحتوي على رمز الاستجابة السريعة (QR Code) الذي يفتح صفحة المنتج مباشرة في المتجر عند مسحه بالهاتف، بالإضافة للرقم التسلسلي (سيريال) لحصر معروضات المحل.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleGenerateMissingSerials}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 self-end md:self-auto cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <span>توليد تلقائي للأرقام التسلسلية المفقودة</span>
                </button>
              </div>

              {/* Filters & Mode Selection */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">ابحث باسم المنتج أو السيريال</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={labelSearch}
                      onChange={(e) => setLabelSearch(e.target.value)}
                      placeholder="ابحث هنا..."
                      className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-right font-medium"
                    />
                  </div>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="text-xs font-black text-charcoal block mb-1 font-sans">تصفية حسب القسم</label>
                  <select
                    value={labelFilterCategory}
                    onChange={(e) => setLabelFilterCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-right font-bold cursor-pointer"
                  >
                    <option value="all">كل الأقسام</option>
                    <option value="mattresses">مراتب طبية</option>
                    <option value="pillows">مخدات طبية</option>
                    <option value="bedding">مفروشات فندقية</option>
                  </select>
                </div>

                {/* Print Mode */}
                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">طريقة الطباعة للمنتج</label>
                  <select
                    value={labelPrintMode}
                    onChange={(e) => setLabelPrintMode(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-right font-bold cursor-pointer"
                  >
                    <option value="base">ملصق واحد للمنتج (بالسعر الأساسي)</option>
                    <option value="sizes">ملصقات منفصلة لجميع مقاسات المنتج</option>
                  </select>
                </div>

                {/* Print Trigger */}
                <div className="flex items-end">
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-black text-xs py-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    disabled={labelsToPrint.length === 0}
                  >
                    <Printer className="w-4 h-4" />
                    <span>بدء طباعة الملصقات ({labelsToPrint.length})</span>
                  </button>
                </div>
              </div>

              {/* التحكم الفوري في مقاس الباركود والكلام */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-right shadow-sm">
                {/* التحكم في حجم الـ QR */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {(labelQrSizeMultiplier * 100).toFixed(0)}%
                    </span>
                    <label className="text-xs font-black text-charcoal">📏 حجم رمز الـ QR Code</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-gray font-bold">صغير جداً</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={labelQrSizeMultiplier}
                      onChange={(e) => setLabelQrSizeMultiplier(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-gray-100 rounded-lg"
                    />
                    <span className="text-[10px] text-muted-gray font-bold">كبير جداً</span>
                  </div>
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setLabelQrSizeMultiplier(0.7)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${labelQrSizeMultiplier === 0.7 ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-charcoal'}`}
                    >
                      صغير (70%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelQrSizeMultiplier(1.0)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${labelQrSizeMultiplier === 1.0 ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-charcoal'}`}
                    >
                      طبيعي (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelQrSizeMultiplier(1.4)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${labelQrSizeMultiplier === 1.4 ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-charcoal'}`}
                    >
                      كبير (140%)
                    </button>
                  </div>
                </div>

                {/* التحكم في حجم الخط والكلمات */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {(labelTextSizeMultiplier * 100).toFixed(0)}%
                    </span>
                    <label className="text-xs font-black text-charcoal">✍️ حجم خط الكلام والنصوص</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-gray font-bold">صغير جداً</span>
                    <input
                      type="range"
                      min="0.6"
                      max="1.6"
                      step="0.05"
                      value={labelTextSizeMultiplier}
                      onChange={(e) => setLabelTextSizeMultiplier(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-gray-100 rounded-lg"
                    />
                    <span className="text-[10px] text-muted-gray font-bold">كبير جداً</span>
                  </div>
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setLabelTextSizeMultiplier(0.8)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${labelTextSizeMultiplier === 0.8 ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-charcoal'}`}
                    >
                      صغير (80%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelTextSizeMultiplier(1.0)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${labelTextSizeMultiplier === 1.0 ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-charcoal'}`}
                    >
                      طبيعي (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelTextSizeMultiplier(1.3)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${labelTextSizeMultiplier === 1.3 ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-charcoal'}`}
                    >
                      كبير (130%)
                    </button>
                  </div>
                </div>

                {/* خيارات تنسيق وتقسيم الطباعة */}
                <div className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-1.5 mb-1.5">
                      <span className="text-[10px] font-mono font-black text-emerald-700 bg-white border border-emerald-100 px-1.5 py-0.5 rounded-md">جديد</span>
                      <label className="text-xs font-black text-charcoal">⚙️ خيارات تنسيق الطباعة</label>
                    </div>
                    <label className="flex items-center gap-2 justify-end cursor-pointer group select-none">
                      <span className="text-[10px] sm:text-[11px] text-charcoal font-bold group-hover:text-emerald-700 transition-colors">
                        فصل كل منتج في صفحة مستقلة تلقائياً
                      </span>
                      <input
                        type="checkbox"
                        checked={labelSeparateProducts}
                        onChange={(e) => setLabelSeparateProducts(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 shrink-0 accent-emerald-600"
                      />
                    </label>

                    <label className="flex items-center gap-2 justify-end cursor-pointer group select-none">
                      <span className="text-[10px] sm:text-[11px] text-charcoal font-bold group-hover:text-emerald-700 transition-colors">
                        رسم خطوط فاصلة ومقص (✂️) بين المنتجات
                      </span>
                      <input
                        type="checkbox"
                        checked={labelShowCutLines}
                        onChange={(e) => setLabelShowCutLines(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 shrink-0 accent-emerald-600"
                      />
                    </label>
                  </div>
                  <p className="text-[9px] text-emerald-800 leading-relaxed font-medium">
                    يساعدك هذا الإعداد عند طباعة كميات كبيرة، حيث يعزل ملصقات كل صنف لوحده في صفحة جديدة مستقلة أو يضع خطوط قص واضحة تسهيلاً للقص والفرز.
                  </p>
                </div>
              </div>

              {/* Layout Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Right Column: Product Selector (5 cols) */}
                <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedProductIds(filteredProductsForLabels.map(p => p.id))}
                        className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                      >
                        تحديد الكل
                      </button>
                      <span className="text-[10px] text-gray-300">|</span>
                      <button
                        onClick={() => {
                          const filteredIds = filteredProductsForLabels.map(p => p.id);
                          setSelectedProductIds(prev => prev.filter(id => !filteredIds.includes(id)));
                        }}
                        className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                    <span className="font-bold text-xs text-charcoal">اختر المنتجات المراد طباعتها</span>
                  </div>

                  {/* لوحة التحكم الجماعي بالكمية */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex flex-col gap-2 text-right">
                    <span className="text-[11px] font-black text-emerald-800">⚡ التحكم الجماعي بالكمية (للعدد المحدد):</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyBulkQuantity}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        تطبيق العدد على الكل المحدد ({selectedProductIds.length})
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={bulkQuantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setBulkQuantity(isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className="w-full text-center text-xs font-black text-charcoal font-mono bg-white border border-gray-200 rounded-lg py-1 px-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        placeholder="الكمية..."
                      />
                    </div>
                    <p className="text-[9px] text-emerald-700/80 leading-relaxed">أدخل الرقم بالأعلى ثم اضغط "تطبيق" لتعيين نفس العدد دفعة واحدة لكل المنتجات التي حددتها.</p>
                  </div>

                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {filteredProductsForLabels.length === 0 ? (
                      <p className="text-center py-8 text-muted-gray text-xs">لا توجد منتجات مطابقة للبحث حالياً.</p>
                    ) : (
                      filteredProductsForLabels.map(p => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setSelectedProductIds(prev => [...prev, p.id]);
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected ? 'border-primary/50 bg-primary/5' : 'border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="rounded text-primary focus:ring-primary cursor-pointer w-4 h-4"
                              />
                              
                              {/* معداد النسخ المطبوعة */}
                              <div 
                                className={`flex items-center border border-gray-200 rounded-lg bg-gray-50/50 p-0.5 gap-1 transition-all ${isSelected ? 'opacity-100 scale-100 font-bold' : 'opacity-40 pointer-events-none scale-95'}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLabelQuantities(prev => ({
                                      ...prev,
                                      [p.id]: Math.max(1, (prev[p.id] || 1) - 1)
                                    }));
                                  }}
                                  className="w-5 h-5 rounded bg-white hover:bg-gray-100 text-charcoal border border-gray-200 flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-sm shrink-0"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={labelQuantities[p.id] !== undefined ? labelQuantities[p.id] : 1}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLabelQuantities(prev => ({
                                      ...prev,
                                      [p.id]: isNaN(val) ? 1 : Math.max(1, val)
                                    }));
                                    if (!isSelected) {
                                      setSelectedProductIds(prev => [...prev, p.id]);
                                    }
                                  }}
                                  className="w-9 h-5 text-center text-[10px] font-black text-charcoal font-mono bg-white border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:outline-none focus:border-primary shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLabelQuantities(prev => ({
                                      ...prev,
                                      [p.id]: (prev[p.id] || 1) + 1
                                    }));
                                    if (!isSelected) {
                                      setSelectedProductIds(prev => [...prev, p.id]);
                                    }
                                  }}
                                  className="w-5 h-5 rounded bg-white hover:bg-gray-100 text-charcoal border border-gray-200 flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-sm shrink-0"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5 text-right flex-1 justify-end pr-3">
                              <div>
                                <h4 className="font-bold text-xs text-charcoal">{p.name}</h4>
                                <div className="flex items-center gap-1.5 justify-end mt-1">
                                  {p.serialNumber ? (
                                    <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {p.serialNumber}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                      بدون سيريال
                                    </span>
                                  )}
                                  <span className="text-[9px] text-muted-gray">
                                    {(p.sizes || []).length > 0 ? `(${p.sizes?.length} مقاسات)` : 'مقاس موحد'}
                                  </span>
                                </div>
                              </div>
                              <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Left Column: Live Print Sheet Preview (7 cols) */}
                <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-charcoal">👀 معاينة حية للملصقات قبل الطباعة</h4>
                    <p className="text-[10px] text-muted-gray mt-0.5">توضح هذه اللوحة كيف ستظهر الملصقات المطبوعة. يمكنك الضغط على "بدء طباعة الملصقات" بالأعلى لإرسالها للطابعة فوراً.</p>
                  </div>

                  {labelsToPrint.length === 0 ? (
                    <div className="text-center py-16 text-muted-gray border-2 border-dashed border-gray-100 rounded-2xl space-y-2">
                      <QrCode className="w-12 h-12 text-gray-300 mx-auto" />
                      <p className="text-xs">الرجاء اختيار منتج واحد على الأقل من القائمة اليمنى لرؤية معاينة ملصقاته هنا.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 max-h-[500px] overflow-y-auto space-y-4">
                      {/* Live Preview Sticker Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {labelsToPrint.map((lbl, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-3 shadow-sm flex flex-col justify-between min-h-[160px] h-auto text-right relative overflow-hidden transition-all group"
                          >
                            {/* Delete single button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductIds(prev => prev.filter(id => id !== lbl.id));
                              }}
                              className="absolute top-1 left-1 w-5 h-5 bg-red-50 hover:bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                              title="استبعاد من هذه الطباعة"
                            >
                              ✕
                            </button>

                            {/* Tag Top Brand */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-1.5 mb-1.5">
                              <div>
                                <h5 className="font-black text-emerald-800" style={{ fontSize: `${10 * labelTextSizeMultiplier}px` }}>موربيدو | Morbido</h5>
                                <p className="text-muted-gray" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>للمراتب والمفروشات الفاخرة</p>
                              </div>
                              <span className="font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>
                                {lbl.serialNumber}
                              </span>
                            </div>

                            {/* Body layout */}
                            <div className="flex justify-between items-center gap-2 flex-1">
                              {/* Left QR Code image */}
                              <div className="shrink-0 flex flex-col items-center">
                                {lbl.qrUrl ? (
                                  <img 
                                    src={lbl.qrUrl} 
                                    alt="Product QR" 
                                    className="border border-gray-100 rounded p-0.5 object-contain" 
                                    style={{ width: `${64 * labelQrSizeMultiplier}px`, height: `${64 * labelQrSizeMultiplier}px` }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="bg-gray-50 border border-gray-100 rounded flex items-center justify-center" style={{ width: `${64 * labelQrSizeMultiplier}px`, height: `${64 * labelQrSizeMultiplier}px` }}>
                                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                                  </div>
                                )}
                                <span className="text-muted-gray mt-0.5 font-sans" style={{ fontSize: `${7 * labelTextSizeMultiplier}px` }}>امسح للمعاينة</span>
                              </div>

                              {/* Right details */}
                              <div className="flex-1 space-y-1 pr-1">
                                <h4 className="font-black text-charcoal line-clamp-2" style={{ fontSize: `${11 * labelTextSizeMultiplier}px` }}>{lbl.name}</h4>
                                <p className="text-gray-700 font-bold" style={{ fontSize: `${9 * labelTextSizeMultiplier}px` }}>
                                  {lbl.sizeName ? `المقاس: ${lbl.sizeName}` : 'مقاس موحد / قياسي'}
                                </p>
                                <p className="text-muted-gray line-clamp-1" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>{lbl.warranty}</p>
                              </div>
                            </div>

                            {/* Tag Footer */}
                            <div className="flex justify-between items-center border-t border-gray-100 pt-1.5 mt-2">
                              <span className="text-emerald-600 font-black" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>ضمان حقيقي ١٠ سنوات</span>
                              <div className="text-left flex items-baseline gap-0.5">
                                <span className="font-black text-emerald-700" style={{ fontSize: `${12 * labelTextSizeMultiplier}px` }}>{lbl.price.toLocaleString('ar-EG')}</span>
                                <span className="text-gray-700" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>ج.م</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* FULL SCALE PRINT GRID ISOLATOR - ONLY SHOWN IN BROWSER PRINT PREVIEW */}
              {typeof document !== 'undefined' && createPortal(
                <div id="morbido-print-portal" className="hidden print:block fixed inset-0 bg-white z-[999999] p-8 text-black overflow-visible dir-rtl text-right">
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      /* Hide EVERYTHING on the page except our print portal */
                      body > :not(#morbido-print-portal) {
                        display: none !important;
                      }
                      /* Show ONLY this printable layout */
                      #morbido-print-portal {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                      }
                      html, body {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        font-family: system-ui, -apple-system, sans-serif !important;
                      }
                      @page {
                        size: A4 portrait;
                        margin: 1.5cm;
                      }
                      .break-before-page {
                        page-break-before: always !important;
                        break-before: page !important;
                      }
                      .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                      }
                    }
                  `}} />
                  
                  <div className="w-full">
                    {/* Decorative header print */}
                    <div className="text-center border-b-2 border-gray-800 pb-3 mb-6">
                      <h2 className="text-xl font-black tracking-widest text-gray-900">ملصقات بضاعة معرض موربيدو الفاخرة</h2>
                      <p className="text-xs text-gray-600 mt-1">توليد تلقائي - تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Grouped High Quality Labels */}
                    <div className="space-y-6">
                      {groupedLabelsToPrint.map((group, groupIdx) => (
                        <div 
                          key={group.productId} 
                          className={`w-full ${labelSeparateProducts && groupIdx > 0 ? 'break-before-page pt-4' : ''}`}
                        >
                          {/* separation header between products in print view */}
                          <div className="border-b-2 border-gray-400 pb-1.5 mb-4 text-right flex justify-between items-center print:border-black">
                            <span className="text-xs font-black text-gray-900 bg-gray-150 px-2.5 py-1 rounded border border-gray-300 font-sans">
                              📦 الصنف {groupIdx + 1} من {groupedLabelsToPrint.length}: {group.productName}
                            </span>
                            <span className="text-[10px] font-bold text-gray-600 font-sans">
                              الكمية المطبوعة: {group.labels.length} ملصق
                            </span>
                          </div>

                          {/* High Quality Labels Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            {group.labels.map((lbl, idx) => (
                              <div 
                                key={idx} 
                                className="border-2 border-dashed border-gray-400 p-4 rounded-xl bg-white text-black flex flex-col justify-between min-h-[170px] h-auto w-full relative overflow-hidden break-inside-avoid shadow-none"
                              >
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-2">
                                  <div>
                                    <h4 className="font-black text-gray-900" style={{ fontSize: `${12 * labelTextSizeMultiplier}px` }}>موربيدو | Morbido</h4>
                                    <p className="text-gray-500" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>للمراتب والمفروشات الفاخرة</p>
                                  </div>
                                  <span className="font-mono font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded uppercase border border-gray-200" style={{ fontSize: `${9 * labelTextSizeMultiplier}px` }}>
                                    S/N: {lbl.serialNumber}
                                  </span>
                                </div>

                                {/* Middle Content */}
                                <div className="flex justify-between items-center gap-3 my-2 flex-1">
                                  {/* QR */}
                                  <div className="shrink-0">
                                    {lbl.qrUrl ? (
                                      <img 
                                        src={lbl.qrUrl} 
                                        alt="QR Code" 
                                        className="border border-gray-200 rounded p-1 object-contain" 
                                        style={{ width: `${72 * labelQrSizeMultiplier}px`, height: `${72 * labelQrSizeMultiplier}px` }}
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="bg-gray-100 rounded flex items-center justify-center text-gray-400 border border-gray-200" style={{ width: `${72 * labelQrSizeMultiplier}px`, height: `${72 * labelQrSizeMultiplier}px`, fontSize: `${8 * labelTextSizeMultiplier}px` }}>
                                        جاري التوليد...
                                      </div>
                                    )}
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 space-y-1.5 pr-2">
                                    <h5 className="font-black text-gray-900 leading-snug" style={{ fontSize: `${12 * labelTextSizeMultiplier}px` }}>{lbl.name}</h5>
                                    <p className="text-gray-800 font-extrabold" style={{ fontSize: `${10 * labelTextSizeMultiplier}px` }}>
                                      {lbl.sizeName ? `المقاس: ${lbl.sizeName}` : 'مقاس موحد / قياسي'}
                                    </p>
                                    <p className="text-gray-500 font-bold" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>{lbl.warranty}</p>
                                  </div>
                                </div>

                                {/* Bottom Tag Footer */}
                                <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                                  <span className="text-gray-600 font-bold" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>صنع في مصر بكل فخر للضمان والراحة</span>
                                  <div className="text-left flex items-baseline gap-0.5">
                                    <span className="font-black text-black" style={{ fontSize: `${14 * labelTextSizeMultiplier}px` }}>{lbl.price.toLocaleString('ar-EG')}</span>
                                    <span className="text-gray-800 font-bold" style={{ fontSize: `${8 * labelTextSizeMultiplier}px` }}>ج.م</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Cut line divider for printing separation if not breaking page */}
                          {labelShowCutLines && (!labelSeparateProducts || groupIdx < groupedLabelsToPrint.length - 1) && (
                            <div className="w-full my-6 text-center relative flex items-center justify-center break-inside-avoid">
                              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t-2 border-dashed border-gray-400 print:border-black"></div>
                              </div>
                              <span className="relative px-3 bg-white text-[10px] font-black text-gray-700 print:text-black uppercase tracking-wider font-sans">
                                ✂️ خط قص وفصل ملصقات المنتج التالي
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-[10px] text-gray-400 mt-8 border-t pt-3 border-gray-200">شركة موربيدو للمراتب والمفروشات - نظام إدارة ومراقبة المخازن والمبيعات المطور</p>
                  </div>
                </div>,
                document.body
              )}

            </div>
          )}

          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  onClick={fetchOrders}
                  disabled={loadingOrders}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-charcoal hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  تحديث الطلبات
                </button>

                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="ابحث برقم الطلب، اسم العميل، الموبايل..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white text-right"
                  />
                </div>
              </div>

              {loadingOrders ? (
                <div className="text-center py-12 text-muted-gray text-xs sm:text-sm">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
                  جاري تحميل الطلبات والمبيعات الحالية...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-gray border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold">لا يوجد أي طلبات واردة مطابقة للبحث حالياً.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((o) => (
                    <div 
                      key={o.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-primary/30 transition-all text-xs sm:text-sm space-y-3"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-gray-100">
                        <div>
                          <span className="bg-gray-100 text-charcoal px-2.5 py-1 rounded-lg font-black font-mono">
                            {o.id}
                          </span>
                          <span className="mr-2 text-[11px] text-muted-gray">
                            {o.createdAt || 'تاريخ غير معروف'}
                          </span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            o.paymentMethod === 'fawaiterk' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {o.paymentMethod === 'fawaiterk' ? '💳 فواتيرك' : '💵 كاش عند الاستلام'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            o.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.paymentStatus === 'paid' ? 'تم الدفع' : 'بانتظار الدفع'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <p className="text-muted-gray text-[11px]">بيانات العميل:</p>
                          <p className="font-extrabold text-charcoal mt-0.5">{o.customerName}</p>
                          <p className="text-[#004D95] font-bold font-mono mt-0.5">{o.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-gray text-[11px]">عنوان التوصيل:</p>
                          <p className="font-bold text-charcoal mt-0.5">{o.city}</p>
                          <p className="text-muted-gray text-xs mt-0.5">{o.address}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-muted-gray text-[11px] text-right md:text-left">المبلغ الإجمالي:</p>
                          <p className="text-lg font-black text-primary mt-0.5">{o.total.toLocaleString('ar-EG')} جنيه</p>
                        </div>
                      </div>

                      {/* Item descriptions with quantities and chosen sizes */}
                      <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 space-y-1.5">
                        <p className="font-black text-charcoal text-[11px] mb-1">تفاصيل المشتريات:</p>
                        {o.items && o.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-primary font-bold">
                              {(item.product?.price * item.quantity).toLocaleString('ar-EG')} جنيه
                            </span>
                            <span className="text-charcoal font-medium">
                              • {item.product?.name}
                              {item.selectedSize && (
                                <span className="bg-[#004D95]/10 text-[#004D95] px-1.5 py-0.5 rounded font-black text-[10px] mr-1">
                                  مقاس: {item.selectedSize}
                                </span>
                              )}
                              <span className="text-muted-gray mr-1">({item.quantity}×)</span>
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Cache and Performance Management Card */}
              {cacheMetadata && (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-right flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#49B2A4]/10 text-[#49B2A4] flex items-center justify-center shrink-0">
                      <RefreshCw className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-charcoal">🚀 الذاكرة المؤقتة الذكية لمنتجات المتجر (Product Cache)</h4>
                      <p className="text-[11px] text-muted-gray mt-0.5">
                        تم تفعيل التخزين المؤقت المحلي بنجاح لجعل تحميل المنتجات فائقة السرعة ({cacheMetadata.source === 'cache' ? 'محملة بالكامل من الكاش ⚡' : 'تم التحقق والدمج حديثاً'}).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto">
                    <div className="text-right text-[10px] bg-white border border-gray-100 rounded-lg p-2 flex gap-4">
                      <div>
                        <span className="text-muted-gray">إصدار الكاش:</span>
                        <span className="font-mono font-bold text-primary block">{cacheMetadata.version}</span>
                      </div>
                      <div>
                        <span className="text-muted-gray">سعة التخزين:</span>
                        <span className="font-mono font-bold text-[#49B2A4] block">{cacheMetadata.sizeKb} KB</span>
                      </div>
                      <div>
                        <span className="text-muted-gray">عدد المنتجات:</span>
                        <span className="font-mono font-bold text-charcoal block">{cacheMetadata.productCount}</span>
                      </div>
                    </div>

                    {onForceResetCache && (
                      <button
                        onClick={onForceResetCache}
                        className="bg-white hover:bg-gray-100 text-red-600 border border-gray-200 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        title="إعادة تهيئة الكاش لمزامنة الكود والبيانات وحذف التكرار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>تفريغ ومزامنة الكاش</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!isAddingNew && !editingProduct ? (
                // Products List Wrapper
                <div className="space-y-6">
                  
                  {/* Top Control Bar with Manual Add & Excel Import Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-right">
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={handleStartAdd}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/10 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج يدوياً</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowExcelUploader(!showExcelUploader);
                          if (!showExcelUploader) {
                            setExcelPreviewList([]);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                          showExcelUploader 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                            : 'bg-white hover:bg-gray-50 text-charcoal border-gray-200 shadow-sm'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>استيراد جماعي من إكسل (Excel)</span>
                      </button>
                    </div>
                    
                    <h3 className="font-extrabold text-charcoal text-sm sm:text-base order-first sm:order-last">
                      المنتجات الحالية بالمتجر ({products.length})
                    </h3>
                  </div>

                  {/* Excel Upload and Preview Tool */}
                  {showExcelUploader && (
                    <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200/60 p-5 space-y-5 animate-in fade-in slide-in-from-top-3 duration-300 text-right">
                      
                      {/* Section Title & Description */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-100 pb-3">
                        <div className="text-right">
                          <h4 className="font-black text-emerald-900 text-sm sm:text-base flex items-center gap-1.5 justify-end">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            <span>استيراد المنتجات دفعة واحدة عبر ملف Excel / CSV</span>
                          </h4>
                          <p className="text-xs text-emerald-800/80 mt-1">
                            يمكنك رفع ملف إكسل يحتوي على تفاصيل المنتجات، الصور، الضمان والمقاسات بالأسعار لتحديث المتجر بلحظة واحدة!
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تحميل نموذج ملف إكسل (.xlsx)</span>
                        </button>
                      </div>

                      {/* File Drag & Drop Field */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* Guidance Guide Card */}
                        <div className="md:col-span-1 bg-white p-4 rounded-xl border border-emerald-100 space-y-3 text-xs leading-relaxed">
                          <h5 className="font-bold text-emerald-900 flex items-center gap-1 justify-end">
                            <AlertTriangle className="w-4 h-4 text-emerald-600" />
                            <span>تعليمات تنسيق ملف الإكسل:</span>
                          </h5>
                          <ul className="space-y-1.5 text-right text-gray-700 list-disc list-inside">
                            <li><strong>اسم المنتج:</strong> الاسم المعروض للمشتري.</li>
                            <li><strong>القسم:</strong> (مراتب / مخدات / مفروشات).</li>
                            <li><strong>السعر:</strong> السعر الحالي (رقم بالإنجليزية أو العربية).</li>
                            <li><strong>السعر القديم:</strong> السعر قبل الخصم (اختياري).</li>
                            <li><strong>الضمان:</strong> مدة الضمان (مثال: ضمان ١٠ سنوات).</li>
                            <li><strong>رابط الصورة:</strong> رابط مباشر ومفتوح لصورة المنتج.</li>
                            <li><strong>المقاسات والأسعار:</strong> اكتب المقاس متبوعاً بنقطتين ثم السعر وافصل بـ <code className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded">|</code>.
                              <p className="text-[10px] text-muted-gray mt-1 leading-snug">
                                مثال: <code className="bg-emerald-50/80 text-emerald-800 font-mono text-[10px] px-1 rounded block mt-0.5 dir-ltr text-left">160x200: 4500 | 180x200: 5200</code>
                              </p>
                            </li>
                          </ul>
                        </div>

                        {/* File Upload Zone */}
                        <div className="md:col-span-2 flex flex-col justify-center items-center border-2 border-dashed border-emerald-300 rounded-xl p-6 bg-white hover:bg-emerald-50/20 transition-all relative">
                          <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleExcelUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <UploadCloud className="w-12 h-12 text-emerald-600 mb-2.5 animate-bounce" />
                          <p className="font-extrabold text-emerald-900 text-xs sm:text-sm">اسحب وأفلت ملف الإكسل هنا، أو اضغط للتصفح</p>
                          <p className="text-[11px] text-muted-gray mt-1">يدعم صيغ .xlsx و .xls و .csv</p>
                        </div>

                      </div>

                      {/* EXCEL PREVIEW TABLE */}
                      {excelPreviewList.length > 0 && (
                        <div className="bg-white rounded-xl border border-emerald-100 p-4 space-y-4 animate-in fade-in duration-300 text-right">
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-gray-100">
                            <div className="text-right">
                              <h5 className="font-bold text-gray-800 text-xs sm:text-sm">🔍 معاينة المنتجات التي تم تحليلها ({excelPreviewList.length})</h5>
                              <p className="text-[10px] text-muted-gray mt-0.5">يرجى التأكد من صحة البيانات قبل الضغط على زر الحفظ النهائي للمتجر.</p>
                            </div>
                            
                            {/* Import mode and confirmation actions */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              {/* Import mode selector */}
                              <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-bold gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setImportMode('append')}
                                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                    importMode === 'append' ? 'bg-primary text-white shadow-sm' : 'text-charcoal hover:bg-gray-200'
                                  }`}
                                >
                                  إضافة للمتجر
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setImportMode('replace')}
                                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                    importMode === 'replace' ? 'bg-red-600 text-white shadow-sm' : 'text-charcoal hover:bg-gray-200'
                                  }`}
                                  title="حذف جميع المنتجات الحالية واستبدالها بالكامل"
                                >
                                  استبدال ومسح القديم
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={handleConfirmImport}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>حفظ وتثبيت المنتجات بالمتجر الآن</span>
                              </button>
                            </div>
                          </div>

                          {/* Table structure responsive wrapper */}
                          <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-charcoal font-black">
                                  <th className="p-2.5 text-center">الصورة</th>
                                  <th className="p-2.5">اسم المنتج</th>
                                  <th className="p-2.5">القسم</th>
                                  <th className="p-2.5">السعر الفعلي</th>
                                  <th className="p-2.5">السعر القديم</th>
                                  <th className="p-2.5">الضمان</th>
                                  <th className="p-2.5">المقاسات المكتشفة</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {excelPreviewList.map((ep, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="p-2 flex justify-center">
                                      <div className="w-10 h-10 rounded overflow-hidden border border-gray-100">
                                        <img src={ep.imageUrl} alt={ep.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                    </td>
                                    <td className="p-2.5 font-bold text-charcoal">{ep.name}</td>
                                    <td className="p-2.5 text-muted-gray">
                                      <span className="bg-gray-100 text-charcoal px-2 py-0.5 rounded text-[10px] font-medium">
                                        {CATEGORIES.find(c => c.id === ep.category)?.name || ep.category}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-bold font-mono text-primary">{ep.price.toLocaleString('ar-EG')} ج.م</td>
                                    <td className="p-2.5 font-mono text-gray-400 line-through">
                                      {ep.oldPrice ? `${ep.oldPrice.toLocaleString('ar-EG')} ج.م` : '—'}
                                    </td>
                                    <td className="p-2.5 text-emerald-800 font-bold">{ep.specs['الضمان'] || '—'}</td>
                                    <td className="p-2.5">
                                      {ep.sizes && ep.sizes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {ep.sizes.map((sz, sIdx) => (
                                            <span key={sIdx} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black text-[9px]">
                                              {sz.size} ({sz.price.toLocaleString('ar-EG')})
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">سعر موحد</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((p) => (
                      <div 
                        key={p.id}
                        className="border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3.5 bg-white hover:shadow-md transition-all text-center sm:text-right items-center sm:items-start"
                      >
                        <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <div className="flex-1 w-full flex flex-col justify-between">
                          <div>
                            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-1">
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold order-2 sm:order-1">
                                {CATEGORIES.find(c => c.id === p.category)?.name || p.category}
                              </span>
                              <h4 className="font-extrabold text-charcoal text-xs sm:text-sm line-clamp-1 flex-1 pr-0 sm:pr-2 order-1 sm:order-2">
                                {p.name}
                              </h4>
                            </div>

                            <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
                              <span className="font-bold text-primary text-xs sm:text-sm font-mono">
                                {p.price.toLocaleString('ar-EG')} جنيه
                              </span>
                              {p.oldPrice && (
                                <span className="text-gray-400 text-xs line-through font-mono">
                                  {p.oldPrice.toLocaleString('ar-EG')} جنيه
                                </span>
                              )}
                            </div>

                            {/* Show sizes count */}
                            {p.sizes && p.sizes.length > 0 ? (
                              <p className="text-[10px] text-teal-600 font-bold mt-1 text-center sm:text-right">
                                🌟 يحتوي على ({p.sizes.length}) مقاسات مختلفة مخصصة السعر
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-gray mt-1 text-center sm:text-right">
                                سعر موحد لجميع المقاسات
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 justify-center sm:justify-end border-t border-gray-50 pt-2 mt-2 w-full">
                            {!isDesigner && (
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                                title="حذف المنتج نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-charcoal text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>{isDesigner ? 'تعديل وصف المنتج' : 'تعديل المنتج / المقاسات'}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Product Edit / Add Form
                <form onSubmit={handleSaveProductForm} className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <button
                      type="button"
                      onClick={() => { setEditingProduct(null); setIsAddingNew(false); }}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-charcoal hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      إلغاء والعودة للقائمة
                    </button>
                    <h3 className="font-extrabold text-charcoal text-sm sm:text-base">
                      {isAddingNew ? 'إضافة منتج جديد كلياً للمتجر' : `تعديل منتج: ${prodName}`}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    
                    {/* Right column: Main fields */}
                    <div className="space-y-4">
                      {isDesigner && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-bold leading-relaxed">
                          ⚠️ بصفتك مصمم الموقع، تقتصر صلاحياتك في لوحة تحكم المنتجات على تعديل وصف المنتج فقط. جميع الحقول والأسعار الأخرى مقفلة وغير قابلة للتعديل.
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-black text-charcoal block mb-1">اسم المنتج الفاخر *</label>
                        <input
                          type="text"
                          required
                          disabled={isDesigner}
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="مثال: مرتبة موربيدو سوفت الطبية"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-black text-charcoal block mb-1">السعر الأساسي (ج.م) *</label>
                          <input
                            type="number"
                            required
                            disabled={isDesigner}
                            min={1}
                            value={prodPrice}
                            onChange={(e) => setProdPrice(Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-black text-charcoal block mb-1">السعر قبل الخصم (اختياري)</label>
                          <input
                            type="number"
                            disabled={isDesigner}
                            value={prodOldPrice || ''}
                            onChange={(e) => setProdOldPrice(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-black text-charcoal block mb-1">القسم / التصنيف *</label>
                          <select
                            value={prodCategory}
                            disabled={isDesigner}
                            onChange={(e) => setProdCategory(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-bold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <option value="mattresses">مراتب طبية</option>
                            <option value="pillows">مخدات طبية</option>
                            <option value="bedding">مفروشات فندقية</option>
                            <option value="best-sellers">الأكثر مبيعاً</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-black text-charcoal block mb-1">شارة ملونة مميزة (Tag)</label>
                          <input
                            type="text"
                            disabled={isDesigner}
                            value={prodTag}
                            onChange={(e) => setProdTag(e.target.value)}
                            placeholder="مثال: خصم ٤٠٪ ، مريح جداً"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-charcoal block mb-1">رابط صورة المنتج (URL) *</label>
                        <input
                          type="text"
                          required
                          disabled={isDesigner}
                          value={prodImageUrl}
                          onChange={(e) => setProdImageUrl(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-left font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-charcoal block mb-1">الرقم التسلسلي الفريد للقطع (S/N) *</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isDesigner}
                            onClick={() => setProdSerialNumber(`MRB-${prodCategory.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`)}
                            className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            توليد تلقائي
                          </button>
                          <input
                            type="text"
                            required
                            disabled={isDesigner}
                            value={prodSerialNumber}
                            onChange={(e) => setProdSerialNumber(e.target.value.toUpperCase())}
                            placeholder="مثال: MRB-MAT-A7F49"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-left font-mono font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[10px] text-muted-gray mt-1">يُطبع هذا الرمز على ملصق المنتج أو الـ QR Code لربط المعروض الفعلي بمتجرك الإلكتروني.</p>
                      </div>

                      <div>
                        <label className="text-xs font-black text-charcoal block mb-1">وصف المنتج ومميزاته بالتفصيل *</label>
                        <textarea
                          required
                          rows={4}
                          value={prodDescription}
                          onChange={(e) => setProdDescription(e.target.value)}
                          placeholder="اكتب هنا شرحاً جذاباً ومفصلاً للمنتج ومكوناته..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-medium"
                        />
                      </div>
                    </div>

                    {/* Left column: Dynamic Sizes management */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                      <div>
                        <h4 className="font-extrabold text-charcoal text-xs sm:text-sm">
                          📏 إضافة وتعديل مقاسات وأسعار المنتج
                        </h4>
                        <p className="text-[11px] text-muted-gray mt-1">
                          يمكنك تحديد مقاس مخصص لكل منتج (خاصة المراتب) وربط كل مقاس بسعر خاص ومستقل!
                        </p>
                      </div>

                      {/* Sizes list */}
                      <div className="bg-white rounded-xl p-3 border border-gray-200 space-y-2 max-h-48 overflow-y-auto">
                        <span className="text-[10px] font-black text-charcoal block border-b pb-1.5 mb-1.5">
                          المقاسات المسجلة حالياً ({prodSizes.length}):
                        </span>
                        {prodSizes.length === 0 ? (
                          <p className="text-xs text-muted-gray text-center py-4">لا يوجد مقاسات مخصصة مضافة بعد لهذا المنتج.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {prodSizes.map((sz, i) => (
                              <div key={i} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                                {!isDesigner && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSizeOption(i)}
                                    className="text-red-500 hover:text-red-600 cursor-pointer"
                                    title="حذف هذا المقاس"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <div className="text-right flex items-center gap-1.5">
                                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                                    {sz.price.toLocaleString('ar-EG')} ج.م
                                  </span>
                                  {sz.oldPrice && (
                                    <span className="text-gray-400 line-through text-[10px]">
                                      {sz.oldPrice.toLocaleString('ar-EG')}
                                    </span>
                                  )}
                                  <span className="font-extrabold text-charcoal">{sz.size}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add new size input tool */}
                      {!isDesigner ? (
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                          <span className="text-[11px] font-black text-charcoal block">إضافة مقاس مخصص جديد:</span>
                          
                          <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200">
                            <div>
                              <label className="text-[10px] font-bold text-muted-gray block mb-0.5">المقاس / الأبعاد</label>
                              <input
                                type="text"
                                value={newSizeName}
                                onChange={(e) => setNewSizeName(e.target.value)}
                                placeholder="مثال: ١٦0 × ٢٠٠ سم"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-right"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-muted-gray block mb-0.5">السعر (ج.م)</label>
                                <input
                                  type="number"
                                  value={newSizePrice || ''}
                                  onChange={(e) => setNewSizePrice(Number(e.target.value))}
                                  placeholder="مثال: 4500"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-right"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-muted-gray block mb-0.5">السعر قبل (اختياري)</label>
                                <input
                                  type="number"
                                  value={newSizeOldPrice || ''}
                                  onChange={(e) => setNewSizeOldPrice(e.target.value ? Number(e.target.value) : undefined)}
                                  placeholder="مثال: 5800"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-right"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleAddSizeOption}
                              className="w-full bg-[#004D95] hover:bg-[#00386E] text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer mt-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              إدراج هذا المقاس للمنتج
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-right leading-relaxed">
                          💡 بصفتك مصمم الموقع، لا تملك صلاحية تعديل أو إضافة المقاسات والأسعار الخاصة بالمنتج. يمكنك فقط تعديل النص والوصف الترويجي للمنتج لمساعدتك في صياغة المحتوى بالشكل الأنسب.
                        </div>
                      )}

                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setEditingProduct(null); setIsAddingNew(false); }}
                      className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold text-xs sm:text-sm text-charcoal hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                    >
                      {isAddingNew ? 'إضافة المنتج للمتجر الآن' : 'حفظ وتثبيت تعديلات المنتج'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* TAB 3: TELEGRAM */}
          {activeTab === 'telegram' && (
            <div className="space-y-6 max-w-xl mx-auto text-right">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-2">
                <h4 className="font-black text-primary text-sm sm:text-base">ربط إشعارات المبيعات بتطبيق تلجرام (Telegram)</h4>
                <p className="text-xs sm:text-sm text-muted-gray leading-relaxed">
                  بمجرد إضافة توكن بوت التلجرام ومعرف الشات الخاص بقناتك أو حسابك، ستصلك كافة الطلبات الجديدة وتفاصيلها (سواء كاش عند الاستلام أو بالبطاقة الائتمانية) لحظة بلحظة مع نغمة التنبيه!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">توكن بوت التلجرام (Telegram Bot Token)</label>
                  <input
                    type="text"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-left font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">معرف شات التلجرام (Telegram Chat ID)</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="مثال: -100123456789 أو 123456789"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-left font-mono"
                  />
                  <span className="text-[10px] text-muted-gray mt-1 block">
                    * تأكد من إدخال البوت كمسؤول (Admin) في القناة أو المجموعة، أو بدء محادثة مباشرة معه أولاً إذا كان حساب شخصي.
                  </span>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="flex-1 border border-primary hover:bg-primary/5 text-primary py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${testingTelegram ? 'animate-spin' : ''}`} />
                    <span>إرسال رسالة تجريبية للبوت</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTelegram}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ وتفعيل الإعدادات</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-md mx-auto text-right">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-black text-charcoal text-sm sm:text-base flex items-center gap-1.5 justify-end">
                  <Shield className="w-5 h-5 text-primary" />
                  بيانات حماية لوحة التحكم
                </h4>
                <p className="text-xs text-muted-gray leading-relaxed">
                  يمكنك تغيير الهاتف وكلمة المرور المخصصة للدخول للأدمن لضمان سرية طلبات وبيانات متجرك.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">رقم موبايل الأدمن الجديد</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="رقم موبايل الأدمن"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">كلمة المرور الجديدة للأدمن</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="كلمة المرور الجديدة"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleSaveSecurity}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>حفظ بيانات الأدمن الجديدة</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DESIGNER SECURITY */}
          {activeTab === 'designer_security' && (
            <div className="space-y-6 max-w-md mx-auto text-right animate-in fade-in duration-300">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-2">
                <h4 className="font-black text-primary text-sm sm:text-base flex items-center gap-1.5 justify-end">
                  <Key className="w-5 h-5 text-primary" />
                  أمان وحماية حساب المصمم
                </h4>
                <p className="text-xs text-muted-gray leading-relaxed">
                  يمكنك تعديل رقم الموبايل وكلمة المرور المخصصة لدخول لوحة تحكم المصمم لضمان حماية النصوص وتعديلاتك على الموقع.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">رقم موبايل المصمم الجديد</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={designerPhone}
                      onChange={(e) => setDesignerPhone(e.target.value)}
                      placeholder="رقم موبايل المصمم"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-charcoal block mb-1">كلمة المرور الجديدة للمصمم</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={designerPassword}
                      onChange={(e) => setDesignerPassword(e.target.value)}
                      placeholder="كلمة المرور الجديدة"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white text-right font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleSaveDesignerSecurity}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>حفظ بيانات المصمم الجديدة</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DESIGNER SITE PHRASES */}
          {activeTab === 'designer_phrases' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300">
              <div className="bg-gradient-to-l from-[#004D95]/10 to-transparent p-5 rounded-2xl border-r-4 border-primary flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-charcoal">✏️ إدارة وتعديل نصوص وعبارات الموقع</h3>
                  <p className="text-xs text-muted-gray mt-1">
                    قم بتغيير النصوص الترويجية، العناوين، الأوصاف، وبادجات العروض الظاهرة لعملائك على الواجهة الرئيسية.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSavePhrases}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ نصوص الموقع بالكامل</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Catalog Titles */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                  <h4 className="font-extrabold text-charcoal text-xs sm:text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                    <span>عناوين صفحات أقسام المنتجات (Catalog Titles)</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">العنوان الرئيسي لقسم كل المنتجات (الصفحة الرئيسية)</label>
                      <input
                        type="text"
                        value={phrasesForm.catalog_title_all || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_title_all', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">الوصف الرئيسي لقسم كل المنتجات</label>
                      <textarea
                        rows={2}
                        value={phrasesForm.catalog_desc_all || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_desc_all', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">عنوان قسم المخدات والمفروشات الفندقية</label>
                      <input
                        type="text"
                        value={phrasesForm.catalog_title_pillows || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_title_pillows', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">الوصف الفرعي لقسم المخدات والمفروشات الفندقية</label>
                      <textarea
                        rows={2}
                        value={phrasesForm.catalog_desc_pillows_bedding || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_desc_pillows_bedding', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">عنوان قسم مراتب طبية وسوست منفصلة</label>
                      <input
                        type="text"
                        value={phrasesForm.catalog_title_mattresses || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_title_mattresses', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">عنوان قسم لحف ومفروشات دافئة</label>
                      <input
                        type="text"
                        value={phrasesForm.catalog_title_bedding || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_title_bedding', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-gray block mb-1">عنوان قسم مستلزمات ومفروشات موربيدو</label>
                      <input
                        type="text"
                        value={phrasesForm.catalog_title_other || ''}
                        onChange={(e) => handleUpdatePhraseValue('catalog_title_other', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Banner Slides */}
                <div className="space-y-6">
                  
                  {/* Slide 1 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-charcoal text-xs sm:text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black">العرض 1</span>
                      <span>سلايدر العروض الرئيسي (السلايد الأول)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-0.5">شارة التميز (البادج)</label>
                        <input
                          type="text"
                          value={phrasesForm.slide1_badge || ''}
                          onChange={(e) => handleUpdatePhraseValue('slide1_badge', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-0.5">العنوان الفرعي</label>
                        <input
                          type="text"
                          value={phrasesForm.slide1_subtitle || ''}
                          onChange={(e) => handleUpdatePhraseValue('slide1_subtitle', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-0.5">العنوان العريض (الرئيسي)</label>
                      <input
                        type="text"
                        value={phrasesForm.slide1_title || ''}
                        onChange={(e) => handleUpdatePhraseValue('slide1_title', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-0.5">الوصف الترويجي</label>
                      <textarea
                        rows={2}
                        value={phrasesForm.slide1_description || ''}
                        onChange={(e) => handleUpdatePhraseValue('slide1_description', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium resize-none"
                      />
                    </div>
                  </div>

                  {/* Slide 2 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-charcoal text-xs sm:text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black">العرض 2</span>
                      <span>سلايدر العروض الرئيسي (السلايد الثاني)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-0.5">شارة العرض (البادج)</label>
                        <input
                          type="text"
                          value={phrasesForm.slide2_badge || ''}
                          onChange={(e) => handleUpdatePhraseValue('slide2_badge', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-0.5">العنوان الفرعي</label>
                        <input
                          type="text"
                          value={phrasesForm.slide2_subtitle || ''}
                          onChange={(e) => handleUpdatePhraseValue('slide2_subtitle', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-0.5">العنوان العريض (الرئيسي)</label>
                      <input
                        type="text"
                        value={phrasesForm.slide2_title || ''}
                        onChange={(e) => handleUpdatePhraseValue('slide2_title', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-0.5">الوصف الترويجي</label>
                      <textarea
                        rows={2}
                        value={phrasesForm.slide2_description || ''}
                        onChange={(e) => handleUpdatePhraseValue('slide2_description', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium resize-none"
                      />
                    </div>
                  </div>

                  {/* Slide 3 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-charcoal text-xs sm:text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black">العرض 3</span>
                      <span>سلايدر العروض الرئيسي (السلايد الثالث)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-0.5">شارة التميز (البادج)</label>
                        <input
                          type="text"
                          value={phrasesForm.slide3_badge || ''}
                          onChange={(e) => handleUpdatePhraseValue('slide3_badge', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-0.5">العنوان الفرعي</label>
                        <input
                          type="text"
                          value={phrasesForm.slide3_subtitle || ''}
                          onChange={(e) => handleUpdatePhraseValue('slide3_subtitle', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-0.5">العنوان العريض (الرئيسي)</label>
                      <input
                        type="text"
                        value={phrasesForm.slide3_title || ''}
                        onChange={(e) => handleUpdatePhraseValue('slide3_title', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-0.5">الوصف الترويجي</label>
                      <textarea
                        rows={2}
                        value={phrasesForm.slide3_description || ''}
                        onChange={(e) => handleUpdatePhraseValue('slide3_description', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium resize-none"
                      />
                    </div>
                  </div>

                </div>

              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePhrases}
                  className="bg-primary hover:bg-primary-hover text-white px-10 py-3.5 rounded-xl text-xs sm:text-sm font-black shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تثبيت وحفظ جميع نصوص الموقع الآن</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS MANAGEMENT */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300">
              <div className="bg-[#49B2A4]/10 p-5 rounded-2xl border-r-4 border-[#49B2A4] flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-charcoal">⭐ إدارة التقييمات وآراء العملاء</h3>
                  <p className="text-xs text-muted-gray mt-1">
                    يمكنك إضافة تقييمات مخصصة لمنتجاتك بأسماء وبلدات حقيقية، أو مراجعة وحذف التقييمات السلبية أو غير اللائقة المضافة بواسطة المشترين.
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-[#49B2A4]/20 px-4 py-2 rounded-xl text-xs font-bold text-[#49B2A4]">
                  إجمالي التقييمات النشطة: {reviews.length} تقييم
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Add Custom Review Form */}
                <form onSubmit={handleAddCustomReview} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-sm lg:col-span-1">
                  <h4 className="font-extrabold text-charcoal text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                    <Plus className="w-4.5 h-4.5 text-primary shrink-0" />
                    <span>إضافة تقييم/رأي جديد</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-1">اسم العميل/الشخص:</label>
                      <input
                        type="text"
                        required
                        value={newRevName}
                        onChange={(e) => setNewRevName(e.target.value)}
                        placeholder="مثال: أ. محمد عبد الرحمن"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-1">تاريخ التقييم:</label>
                        <input
                          type="text"
                          required
                          value={newRevDate}
                          onChange={(e) => setNewRevDate(e.target.value)}
                          placeholder="مثال: اليوم أو منذ يومين"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-1">الموقع/المحافظة:</label>
                        <input
                          type="text"
                          required
                          value={newRevLocation}
                          onChange={(e) => setNewRevLocation(e.target.value)}
                          placeholder="مثال: التجمع، القاهرة"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-1">المنتج المُقيم:</label>
                      <select
                        value={newRevProductName}
                        onChange={(e) => setNewRevProductName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                        <option value="موقع موربيدو والخدمة بشكل عام">موقع موربيدو والخدمة بشكل عام</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-1">التقييم بالنجوم:</label>
                      <div className="flex items-center gap-1.5 justify-end" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRevRating(star)}
                            className="p-1 hover:scale-110 transition-transform duration-100 cursor-pointer"
                          >
                            <Star 
                              className={`w-5 h-5 ${
                                star <= newRevRating 
                                  ? 'text-amber-500 fill-amber-500' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-1">التعليق/مراجعة العميل:</label>
                      <textarea
                        required
                        rows={3}
                        value={newRevComment}
                        onChange={(e) => setNewRevComment(e.target.value)}
                        placeholder="اكتب تفاصيل التقييم الإيجابية والتعليق الفعلي..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <label className="text-xs font-extrabold text-charcoal cursor-pointer select-none" htmlFor="verifiedRev">
                        مشتري معتمد (حساب حقيقي)
                      </label>
                      <input
                        id="verifiedRev"
                        type="checkbox"
                        checked={newRevVerified}
                        onChange={(e) => setNewRevVerified(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4.5 h-4.5" />
                      <span>إضافة التقييم للموقع</span>
                    </button>
                  </div>
                </form>

                {/* Active Reviews Table / Grid */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-charcoal text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                    <span>التقييمات والآراء النشطة حالياً</span>
                  </h4>

                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-gray text-xs sm:text-sm">
                      📭 لا توجد أي تقييمات مضافة حالياً. يرجى البدء في إضافة أول تقييم مخصص لمنتجاتك من خلال النموذج المنسدل.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {reviews.map((rev) => (
                        <div 
                          key={rev.id} 
                          className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors flex justify-between items-start gap-4 text-xs"
                        >
                          {/* Delete Review Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                            title="حذف التقييم"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>

                          {/* Review Detail Text */}
                          <div className="space-y-1.5 flex-1 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <span className="text-[10px] text-gray-400 font-light">{rev.date || 'اليوم'}</span>
                              <div className="flex text-amber-500" dir="ltr">
                                {Array.from({ length: Math.min(5, Math.max(1, Number(rev.rating) || 5)) }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                                ))}
                              </div>
                              <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                {rev.productName || 'موقع موربيدو والخدمة'}
                              </span>
                              <span className="font-extrabold text-charcoal">{rev.name}</span>
                              <span className="text-gray-400 font-light">({rev.location || 'مصر'})</span>
                            </div>
                            
                            <p className="text-charcoal leading-relaxed font-light text-[11px] bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm">
                              "{rev.comment}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: COUPONS MANAGEMENT */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300">
              <div className="bg-emerald-50/50 p-5 rounded-2xl border-r-4 border-emerald-600 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-charcoal">🎫 إدارة كوبونات وأكواد الخصم</h3>
                  <p className="text-xs text-muted-gray mt-1">
                    يمكنك إنشاء وتعديل كوبونات الخصم الترويجية لعملائك، وتحديد حد أدنى للمشتريات لتفعيل الخصم.
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700">
                  إجمالي الكوبونات: {coupons.length} كوبون
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Add Custom Coupon Form */}
                <form onSubmit={handleAddCoupon} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-sm lg:col-span-1">
                  <h4 className="font-extrabold text-charcoal text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                    <Plus className="w-4.5 h-4.5 text-primary shrink-0" />
                    <span>إنشاء كوبون خصم جديد</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-1">رمز الكوبون (كود التفعيل):</label>
                      <input
                        type="text"
                        required
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        placeholder="مثال: BLACKFRIDAY30"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-mono uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-1">نوع الخصم:</label>
                        <select
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                        >
                          <option value="percentage">نسبة مئوية (%)</option>
                          <option value="fixed">خصم ثابت (ج.م)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-gray block mb-1">قيمة الخصم:</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newCouponValue}
                          onChange={(e) => setNewCouponValue(Number(e.target.value))}
                          placeholder={newCouponType === 'percentage' ? 'مثال: 10' : 'مثال: 150'}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-gray block mb-1">الحد الأدنى للطلب (ج.م):</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={newCouponMinOrder}
                        onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                        placeholder="مثال: 1500 (أو 0 بدون حد)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white text-right font-medium"
                      />
                      <span className="text-[9px] text-muted-gray mt-1 block leading-relaxed">
                        * لن يتم تفعيل الكوبون في سلة المشتريات إلا إذا تجاوزت قيمة المشتريات هذا الحد.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4.5 h-4.5" />
                      <span>إنشاء وتفعيل الكوبون</span>
                    </button>
                  </div>
                </form>

                {/* Coupons List Table */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-charcoal text-sm border-b pb-2 text-primary flex items-center gap-1.5 justify-end">
                    <span>الكوبونات والرموز المتاحة حالياً</span>
                  </h4>

                  {coupons.length === 0 ? (
                    <div className="text-center py-12 text-muted-gray text-xs sm:text-sm">
                      🎫 لا توجد أي كوبونات خصم مضافة حالياً. يرجى البدء في إنشاء أول كوبون خصم.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-charcoal font-black">
                            <th className="p-3 text-center">التحكم</th>
                            <th className="p-3">تاريخ الإنشاء</th>
                            <th className="p-3">حالة الكوبون</th>
                            <th className="p-3">الحد الأدنى للطلب</th>
                            <th className="p-3">قيمة الخصم</th>
                            <th className="p-3">نوع الخصم</th>
                            <th className="p-3">الكود</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {coupons.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50/50">
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCoupon(c.id)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                    title="حذف نهائي"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCouponStatus(c.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                      c.isActive 
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {c.isActive ? 'تعطيل الكوبون' : 'تنشيط الكوبون'}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-gray-500 font-mono">{c.createdAt || 'غير محدد'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.isActive 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {c.isActive ? 'نشط ومفعل' : 'معطل ومغلق'}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-charcoal">
                                {c.minOrderValue > 0 ? `${c.minOrderValue.toLocaleString('ar-EG')} ج.م` : 'بدون حد أدنى'}
                              </td>
                              <td className="p-3 font-mono font-black text-primary">
                                {c.value.toLocaleString('ar-EG')}
                                {c.type === 'percentage' ? '%' : ' ج.م'}
                              </td>
                              <td className="p-3 font-medium text-charcoal">
                                {c.type === 'percentage' ? 'نسبة مئوية' : 'خصم نقدي ثابت'}
                              </td>
                              <td className="p-3">
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-charcoal font-black text-xs border border-gray-200">
                                  {c.code}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
