import { useState } from 'react';
import { Search, Heart, User, ShoppingCart, Menu, X, Bed, Home, HelpCircle, MapPin, Wrench, ShieldCheck, Phone, MessageSquare, LogOut, Shield, LayoutGrid } from 'lucide-react';
import { CATEGORIES } from '../data';
import MorbidoLogo from './MorbidoLogo';

interface HeaderProps {
  currentCategory: string;
  setCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  openCart: () => void;
  openFavorites: () => void;
  openWarranty: () => void;
  openBranches: () => void;
  currentUser: any;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenAdmin?: () => void;
  onOpenProfile?: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Header({
  currentCategory,
  setCategory,
  searchQuery,
  setSearchQuery,
  cartCount,
  openCart,
  openFavorites,
  openWarranty,
  openBranches,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenAdmin,
  onOpenProfile,
  mobileMenuOpen: propMobileMenuOpen,
  setMobileMenuOpen: propSetMobileMenuOpen,
}: HeaderProps) {
  const [localMobileMenuOpen, setLocalMobileMenuOpen] = useState(false);
  const mobileMenuOpen = propMobileMenuOpen !== undefined ? propMobileMenuOpen : localMobileMenuOpen;
  const setMobileMenuOpen = propSetMobileMenuOpen !== undefined ? propSetMobileMenuOpen : setLocalMobileMenuOpen;

  const [showSearch, setShowSearch] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleNavClick = (catId: string) => {
    setCategory(catId);
    setMobileMenuOpen(false);
    // Smooth scroll to product grid
    const gridElement = document.getElementById('product-catalog');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-border-light shadow-sm transition-all" dir="rtl">
      {/* Super Simple Top Announcement Bar for Simple/Elderly Users */}
      <div className="bg-[#004D95] text-white py-1.5 px-4 text-xs sm:text-sm font-bold flex justify-between items-center gap-2 border-b border-[#003C75]">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-flex bg-[#49B2A4] text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black animate-pulse">مفاجأة</span>
          <span className="text-center sm:text-right">🚚 التوصيل مجاني بالكامل والدفع بعد ما تستلم وتجرب!</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <a href="tel:01034462884" className="flex items-center gap-1 hover:text-[#49B2A4] transition-colors bg-white/10 px-2 py-0.5 rounded">
            <Phone className="w-3.5 h-3.5 text-[#49B2A4]" />
            <span>اتصل بنا هاتفياً: 01034462884</span>
          </a>
          <a href="https://wa.me/201023456789" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#49B2A4] transition-colors bg-white/10 px-2 py-0.5 rounded">
            <MessageSquare className="w-3.5 h-3.5 text-[#49B2A4]" />
            <span>واتساب سريع: 01023456789</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex justify-between items-center">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => handleNavClick('all')}
            className="transition-opacity hover:opacity-90 cursor-pointer"
          >
            <MorbidoLogo variant="horizontal" showText={true} />
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 font-medium">
          <button
            onClick={() => handleNavClick('mattresses')}
            className={`text-sm py-1 transition-colors cursor-pointer ${
              currentCategory === 'mattresses'
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            مراتب
          </button>
          <button
            onClick={() => handleNavClick('pillows')}
            className={`text-sm py-1 transition-colors cursor-pointer ${
              currentCategory === 'pillows'
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            مخدات
          </button>
          <button
            onClick={() => handleNavClick('bedding')}
            className={`text-sm py-1 transition-colors cursor-pointer ${
              currentCategory === 'bedding'
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            مفروشات
          </button>
          <button
            onClick={openWarranty}
            className="text-sm text-secondary hover:text-primary py-1 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            تفعيل الضمان
          </button>
          <button
            onClick={() => alert('خدمة الصيانة متوفرة لعملائنا الكرام. تواصل معنا على الرقم الساخن 01034462884 وسنقوم بجدولة الصيانة فوراً.')}
            className="text-sm text-secondary hover:text-primary py-1 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-primary" />
            الصيانة
          </button>
          <button
            onClick={openBranches}
            className="text-sm text-secondary hover:text-primary py-1 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-primary" />
            فروعنا
          </button>
        </nav>

        {/* Right Side: Search and Utility Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Dynamic Search Input */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="بحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#eeeeee] border-none text-charcoal rounded-full pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none w-52 transition-all duration-300 focus:w-64"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-gray" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray hover:text-primary text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Search trigger for mobile */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-secondary hover:text-primary transition-all md:hidden rounded-full hover:bg-gray-100"
            title="بحث"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Favorites Button */}
          <button 
            onClick={openFavorites}
            className="p-2 text-secondary hover:text-primary transition-all relative rounded-full hover:bg-gray-100 hidden sm:block"
            title="المفضلة"
          >
            <Heart className="w-5 h-5" />
          </button>

          {/* User Account / Profile block */}
          <div className="relative hidden sm:block">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="p-2 text-primary hover:text-primary/80 transition-all rounded-full hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer font-bold text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                    {currentUser.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block max-w-[80px] truncate text-charcoal">{currentUser.name}</span>
                </button>
                {showUserDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-55 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[10px] text-muted-gray">مسجل كـ:</p>
                      <p className="text-xs font-bold text-charcoal truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-muted-gray truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    {(currentUser.isAdmin || currentUser.isDesigner) && onOpenAdmin && (
                      <button
                        onClick={() => {
                          onOpenAdmin();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-right px-4 py-2 text-xs text-[#004D95] hover:bg-[#004D95]/5 flex items-center gap-2 font-black border-b border-gray-100 transition-colors cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-[#004D95]" />
                        <span>{currentUser.isDesigner ? 'لوحة تحكم المصمم' : 'لوحة التحكم للإدارة'}</span>
                      </button>
                    )}
                    {!currentUser.isAdmin && !currentUser.isDesigner && (
                      <button
                        onClick={() => {
                          onOpenProfile?.();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-right px-4 py-2 text-xs text-primary hover:bg-primary/5 flex items-center gap-2 font-black border-b border-gray-100 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-primary" />
                        <span>ملفي الشخصي وطلباتي</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-2 text-secondary hover:text-primary transition-all rounded-full hover:bg-gray-100 flex items-center gap-1 cursor-pointer font-bold text-xs"
                title="تسجيل الدخول"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline-block text-secondary">دخول</span>
              </button>
            )}
          </div>

          {/* Cart Button with Count Badge */}
          <button 
            onClick={openCart}
            className="p-2 text-secondary hover:text-primary transition-all relative rounded-full hover:bg-gray-100"
            title="سلة التسوق"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-primary text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburguer menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-secondary hover:text-primary transition-all lg:hidden rounded-full hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="md:hidden px-4 py-3 bg-white border-b border-border-light flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث عن المخدات واللحف والبراويز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#eeeeee] border-none text-charcoal rounded-full pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              autoFocus
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-gray" />
          </div>
          <button 
            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            className="text-sm text-primary font-medium"
          >
            إلغاء
          </button>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-border-light shadow-lg py-4 px-6 space-y-4 z-40 transition-all">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleNavClick('all')}
              className={`py-3 px-4 rounded-xl text-right text-sm font-medium transition-all ${
                currentCategory === 'all' ? 'bg-primary text-white font-bold' : 'bg-gray-50 text-secondary'
              }`}
            >
              جميع الأقسام
            </button>
            <button
              onClick={() => handleNavClick('best-sellers')}
              className={`py-3 px-4 rounded-xl text-right text-sm font-medium transition-all ${
                currentCategory === 'best-sellers' ? 'bg-primary text-white font-bold' : 'bg-gray-50 text-secondary'
              }`}
            >
              الأكثر مبيعاً
            </button>
            <button
              onClick={() => handleNavClick('mattresses')}
              className={`py-3 px-4 rounded-xl text-right text-sm font-medium transition-all ${
                currentCategory === 'mattresses' ? 'bg-primary text-white font-bold' : 'bg-gray-50 text-secondary'
              }`}
            >
              مراتب موربيدو
            </button>
            <button
              onClick={() => handleNavClick('pillows')}
              className={`py-3 px-4 rounded-xl text-right text-sm font-medium transition-all ${
                currentCategory === 'pillows' ? 'bg-primary text-white font-bold' : 'bg-gray-50 text-secondary'
              }`}
            >
              مخدات طبية وفندقية
            </button>
            <button
              onClick={() => handleNavClick('bedding')}
              className={`py-3 px-4 rounded-xl text-right text-sm font-medium transition-all ${
                currentCategory === 'bedding' ? 'bg-primary text-white font-bold' : 'bg-gray-50 text-secondary'
              }`}
            >
              مفروشات ولحف
            </button>
          </div>
          
          <div className="border-t border-border-light pt-4 space-y-3">
            <button
              onClick={() => { setMobileMenuOpen(false); openWarranty(); }}
              className="w-full text-right py-2 text-sm text-secondary hover:text-primary flex items-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-primary" />
              تفعيل الضمان الخاص بمنتجك
            </button>
            <button 
                onClick={() => {
                  alert('خدمة الصيانة متوفرة لعملائنا الكرام. تواصل معنا على الرقم الساخن 01034462884 وسنقوم بجدولة الصيانة فوراً.');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-right py-2 text-sm text-secondary hover:text-primary flex items-center gap-2"
            >
              <Wrench className="w-5 h-5 text-primary" />
              طلب زيارة صيانة أو معاينة
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); openBranches(); }}
              className="w-full text-right py-2 text-sm text-secondary hover:text-primary flex items-center gap-2"
            >
              <MapPin className="w-5 h-5 text-primary" />
              عناوين الفروع ومراكز التوزيع
            </button>
          </div>

          <div className="border-t border-border-light pt-4">
            {currentUser ? (
              <div className="space-y-3">
                {(currentUser.isAdmin || currentUser.isDesigner) && onOpenAdmin && (
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-right p-3 bg-[#004D95]/10 text-[#004D95] rounded-xl flex items-center gap-2 font-black border border-[#004D95]/20 transition-all cursor-pointer"
                  >
                    <Shield className="w-5 h-5 text-primary" />
                    <span>{currentUser.isDesigner ? 'دخول لوحة تحكم المصمم' : 'دخول لوحة تحكم الإدارة (الأدمن)'}</span>
                  </button>
                )}
                {!currentUser.isAdmin && !currentUser.isDesigner && (
                  <button
                    onClick={() => {
                      onOpenProfile?.();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-right p-3 bg-primary/10 text-primary rounded-xl flex items-center gap-2 font-black border border-primary/20 transition-all cursor-pointer"
                  >
                    <User className="w-5 h-5 text-primary" />
                    <span>ملفي الشخصي وطلباتي السابقة</span>
                  </button>
                )}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-[10px] text-muted-gray">أهلاً بك مجدداً:</p>
                  <p className="text-xs font-bold text-charcoal">{currentUser.name}</p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg font-bold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-3 bg-[#004D95] hover:bg-[#003C75] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>تسجيل الدخول / إنشاء حساب</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick-Access Bar (Matches Reference HTML design) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-light h-16 z-[45] flex items-center justify-around px-4 shadow-xl">
        <button
          onClick={() => handleNavClick('all')}
          className={`flex flex-col items-center justify-center flex-1 cursor-pointer ${
            currentCategory === 'all' ? 'text-primary font-bold' : 'text-secondary hover:text-primary'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
        </button>
        <button
          onClick={() => handleNavClick('pillows')}
          className={`flex flex-col items-center justify-center flex-1 cursor-pointer ${
            currentCategory === 'pillows' ? 'text-primary font-bold' : 'text-secondary hover:text-primary'
          }`}
        >
          <Bed className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">المخدات</span>
        </button>
        <button
          onClick={() => {
            setMobileMenuOpen(true);
            const gridElement = document.getElementById('product-catalog');
            if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
            mobileMenuOpen ? 'text-primary font-bold' : 'text-secondary hover:text-primary'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">الأقسام</span>
        </button>
        <button
          onClick={openFavorites}
          className="flex flex-col items-center justify-center flex-1 text-secondary hover:text-primary relative cursor-pointer"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">المفضلة</span>
        </button>
        <button
          onClick={openWarranty}
          className="flex flex-col items-center justify-center flex-1 text-secondary hover:text-primary cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">الضمان</span>
        </button>
      </nav>
    </header>
  );
}
