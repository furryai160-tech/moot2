import React from 'react';
import { ArrowLeft, ShieldCheck, Sparkles, Star, Award } from 'lucide-react';

interface CategoriesGridProps {
  onSelectCategory: (categoryId: string, searchQuery?: string) => void;
  selectedCategory: string;
  sitePhrases?: Record<string, string>;
}

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  searchKeyword?: string;
  imageUrl: string;
  badge?: string;
  overlayLogo?: boolean;
}

export default function CategoriesGrid({ onSelectCategory, selectedCategory, sitePhrases }: CategoriesGridProps) {
  const categories: CategoryCard[] = [
    {
      id: 'mattresses',
      title: sitePhrases?.cat_card1_title || 'مراتب فندقية',
      subtitle: sitePhrases?.cat_card1_subtitle || 'راحة 5 نجوم مع ضمان 10 سنوات',
      searchKeyword: 'فندقية',
      imageUrl: sitePhrases?.cat_card1_image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&auto=format&fit=crop&q=85',
      badge: sitePhrases?.cat_card1_badge || 'الأكثر مبيعاً ⭐',
      overlayLogo: true
    },
    {
      id: 'mattresses',
      title: sitePhrases?.cat_card2_title || 'مراتب طبية',
      subtitle: sitePhrases?.cat_card2_subtitle || 'دعم مثالي للظهر والعمود الفقري',
      searchKeyword: 'طبية',
      imageUrl: sitePhrases?.cat_card2_image || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1000&auto=format&fit=crop&q=85',
      badge: sitePhrases?.cat_card2_badge || 'معتمدة طبياً 🩺'
    },
    {
      id: 'mattresses',
      title: sitePhrases?.cat_card3_title || 'سوست منفصلة',
      subtitle: sitePhrases?.cat_card3_subtitle || 'استقلالية تامة وعدم إزعاج للشريك',
      searchKeyword: 'سوست',
      imageUrl: sitePhrases?.cat_card3_image || 'https://images.unsplash.com/photo-1540518614846-7ede433c5163?w=1000&auto=format&fit=crop&q=85',
      badge: sitePhrases?.cat_card3_badge || 'تكنولوجيا ألمانية 🇩🇪'
    },
    {
      id: 'mattresses',
      title: sitePhrases?.cat_card4_title || 'لاتكس طبي',
      subtitle: sitePhrases?.cat_card4_subtitle || 'مرونة عالية وتهوية مستمرة صيفاً وشتاءً',
      searchKeyword: 'لاتكس',
      imageUrl: sitePhrases?.cat_card4_image || 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1000&auto=format&fit=crop&q=85',
      badge: sitePhrases?.cat_card4_badge || 'خامات طبيعية 100%'
    }
  ];

  const handleCategoryClick = (cat: CategoryCard) => {
    onSelectCategory(cat.id, cat.searchKeyword);
    setTimeout(() => {
      const catalogEl = document.getElementById('product-catalog-section') || document.getElementById('product-catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <section className="my-8 text-right dir-rtl">
      {/* Section Header */}
      <div className="mb-6 flex flex-col items-center sm:items-start">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#49B2A4] animate-pulse" />
          <span className="text-xs font-bold text-[#004D95] uppercase tracking-wider">
            تشكيلة المراتب والمفروشات الفاخرة
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
          تصفح أقسامنا الفاخرة
        </h2>
        <div className="h-1 w-20 bg-gradient-to-l from-[#004D95] to-[#49B2A4] rounded-full mt-2"></div>
      </div>

      {/* 2x2 or 4-col Responsive Grid matching exact Morbido layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {categories.map((cat, idx) => {
          return (
            <div
              key={idx}
              onClick={() => handleCategoryClick(cat)}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-200/90 hover:border-[#004D95] shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col transform hover:-translate-y-1 relative"
            >
              {/* Image Container with HD aspect ratio */}
              <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-gray-100">
                <img
                  src={cat.imageUrl}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to high quality mattress image if any network issue
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Badge Overlay */}
                {cat.badge && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-md">
                    {cat.badge}
                  </div>
                )}

                {/* Brand Logo Overlay for Morbido Hotel Category */}
                {cat.overlayLogo && (
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 flex flex-col items-center justify-center p-3 text-center">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center transform group-hover:scale-105 transition-transform">
                      <div className="w-8 h-8 mb-1 rounded-full bg-[#004D95]/10 flex items-center justify-center text-[#004D95]">
                        <ShieldCheck className="w-5 h-5 text-[#004D95]" />
                      </div>
                      <span className="font-black text-[#004D95] text-base sm:text-lg tracking-wider leading-none">
                        morbido
                      </span>
                      <span className="text-[10px] font-black text-gray-800 tracking-widest mt-1">
                        موربيدو
                      </span>
                      <span className="text-[8px] text-[#49B2A4] font-bold mt-0.5">راحة تبدأ كل يوم</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Text Footer */}
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow text-center bg-white space-y-3">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#0B2545] group-hover:text-[#004D95] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[#004D95] font-black text-xs sm:text-sm group-hover:gap-3 transition-all">
                  <span>تسوق الآن</span>
                  <ArrowLeft className="w-4 h-4 text-[#004D95] group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
