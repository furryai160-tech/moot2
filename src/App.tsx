import { useState, useEffect } from 'react';
import { 
  Heart, Star, ShoppingCart, ShieldCheck, Wrench, MapPin, 
  ChevronRight, ChevronLeft, TrendingUp, Bed, Grid, Gift, Check, Phone, Info, Clock, X,
  Award, ThumbsUp, Settings, RefreshCw, Truck, Headset
} from 'lucide-react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import WarrantyModal from './components/WarrantyModal';
import OrderConfirmationModal from './components/OrderConfirmationModal';
import Footer from './components/Footer';
import HeroSlider from './components/HeroSlider';
import SleepQuiz from './components/SleepQuiz';
import CustomerReviews from './components/CustomerReviews';
import AuthModal from './components/AuthModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import AIChatbot from './components/AIChatbot';
import UserProfileModal from './components/UserProfileModal';

import { Product, CartItem, Order, Coupon } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './data';
import { getCurrentUserSync, signOutUser, AppUser, getReviewsFromDatabase, saveReviewToDatabase, ReviewRecord } from './lib/supabase';
import { getProductsWithCache, saveProductsToCache, forceResetCache, CacheMetadata } from './lib/cache';

const DEFAULT_PHRASES = {
  catalog_title_all: 'الصفحة الرئيسية ومستلزمات النوم الفاخرة من موربيدو',
  catalog_desc_all: 'مرحباً بكم في الموقع الرسمي لشركة موربيدو. تصفح مجموعتنا الطبية والفاخرة من المراتب، المخدات، واللحف المصممة هندسياً لتوفر لك تجربة نوم عميقة كالفنادق العالمية.',
  catalog_title_pillows: 'مخدات ومفروشات فندقية',
  catalog_desc_pillows_bedding: 'اكتشف مجموعتنا الطبية والفاخرة من المخدات واللحف والوسائد المصممة هندسياً لتوفر لك تجربة نوم هادئة ومريحة كالفنادق العالمية الكبرى.',
  catalog_title_mattresses: 'مراتب طبية وسوست منفصلة',
  catalog_title_bedding: 'لحف ومفروشات دافئة',
  catalog_title_other: 'مستلزمات ومفروشات موربيدو',
  
  slide1_title: 'مراتب ومخدات موربيدو الطبية الفاخرة',
  slide1_subtitle: 'نوماً هادئاً وصحياً برعاية موربيدو',
  slide1_description: 'استمتع براحة ملوكية استثنائية تدعم صحة عمودك الفقري وفقرات رقبتك مع كفالة ضمان حقيقية معتمدة من مصانع موربيدو لمدة ١٠ سنوات ضد عيوب الهبوط والتصنيع.',
  slide1_badge: 'ضمان ١٠ سنوات معتمد من موربيدو',
  
  slide2_title: 'عروض موربيدو لبيت الزوجية السعيد ٢٠٢٦',
  slide2_subtitle: 'باقات متكاملة مجهزة لراحة دائمة',
  slide2_description: 'وفري مجهودك ومالك مع الباقة الملكية الشاملة المكونة من مراتب ومخدات طبية ولحف فندقية فاخرة من موربيدو بخصومات هائلة مع خدمة التوصيل المجاني لكل مصر.',
  slide2_badge: 'عرض العروسة - توصيل مجاني',

  slide3_title: 'مخدات موربيدو الطبية الداعمة للرقبة',
  slide3_subtitle: 'رغوة ميموري فوم مبردة ولاتكس طبيعي ١٠٠٪',
  slide3_description: 'ودع آلام الصداع وتيبس الكتف عند الاستيقاظ. مخداتنا الطبية من موربيدو تنسجم فوراً مع انحناءات رقبتك ومغطاة بنسيج قطن مصري طبيعي ناعم.',
  slide3_badge: 'طبي معتمد ١٠٠٪'
};

export default function App() {
  // --- States ---
  const [products, setProducts] = useState<Product[]>(() => {
    const { products: cachedProds } = getProductsWithCache();
    return cachedProds;
  });

  const [cacheMetadata, setCacheMetadata] = useState<CacheMetadata>(() => {
    const { metadata } = getProductsWithCache();
    return metadata;
  });

  const [sitePhrases, setSitePhrases] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('morbido_site_phrases');
    if (saved) {
      try {
        return { ...DEFAULT_PHRASES, ...JSON.parse(saved) };
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PHRASES;
  });

  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('الأحدث');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const absoluteMaxPrice = products.length > 0 
    ? Math.max(10000, ...products.map(p => p.price)) 
    : 10000;

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(absoluteMaxPrice);

  // Cart & Favorites
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Modals & Drawers Toggles
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initialSizeFromUrl, setInitialSizeFromUrl] = useState<string | undefined>(undefined);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWarrantyOpen, setIsWarrantyOpen] = useState<boolean>(false);
  const [scannedWarrantyInfo, setScannedWarrantyInfo] = useState<{
    productName: string;
    serialNumber: string;
    productType: string;
    sizeName?: string;
  } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isBranchesOpen, setIsBranchesOpen] = useState<boolean>(false);

  // User session states
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showCartReminder, setShowCartReminder] = useState<boolean>(false);

  // Dynamic Customer Reviews State (loaded from Supabase)
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const handleUpdateReviews = (newReviews: ReviewRecord[]) => {
    setReviews(newReviews);
    localStorage.setItem('morbido_reviews', JSON.stringify(newReviews));
  };

  const handleAddReview = async (review: ReviewRecord) => {
    // Save to Supabase (already done inside CustomerReviews modal)
    // Just update local state
    setReviews(prev => [review, ...prev]);
  };

  // Coupons state for discount codes
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('morbido_coupons');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading coupons:', e);
      }
    }
    // Default coupons
    return [
      {
        id: 'c1',
        code: 'MORBIDO10',
        type: 'percentage',
        value: 10,
        minOrderValue: 0,
        isActive: true,
        createdAt: new Date().toLocaleDateString('ar-EG'),
      },
      {
        id: 'c2',
        code: 'WELCOME150',
        type: 'fixed',
        value: 150,
        minOrderValue: 1500,
        isActive: true,
        createdAt: new Date().toLocaleDateString('ar-EG'),
      }
    ];
  });

  const handleUpdateCoupons = (newCoupons: Coupon[]) => {
    setCoupons(newCoupons);
    localStorage.setItem('morbido_coupons', JSON.stringify(newCoupons));
  };

  // Load cart, favorites, user session, and reviews from localStorage/Supabase
  useEffect(() => {
    const savedCart = localStorage.getItem('morbido_cart');
    const savedFavs = localStorage.getItem('morbido_favs');
    let loadedCart: CartItem[] = [];
    if (savedCart) {
      try { 
        loadedCart = JSON.parse(savedCart);
        setCart(loadedCart); 
      } catch (e) { console.error(e); }
    }
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) { console.error(e); }
    }
    
    // Sync active session
    const user = getCurrentUserSync();
    if (user) {
      setCurrentUser(user);
    }

    // Load reviews from Supabase (with localStorage fallback inside the function)
    getReviewsFromDatabase()
      .then((fetchedReviews) => {
        if (fetchedReviews && fetchedReviews.length > 0) {
          setReviews(fetchedReviews);
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setReviewsLoading(false));

    // Welcoming reminder for returning users with items left in their cart
    if (loadedCart && loadedCart.length > 0) {
      const timer = setTimeout(() => {
        setShowCartReminder(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle QR code deep links (e.g., ?product=id&size=value)
  useEffect(() => {
    if (products && products.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const prodId = searchParams.get('product');
      const sizeParam = searchParams.get('size');
      
      if (prodId) {
        const matchedProd = products.find(p => p.id === prodId);
        if (matchedProd) {
          setSelectedProduct(matchedProd);
          if (sizeParam) {
            setInitialSizeFromUrl(decodeURIComponent(sizeParam));
          }
          // Clear query params from browser URL bar after parsing so they don't persist on refresh
          try {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } catch (e) {
            console.error('Error replacing browser state:', e);
          }
        }
      }
    }
  }, [products]);

  // Handle Warranty QR code verification deep links (e.g., ?verify_warranty=true&prod_name=...&serial=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const verifyWarranty = searchParams.get('verify_warranty') === 'true';
    if (verifyWarranty) {
      const prodName = searchParams.get('prod_name');
      const serial = searchParams.get('serial');
      const category = searchParams.get('category') || '';
      const sizeParam = searchParams.get('size') || '';

      if (prodName && serial) {
        let mappedType = 'مرتبة طبية';
        const normCat = category.toLowerCase();
        if (normCat === 'pillows') {
          mappedType = 'مخدة ميموري فوم';
        } else if (normCat === 'bedding') {
          mappedType = 'لحاف فندقي فاخر';
        } else if (normCat.includes('مخده') || normCat.includes('pillow')) {
          mappedType = 'مخدة ميموري فوم';
        } else if (normCat.includes('لحاف') || normCat.includes('bed')) {
          mappedType = 'لحاف فندقي فاخر';
        } else if (normCat.includes('ملاية')) {
          mappedType = 'ملاية استيك قطن';
        } else if (normCat.includes('مرتبة') || normCat.includes('مرتبه')) {
          mappedType = 'مرتبة طبية';
        }

        setScannedWarrantyInfo({
          productName: decodeURIComponent(prodName),
          serialNumber: decodeURIComponent(serial),
          productType: mappedType,
          sizeName: sizeParam ? decodeURIComponent(sizeParam) : undefined
        });

        setIsWarrantyOpen(true);

        try {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          console.error('Error replacing browser state for warranty:', e);
        }
      }
    }
  }, []);

  // Dismiss cart reminder if cart or checkout is opened
  useEffect(() => {
    if (isCartOpen || isCheckoutOpen) {
      setShowCartReminder(false);
    }
  }, [isCartOpen, isCheckoutOpen]);

  // Sync cart to localStorage
  const updateCartState = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('morbido_cart', JSON.stringify(newCart));
  };

  // Sync favorites to localStorage
  const updateFavoritesState = (newFavs: Product[]) => {
    setFavorites(newFavs);
    localStorage.setItem('morbido_favs', JSON.stringify(newFavs));
  };

  // --- Show Toast Notification ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- Cart actions ---
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    let updatedCart = [...cart];
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart.push({ product, quantity });
    }
    updateCartState(updatedCart);
    triggerToast(`تمت إضافة ${quantity} من "${product.name}" إلى السلة.`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const updatedCart = cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    );
    updateCartState(updatedCart);
  };

  const handleRemoveCartItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    updateCartState(updatedCart);
    triggerToast('تمت إزالة المنتج من السلة.');
  };

  // --- Favorites Actions ---
  const handleToggleFavorite = (product: Product) => {
    const isFav = favorites.some(item => item.id === product.id);
    let updatedFavs = [];
    if (isFav) {
      updatedFavs = favorites.filter(item => item.id !== product.id);
      triggerToast('تمت إزالة المنتج من المفضلة.');
    } else {
      updatedFavs = [...favorites, product];
      triggerToast('تمت إضافة المنتج إلى المفضلة.');
    }
    updateFavoritesState(updatedFavs);
  };

  // --- Filtering and Sorting logic ---
  // Helper function to normalize Arabic text for smart search (handles common spelling variations)
  const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u0652]/g, '') // Remove diacritics
      .trim();
  };

  const filteredProducts = products.filter(product => {
    const isSearchActive = !!searchQuery.trim();

    // Category match: if search is active, we bypass category restrictions so users can search across the entire store
    const categoryMatch = isSearchActive 
      || selectedCategory === 'all' 
      || (selectedCategory === 'best-sellers' && product.rating && product.rating >= 4.8)
      || product.category === selectedCategory;

    // Price range match
    const priceMatch = product.price >= minPrice && product.price <= maxPrice;

    if (!priceMatch) {
      return false;
    }

    if (!isSearchActive) {
      return categoryMatch;
    }

    // Smart Arabic search match with multi-word support
    const normalizedQuery = normalizeArabic(searchQuery);
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

    // All words in the query must match at least one field of the product
    const searchMatch = queryWords.every(word => {
      // 1. Check Product Name
      if (normalizeArabic(product.name).includes(word)) return true;
      
      // 2. Check Product Description
      if (normalizeArabic(product.description || '').includes(word)) return true;
      
      // 3. Check Product Tag
      if (normalizeArabic(product.tag || '').includes(word)) return true;
      
      // 4. Check Product Category Arabic keywords
      let categoryArabicNames: string[] = [];
      if (product.category === 'mattresses') {
        categoryArabicNames = ['مرتبه', 'مرتبة', 'مراتب', 'سوسه', 'سوست', 'شاسيه'];
      } else if (product.category === 'pillows') {
        categoryArabicNames = ['مخده', 'مخدة', 'مخدات', 'وساده', 'وسادة', 'وسائد', 'خداديه', 'خدادية'];
      } else if (product.category === 'bedding') {
        categoryArabicNames = ['لحاف', 'لحف', 'ملايه', 'ملاية', 'ملايات', 'طقم ملاية', 'مفرش', 'مفارش', 'مفروشات'];
      }
      const categoryMatchInArabic = categoryArabicNames.some(name => 
        normalizeArabic(name).includes(word)
      );
      if (categoryMatchInArabic) return true;

      // 5. Check Specs
      const specsMatch = product.specs ? Object.entries(product.specs).some(([key, val]) => 
        normalizeArabic(key).includes(word) || normalizeArabic(String(val)).includes(word)
      ) : false;
      if (specsMatch) return true;

      return false;
    });

    return categoryMatch && searchMatch;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'السعر: من الأقل للأعلى') {
      return a.price - b.price;
    }
    if (sortOption === 'السعر: من الأعلى للأقل') {
      return b.price - a.price;
    }
    if (sortOption === 'الأكثر تقييماً') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Default or "الأحدث"
    return a.id.localeCompare(b.id);
  });

  // Pagination (assuming 6 products per page to demonstrate full functionality)
  const itemsPerPage = 6;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    const catalogElement = document.getElementById('product-catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    triggerToast(`شكراً لك! تم تسجيل طلبك ${order.id} بنجاح.`);
  };

  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    triggerToast(`مرحباً بك، ${user.name}! تم تسجيل الدخول بنجاح.`);
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    triggerToast('تم تسجيل الخروج بنجاح. نتمنى رؤيتك قريباً!');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#1A1C1C] flex flex-col font-sans selection:bg-primary/20 selection:text-primary pb-16 md:pb-0">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 bg-charcoal text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce border-l-4 border-primary text-xs sm:text-sm">
          <Check className="w-4 h-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Navigation Header */}
      <Header 
        currentCategory={selectedCategory}
        setCategory={(cat) => { setSelectedCategory(cat); setCurrentPage(1); }}
        searchQuery={searchQuery}
        setSearchQuery={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        openFavorites={() => setSelectedCategory('all')} // opens all and lists favorites
        openWarranty={() => setIsWarrantyOpen(true)}
        openBranches={() => setIsBranchesOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow space-y-10">
        
        {/* Dynamic Hero Slider Banner on Homepage */}
        {selectedCategory === 'all' && !searchQuery.trim() && (
          <>
            <HeroSlider 
              onNavigateCategory={(cat) => { setSelectedCategory(cat); setCurrentPage(1); }}
              onOpenWarranty={() => setIsWarrantyOpen(true)}
              onActivatePromo={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
                triggerToast('تم تفعيل عرض العروسة الفاخر! الخصم مطبق تلقائياً في السلة.');
              }}
              sitePhrases={sitePhrases}
            />
            <SleepQuiz 
              onAddToCart={handleAddToCart}
              onOpenDetails={(p) => setSelectedProduct(p)}
            />
          </>
        )}

        {/* Breadcrumbs & Catalog Title Block */}
        <div className="mb-10 text-right">
          <div className="flex items-center gap-1 text-muted-gray text-xs sm:text-sm mb-3">
            <button 
              onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
              className="hover:text-primary transition-colors font-medium cursor-pointer"
            >
              الرئيسية
            </button>
            <ChevronLeft className="w-4 h-4 text-gray-300" />
            <span className="text-primary font-bold">
              {CATEGORIES.find(c => c.id === selectedCategory)?.name || 'الرئيسية'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight mb-3">
            {selectedCategory === 'all' 
              ? (sitePhrases?.catalog_title_all || 'الصفحة الرئيسية ومستلزمات النوم الفاخرة من موربيدو') 
              : selectedCategory === 'pillows' 
                ? (sitePhrases?.catalog_title_pillows || 'مخدات ومفروشات فندقية') 
                : selectedCategory === 'mattresses'
                  ? (sitePhrases?.catalog_title_mattresses || 'مراتب طبية وسوست منفصلة')
                  : selectedCategory === 'bedding'
                    ? (sitePhrases?.catalog_title_bedding || 'لحف ومفروشات دافئة')
                    : (sitePhrases?.catalog_title_other || 'مستلزمات ومفروشات موربيدو')}
          </h1>
          <p className="text-[#5f5e5e] text-sm sm:text-base max-w-3xl leading-relaxed">
            {selectedCategory === 'all'
              ? (sitePhrases?.catalog_desc_all || 'مرحباً بكم في الموقع الرسمي لشركة موربيدو. تصفح مجموعتنا الطبية والفاخرة من المراتب، المخدات، واللحف المصممة هندسياً لتوفر لك تجربة نوم عميقة كالفنادق العالمية.')
              : (sitePhrases?.catalog_desc_pillows_bedding || 'اكتشف مجموعتنا الطبية والفاخرة من المخدات واللحف والوسائد المصممة هندسياً لتوفر لك تجربة نوم هادئة ومريحة كالفنادق العالمية الكبرى.')}
          </p>
        </div>

        {/* 2-Column Responsive Layout (Sidebar on the right for elegant Arabic context) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="product-catalog">
          
          {/* Main Grid left part (takes 3 of 4 columns) */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            
            {/* Catalog header with sort and mobile triggers */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-border-light gap-4">
              
              {/* Display visible products count */}
              <div className="text-right w-full sm:w-auto">
                <p className="text-muted-gray text-xs sm:text-sm font-medium">
                  تم العثور على <strong className="text-primary">{sortedProducts.length}</strong> منتجاً فاخراً 
                  {searchQuery && ` لـ "${searchQuery}"`}
                </p>
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                <span className="text-muted-gray text-xs sm:text-sm font-medium shrink-0">ترتيب المنتجات:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-gray-50 border border-border-light text-primary text-xs sm:text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer text-right"
                >
                  <option value="الأحدث">الأحدث والأكثر رواجاً</option>
                  <option value="السعر: من الأقل للأعلى">السعر: من الأقل للأعلى</option>
                  <option value="السعر: من الأعلى للأقل">السعر: من الأعلى للأقل</option>
                  <option value="الأكثر تقييماً">الأعلى تقييماً وتقييمات العملاء</option>
                </select>
              </div>

            </div>

            {/* Product Cards Grid */}
            {paginatedProducts.length === 0 ? (
              <div className="bg-white border border-border-light rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-muted-gray">
                  <Bed className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-charcoal">لا توجد منتجات مطابقة للبحث</h3>
                <p className="text-muted-gray text-sm max-w-sm mx-auto">
                  يرجى تجربة كلمات بحثية مختلفة أو اختيار قسم آخر من شريط التنقل لعرض المنتجات المتاحة حالياً.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  إعادة تهيئة الفلتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onOpenDetails={(p) => setSelectedProduct(p)}
                    isFavorite={favorites.some(fav => fav.id === product.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-6 sm:py-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-light bg-white text-muted-gray hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border-light disabled:hover:text-muted-gray transition-all cursor-pointer"
                  title="السابق"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white border border-border-light text-muted-gray hover:border-primary hover:text-primary'
                    }`}
                  >
                    {(i + 1).toLocaleString('ar-EG')}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-light bg-white text-muted-gray hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border-light disabled:hover:text-muted-gray transition-all cursor-pointer"
                  title="التالي"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>

          {/* Sidebar right column (takes 1 of 4 columns) */}
          <aside className="lg:col-span-1 space-y-6 order-1 lg:order-2">
            
            {/* Sidebar Card 1: Browse Categories */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-border-light text-right">
              <h3 className="font-bold text-base text-charcoal mb-4 border-b border-border-light pb-3">
                تصفح أقسامنا الفاخرة
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => { setSelectedCategory('best-sellers'); setCurrentPage(1); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm cursor-pointer ${
                      selectedCategory === 'best-sellers'
                        ? 'bg-primary text-white font-bold'
                        : 'text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>الأكثر مبيعاً ورواجاً</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setSelectedCategory('pillows'); setCurrentPage(1); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm cursor-pointer ${
                      selectedCategory === 'pillows'
                        ? 'bg-primary text-white font-bold'
                        : 'text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <Bed className="w-4 h-4" />
                    <span>مخدات طبية وفندقية</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setSelectedCategory('bedding'); setCurrentPage(1); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm cursor-pointer ${
                      selectedCategory === 'bedding'
                        ? 'bg-primary text-white font-bold'
                        : 'text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>مفروشات ولحف دافئة</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setSelectedCategory('mattresses'); setCurrentPage(1); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm cursor-pointer ${
                      selectedCategory === 'mattresses'
                        ? 'bg-primary text-white font-bold'
                        : 'text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">bed</span>
                    <span>مراتب سوست متصلة ومنفصلة</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-white font-bold'
                        : 'text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>عرض الكل والخصومات</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Sidebar Card 2: Price Filter */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-border-light text-right space-y-4">
              <h3 className="font-bold text-base text-charcoal border-b border-border-light pb-3 flex items-center justify-between">
                <span>تصفية حسب السعر</span>
                <span className="text-xs text-primary font-normal">جنيه مصري</span>
              </h3>
              
              {/* Slider for Max Price */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] text-muted-gray">
                  <span>الحد الأقصى: <strong className="text-charcoal">{maxPrice.toLocaleString('ar-EG')} ج.م</strong></span>
                  <span>الحد الأدنى: <strong className="text-charcoal">{minPrice.toLocaleString('ar-EG')} ج.م</strong></span>
                </div>
                
                {/* HTML Range Slider for Max Price */}
                <input 
                  type="range"
                  min="0"
                  max={absoluteMaxPrice}
                  step="50"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPrice(val);
                    if (val < minPrice) setMinPrice(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Min & Max Price Manual Input Fields */}
              <div className="grid grid-cols-2 gap-2 text-right text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-gray block">الحد الأقصى</label>
                  <input
                    type="number"
                    min="0"
                    max={absoluteMaxPrice}
                    value={maxPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxPrice(isNaN(val) ? absoluteMaxPrice : val);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-gray-50 border border-border-light text-xs font-bold rounded-lg px-2 py-1.5 text-center focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-gray block">الحد الأدنى</label>
                  <input
                    type="number"
                    min="0"
                    max={absoluteMaxPrice}
                    value={minPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinPrice(isNaN(val) ? 0 : val);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-gray-50 border border-border-light text-xs font-bold rounded-lg px-2 py-1.5 text-center focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 border-t border-border-light space-y-1.5">
                <p className="text-[10px] font-bold text-muted-gray">خيارات سريعة (ج.م):</p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => { setMinPrice(0); setMaxPrice(1000); setCurrentPage(1); }}
                    className="text-[9px] font-bold bg-gray-50 hover:bg-primary-light hover:text-primary py-1 px-1 rounded text-center border border-border-light transition-colors cursor-pointer"
                  >
                    تحت ١,٠٠٠
                  </button>
                  <button
                    onClick={() => { setMinPrice(1000); setMaxPrice(3000); setCurrentPage(1); }}
                    className="text-[9px] font-bold bg-gray-50 hover:bg-primary-light hover:text-primary py-1 px-1 rounded text-center border border-border-light transition-colors cursor-pointer"
                  >
                    ١,٠٠٠ - ٣,٠٠٠
                  </button>
                  <button
                    onClick={() => { setMinPrice(3000); setMaxPrice(absoluteMaxPrice); setCurrentPage(1); }}
                    className="text-[9px] font-bold bg-gray-50 hover:bg-primary-light hover:text-primary py-1 px-1 rounded text-center border border-border-light transition-colors cursor-pointer"
                  >
                    فوق ٣,٠٠٠
                  </button>
                </div>
              </div>

              {/* Reset Filter Button */}
              {(minPrice > 0 || maxPrice < absoluteMaxPrice) && (
                <button
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(absoluteMaxPrice);
                    setCurrentPage(1);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-primary font-bold bg-primary-light hover:bg-primary/20 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة تعيين السعر</span>
                </button>
              )}
            </div>

            {/* Sidebar Promo Card 2: Bride Offer Banner (Matches user's image exactly) */}
            <div className="relative rounded-xl overflow-hidden aspect-[4/5] shadow-lg group">
              {/* Background gradient for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent z-10" />
              
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1yeyfL5rFcxmWQ3ltVBdZ6MWF0G_Yf7Mv3nouvX4Y9BFiNnCeWKqJZhIacchBJ8JeeLl-RhVn002j5vRCl4hvDUo_nm_AuSjCX0E9SAYb-ik44hmb0uW_IUGSePgPZpuTrzpQdhKXXAQ81_R5sL9R_imNsqUvcfsCMrGcjLNtGILiTVL6CMnX_Oqcf4ZGxqTzI7mcbZh0iyursCdK0tm1NXUBq4Z4LRYks3XTYlmnz0K-h1GKkdAR" 
                alt="عرض العروسة"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />

              <div className="absolute bottom-6 right-6 left-6 z-20 text-white text-right space-y-2">
                <span className="text-[10px] sm:text-xs font-bold bg-status-discount inline-block px-2.5 py-1 rounded-md">
                  خصم 15% كامل
                </span>
                <h4 className="text-xl sm:text-2xl font-black">عرض العروسة الفاخر</h4>
                <p className="text-xs text-gray-200 leading-relaxed font-light">
                  أفضل وأوفر الباقات الجاهزة لتجهيز بيت الزوجية بمراتب ومفروشات معتمدة.
                </p>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                    alert('تم تفعيل عرض العروسة! يمكنك تصفح المنتجات بخصم ١٥٪ الإضافي المطبق تلقائياً عند السلة!');
                  }}
                  className="bg-white text-primary px-5 py-2 rounded-lg font-bold text-xs hover:bg-primary-light hover:text-[#0f2000] transition-colors shadow mt-2 cursor-pointer"
                >
                  تسوق العرض الآن
                </button>
              </div>
            </div>

            {/* Customer Helpline Fast reassurance block */}
            <div className="bg-gradient-to-br from-[#1a1c1c] to-primary p-5 rounded-2xl text-white text-right space-y-4">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-bold text-sm">مستعدون لخدمتكم دائماً</span>
                <Info className="w-5 h-5 text-primary-light" />
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                هل تحتاج إلى مساعدة لتحديد مقاس المرتبة أو اختيار نوع المخدة الطبية الملائمة لرقبتك؟ اتصل بطلب المشورة المجانية.
              </p>
              <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                <div>
                  <p className="text-lg font-black text-primary-light" dir="ltr">01034462884</p>
                  <p className="text-[9px] text-gray-400">متاحون ٢٤ ساعة طوال أيام الأسبوع</p>
                </div>
                <Phone className="w-4 h-4 text-primary-light" />
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* Customer Reviews Section (on homepage) */}
      {selectedCategory === 'all' && !searchQuery.trim() && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CustomerReviews
            reviews={reviews}
            onAddReview={handleAddReview}
            currentUser={currentUser}
          />
        </section>
      )}

      {/* ISO 9001:2015 Certification Section */}
      {selectedCategory === 'all' && !searchQuery.trim() && (
        <section className="bg-gradient-to-br from-[#0F1E2E] via-[#162D45] to-[#0A1624] text-white py-16 text-center overflow-hidden relative">
          {/* Subtle decorative background blur shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#49B2A4]/10 rounded-full blur-3xl translate-x-[-30%] translate-y-[-30%] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#004D95]/20 rounded-full blur-3xl translate-x-[30%] translate-y-[30%] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 bg-[#49B2A4]/20 border border-[#49B2A4]/30 px-4 py-1.5 rounded-full text-[#49B2A4] text-xs sm:text-sm font-black tracking-wide">
                <Award className="w-4.5 h-4.5 shrink-0" />
                <span>شهادة الجودة العالمية ISO 9001:2015</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                موربيدو حاصلة على شهادة <span className="text-[#49B2A4]">9001:2015 ISO</span>
              </h2>
              
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                حصلنا على أرفع شهادات الجودة الدولية في نظام إدارة الجودة، مما يضمن لك منتجاً مصنعاً وفق أعلى المعايير العالمية في كل خطوة من خطوات الإنتاج.
              </p>
            </div>

            {/* Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Pillar 1: جودة التصنيع */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right transition-all duration-300 hover:bg-white/10 hover:border-[#49B2A4]/30 hover:shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004D95] to-[#49B2A4] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#49B2A4] transition-colors">جودة التصنيع</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                  خطوط إنتاج آلية متطورة تضمن تطبيق أعلى مواصفات الدقة الهندسية في كل مرتبة ومخدة.
                </p>
              </div>

              {/* Pillar 2: رقابة المواد الخام */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right transition-all duration-300 hover:bg-white/10 hover:border-[#49B2A4]/30 hover:shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-[#004D95]/40 border border-[#004D95]/60 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck className="w-6 h-6 text-[#49B2A4]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#49B2A4] transition-colors">رقابة المواد الخام</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                  اختيار واختبار دقيق للخامات الفاخرة لضمان الخلو التام من العيوب وصحة نومك وصدرك.
                </p>
              </div>

              {/* Pillar 3: رضا العميل */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right transition-all duration-300 hover:bg-white/10 hover:border-[#49B2A4]/30 hover:shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004D95] to-[#49B2A4] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <ThumbsUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#49B2A4] transition-colors">رضا العميل</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                  خدمة عملاء استثنائية وسريعة وضمان حقيقي لمدة 10 سنوات لنكون دائماً مصدر ثقتك.
                </p>
              </div>

              {/* Pillar 4: تحسين مستمر */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right transition-all duration-300 hover:bg-white/10 hover:border-[#49B2A4]/30 hover:shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-[#004D95]/40 border border-[#004D95]/60 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <RefreshCw className="w-6 h-6 text-[#49B2A4] animate-spin-slow" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#49B2A4] transition-colors">تحسين مستمر</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                  تطوير دائم لعملياتنا لتقديم أفضل وأحدث ابتكارات الراحة الفندقية والطبية الحديثة.
                </p>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Trust Badges Reassurance Section */}
      <section className="bg-white border-y border-border-light py-12 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            {/* Badge 1 */}
            <div className="space-y-3 group text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Truck className="w-8 h-8 text-primary" strokeWidth={2.5} />
              </div>
              <h4 className="font-extrabold text-charcoal text-base">شحن مجاني وسريع</h4>
              <p className="text-muted-gray text-xs sm:text-sm max-w-xs px-4">
                توصيل مجاني بالكامل لكل طلباتك التي تتجاوز قيمتها ٢٠٠٠ جنيه مصري.
              </p>
            </div>

            {/* Badge 2 */}
            <div className="space-y-3 group text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck className="w-8 h-8 text-primary" strokeWidth={2.5} />
              </div>
              <h4 className="font-extrabold text-charcoal text-base">ضمان استرجاع الأموال</h4>
              <p className="text-muted-gray text-xs sm:text-sm max-w-xs px-4">
                نضمن جودة منتجاتنا مع كفالة حق الاسترجاع الكامل في حالة وجود أي تلف أو عيب صناعي.
              </p>
            </div>

            {/* Badge 3 */}
            <div className="space-y-3 group text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Headset className="w-8 h-8 text-primary" strokeWidth={2.5} />
              </div>
              <h4 className="font-extrabold text-charcoal text-base">خدمة عملاء فائقة الدعم</h4>
              <p className="text-muted-gray text-xs sm:text-sm max-w-xs px-4">
                مندوبينا متواجدين دائماً للتواصل معكم والإجابة على أي استفسارات أو طلبات صيانة.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer 
        onCategoryChange={(cat) => { setSelectedCategory(cat); setCurrentPage(1); }}
        onOpenWarranty={() => setIsWarrantyOpen(true)}
      />

      {/* --- Overlay Modals & Drawers --- */}

      {/* 1. Product Details Specifications Modal */}
      {selectedProduct && (
        <ProductDetailsModal 
          product={selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
            setInitialSizeFromUrl(undefined);
          }}
          onAddToCart={handleAddToCart}
          initialSize={initialSizeFromUrl}
        />
      )}

      {/* 2. Side Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onStartCheckout={handleStartCheckout}
      />

      {/* 3. Electronic Warranty Activation Modal */}
      {isWarrantyOpen && (
        <WarrantyModal 
          prefilledInfo={scannedWarrantyInfo}
          currentUser={currentUser}
          onClose={() => {
            setIsWarrantyOpen(false);
            setScannedWarrantyInfo(null);
          }}
        />
      )}

      {/* 4. Checkout Order Modal */}
      {isCheckoutOpen && (
        <OrderConfirmationModal 
          cartItems={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
          onClearCart={() => updateCartState([])}
          onAddReview={async (newReview) => {
            const addedReview: ReviewRecord = {
              id: 'rev_' + Date.now().toString(36),
              name: newReview.name,
              location: newReview.location || 'مشتري معتمد',
              productName: newReview.productName,
              rating: newReview.rating,
              date: 'اليوم',
              comment: newReview.comment,
              verified: true,
            };
            await saveReviewToDatabase(addedReview);
            setReviews(prev => [addedReview, ...prev]);
          }}
          currentUser={currentUser}
          coupons={coupons}
        />
      )}

      {/* 5. Our Store Branches Modal (فروعنا) */}
      {isBranchesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 text-right">
            <div className="p-4 sm:p-5 border-b border-border-light flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2 justify-end">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>عناوين فروع ومراكز توزيع موربيدو</span>
              </h2>
              <button 
                onClick={() => setIsBranchesOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Branch 1 */}
              <div className="border-b border-border-light pb-4 text-xs sm:text-sm">
                <h4 className="font-bold text-primary mb-1">المصنع والمنطقة الصناعية (الدقهلية)</h4>
                <p className="text-[#5f5e5e] mb-2">جمصة - المنطقة الصناعية - المرحلة الثانية بلوك 35 د و 36 د</p>
                <div className="flex flex-col gap-2 items-end">
                  <a href="https://maps.app.goo.gl/EFybfdzaMC82ok2M7" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#49B2A4] hover:underline font-bold text-[11px] bg-[#49B2A4]/10 px-2 py-1 rounded cursor-pointer transition-colors hover:bg-[#49B2A4]/20">
                    <span>عرض موقع المصنع على الخريطة</span>
                    <MapPin className="w-3 h-3" />
                  </a>
                  <p className="text-[11px] text-muted-gray flex items-center gap-1">
                    <span>من الساعة ٩ صباحاً وحتى ٥ مساءً</span>
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </p>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="border-b border-border-light pb-4 text-xs sm:text-sm">
                <h4 className="font-bold text-primary mb-1">فرع القاهرة الرئيسي (المعرض والمبيعات)</h4>
                <p className="text-[#5f5e5e] mb-1">مدينة نصر - طريق النصر - بجوار مول سيتي ستارز الشهير</p>
                <p className="text-[11px] text-muted-gray flex items-center gap-1 justify-end">
                  <span>من الساعة ١٠ صباحاً وحتى ١٠ مساءً طوال الأسبوع</span>
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </p>
              </div>

              {/* Branch 3 */}
              <div className="pb-2 text-xs sm:text-sm">
                <h4 className="font-bold text-primary mb-1">موزعينا المعتمدين بجمهورية مصر العربية</h4>
                <p className="text-[#5f5e5e] mb-2">تتوفر منتجاتنا الفاخرة لدى أكثر من ١٥٠ معرضاً معتمداً في جميع المحافظات (القاهرة، الدلتا، الصعيد، الإسكندرية).</p>
                <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 text-xs text-primary leading-relaxed font-bold">
                  اتصل بالخط الساخن الموحد <span className="underline" dir="ltr">01034462884</span> لمعرفة أقرب معرض أو موزع معتمد بجوار منزلك وسيقوم المندوب بالتوجيه فوراً.
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-border-light flex justify-end">
              <button 
                onClick={() => setIsBranchesOpen(false)}
                className="bg-primary text-white font-bold text-sm px-6 py-2 rounded-lg cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Auth Modal (تسجيل الدخول / إنشاء حساب) */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile & Order History Modal */}
      {isProfileOpen && currentUser && (
        <UserProfileModal 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onUpdateUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            triggerToast('تم تحديث بيانات ملفك الشخصي بنجاح!');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 7. Admin / Designer Control Panel */}
      {isAdminDashboardOpen && (
        <AdminDashboardModal 
          onClose={() => setIsAdminDashboardOpen(false)}
          products={products}
          onUpdateProducts={(newProds) => {
            setProducts(newProds);
            const updatedMeta = saveProductsToCache(newProds);
            setCacheMetadata(updatedMeta);
          }}
          cacheMetadata={cacheMetadata}
          onForceResetCache={() => {
            const { products: resetProds, metadata } = forceResetCache();
            setProducts(resetProds);
            setCacheMetadata(metadata);
            triggerToast('تمت إعادة تهيئة ومزامنة الذاكرة المؤقتة لمنتجات المتجر بنجاح!');
          }}
          triggerToast={triggerToast}
          sitePhrases={sitePhrases}
          onUpdatePhrases={(newPhrases) => {
            setSitePhrases(newPhrases);
            localStorage.setItem('morbido_site_phrases', JSON.stringify(newPhrases));
          }}
          currentUser={currentUser}
          reviews={reviews}
          onUpdateReviews={handleUpdateReviews}
          coupons={coupons}
          onUpdateCoupons={handleUpdateCoupons}
        />
      )}

      {/* 8. AI Chatbot Widget */}
      {!isAdminDashboardOpen && !isProfileOpen && !isAuthOpen && !mobileMenuOpen && <AIChatbot />}

      {/* 9. Welcoming Cart Reminder Popup */}
      {showCartReminder && cart.length > 0 && (
        <div className="fixed bottom-24 md:bottom-6 left-6 z-40 max-w-sm w-[calc(100vw-3rem)] bg-white rounded-2xl border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-5 text-right flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3 flex-row-reverse">
            <button 
              onClick={() => setShowCartReminder(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5 flex-row-reverse">
              <div className="w-10 h-10 rounded-xl bg-[#49B2A4]/10 text-[#49B2A4] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-charcoal">مرحباً بعودتك! 👋</h4>
                <p className="text-xs text-[#49B2A4] font-medium mt-0.5">لقد حفظنا منتجاتك المفضلة بالسلة</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            لاحظنا وجود منتجات فاخرة تركتها بانتظارك في عربة تسوقك. سارع بإكمال طلبك الآن لتنعم بتجربة نوم فندقية مثالية من موربيدو!
          </p>

          {/* Cart items list mini preview */}
          <div className="bg-gray-50 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-2 border border-gray-100 flex flex-col">
            {cart.slice(0, 2).map((item) => (
              <div key={item.product.id} className="flex items-center justify-between gap-2 text-xs flex-row-reverse text-right">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-right">
                    <span className="font-bold text-gray-800 line-clamp-1 text-[11px]">{item.product.name}</span>
                    <span className="text-[10px] text-muted-gray">الكمية: {item.quantity}</span>
                  </div>
                </div>
                <span className="font-mono text-primary font-bold text-[11px] shrink-0">{(item.product.price * item.quantity).toLocaleString('ar-EG')} ج.م</span>
              </div>
            ))}
            {cart.length > 2 && (
              <p className="text-[10px] text-center text-muted-gray font-bold pt-1 border-t border-dashed border-gray-200">
                وهناك {cart.length - 2} منتجات أخرى في انتظارك...
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => setShowCartReminder(false)}
              className="px-3.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-bold transition-all hover:bg-gray-50 rounded-xl cursor-pointer"
            >
              تصفح المتجر
            </button>
            <button
              onClick={() => {
                setIsCartOpen(true);
                setShowCartReminder(false);
              }}
              className="bg-primary hover:bg-[#3ca092] text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer flex-row-reverse"
            >
              <span>عرض السلة وإكمال الشراء</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
