import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ShieldCheck, Heart, Sparkles, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  ctaText: string;
  actionType: 'catalog' | 'warranty' | 'promo';
  bgGradient: string;
  imageUrl: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'مراتب ومخدات موربيدو الطبية الفاخرة',
    subtitle: 'نوماً هادئاً وصحياً برعاية موربيدو',
    description: 'استمتع براحة ملوكية استثنائية تدعم صحة عمودك الفقري وفقرات رقبتك مع كفالة ضمان حقيقية معتمدة من مصانع موربيدو لمدة ١٠ سنوات ضد عيوب الهبوط والتصنيع.',
    badge: 'ضمان ١٠ سنوات معتمد من موربيدو',
    ctaText: 'تصفح المراتب الطبية',
    actionType: 'catalog',
    bgGradient: 'from-[#031525] via-[#0B2545] to-[#134074]',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    title: 'عروض موربيدو لبيت الزوجية السعيد ٢٠٢٦',
    subtitle: 'باقات متكاملة مجهزة لراحة دائمة',
    description: 'وفري مجهودك ومالك مع الباقة الملكية الشاملة المكونة من مراتب ومخدات طبية ولحف فندقية فاخرة من موربيدو بخصومات هائلة مع خدمة التوصيل المجاني لكل مصر.',
    badge: 'عرض العروسة - توصيل مجاني',
    ctaText: 'تسوق عروض موربيدو',
    actionType: 'promo',
    bgGradient: 'from-[#05211d] via-[#103F39] to-[#1C5D54]',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1yeyfL5rFcxmWQ3ltVBdZ6MWF0G_Yf7Mv3nouvX4Y9BFiNnCeWKqJZhIacchBJ8JeeLl-RhVn002j5vRCl4hvDUo_nm_AuSjCX0E9SAYb-ik44hmb0uW_IUGSePgPZpuTrzpQdhKXXAQ81_R5sL9R_imNsqUvcfsCMrGcjLNtGILiTVL6CMnX_Oqcf4ZGxqTzI7mcbZh0iyursCdK0tm1NXUBq4Z4LRYks3XTYlmnz0K-h1GKkdAR'
  },
  {
    id: 3,
    title: 'مخدات موربيدو الطبية الداعمة للرقبة',
    subtitle: 'رغوة ميموري فوم مبردة ولاتكس طبيعي ١٠٠٪',
    description: 'ودع آلام الصداع وتيبس الكتف عند الاستيقاظ. مخداتنا الطبية من موربيدو تنسجم فوراً مع انحناءات رقبتك ومغطاة بنسيج قطن مصري طبيعي ناعم.',
    badge: 'طبي معتمد ١٠٠٪',
    ctaText: 'اكتشف المخدات الطبية',
    actionType: 'catalog',
    bgGradient: 'from-[#0A0F1D] via-[#1E293B] to-[#334155]',
    imageUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLuTrDw_AADRm_pjylOSbAVFkLmWei5gfYGNVGj2BDy5aqlgGsx0F4734ljPLtFJwPwoenI56NlPJ3hpu553dMUYIgfcYWYAW6QncW-tyJkomW6Hww4Yn7KLD0tNdUss6-UtU-uPctMQ_plzoqFLvONGlO4iGiKR8F16ZsFJSY5p7Co7e52JU9wKMpxXW3Oxzc0O9xWZlpX3jk56RIVFZ-s6HpkCwFvfh4XX2CYd1tL6B6ekDdbWholdwQ'
  }
];

interface HeroSliderProps {
  onNavigateCategory: (category: string) => void;
  onOpenWarranty: () => void;
  onActivatePromo: () => void;
  sitePhrases?: any;
}

export default function HeroSlider({ onNavigateCategory, onOpenWarranty, onActivatePromo, sitePhrases }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: sitePhrases?.slide1_title || 'مراتب ومخدات موربيدو الطبية الفاخرة',
      subtitle: sitePhrases?.slide1_subtitle || 'نوماً هادئاً وصحياً برعاية موربيدو',
      description: sitePhrases?.slide1_description || 'استمتع براحة ملوكية استثنائية تدعم صحة عمودك الفقري وفقرات رقبتك مع كفالة ضمان حقيقية معتمدة من مصانع موربيدو لمدة ١٠ سنوات ضد عيوب الهبوط والتصنيع.',
      badge: sitePhrases?.slide1_badge || 'ضمان ١٠ سنوات معتمد من موربيدو',
      ctaText: 'تصفح المراتب الطبية',
      actionType: 'catalog' as const,
      bgGradient: 'from-[#031525] via-[#0B2545] to-[#134074]',
      imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      title: sitePhrases?.slide2_title || 'عروض موربيدو لبيت الزوجية السعيد ٢٠٢٦',
      subtitle: sitePhrases?.slide2_subtitle || 'باقات متكاملة مجهزة لراحة دائمة',
      description: sitePhrases?.slide2_description || 'وفري مجهودك ومالك مع الباقة الملكية الشاملة المكونة من مراتب ومخدات طبية ولحف فندقية فاخرة من موربيدو بخصومات هائلة مع خدمة التوصيل المجاني لكل مصر.',
      badge: sitePhrases?.slide2_badge || 'عرض العروسة - توصيل مجاني',
      ctaText: 'تسوق عروض موربيدو',
      actionType: 'promo' as const,
      bgGradient: 'from-[#05211d] via-[#103F39] to-[#1C5D54]',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1yeyfL5rFcxmWQ3ltVBdZ6MWF0G_Yf7Mv3nouvX4Y9BFiNnCeWKqJZhIacchBJ8JeeLl-RhVn002j5vRCl4hvDUo_nm_AuSjCX0E9SAYb-ik44hmb0uW_IUGSePgPZpuTrzpQdhKXXAQ81_R5sL9R_imNsqUvcfsCMrGcjLNtGILiTVL6CMnX_Oqcf4ZGxqTzI7mcbZh0iyursCdK0tm1NXUBq4Z4LRYks3XTYlmnz0K-h1GKkdAR'
    },
    {
      id: 3,
      title: sitePhrases?.slide3_title || 'مخدات موربيدو الطبية الداعمة للرقبة',
      subtitle: sitePhrases?.slide3_subtitle || 'رغوة ميموري فوم مبردة ولاتكس طبيعي ١٠٠٪',
      description: sitePhrases?.slide3_description || 'ودع آلام الصداع وتيبس الكتف عند الاستيقاظ. مخداتنا الطبية من موربيدو تنسجم فوراً مع انحناءات رقبتك ومغطاة بنسيج قطن مصري طبيعي ناعم.',
      badge: sitePhrases?.slide3_badge || 'طبي معتمد ١٠٠٪',
      ctaText: 'اكتشف المخدات الطبية',
      actionType: 'catalog' as const,
      bgGradient: 'from-[#0A0F1D] via-[#1E293B] to-[#334155]',
      imageUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLuTrDw_AADRm_pjylOSbAVFkLmWei5gfYGNVGj2BDy5aqlgGsx0F4734ljPLtFJwPwoenI56NlPJ3hpu553dMUYIgfcYWYAW6QncW-tyJkomW6Hww4Yn7KLD0tNdUss6-UtU-uPctMQ_plzoqFLvONGlO4iGiKR8F16ZsFJSY5p7Co7e52JU9wKMpxXW3Oxzc0O9xWZlpX3jk56RIVFZ-s6HpkCwFvfh4XX2CYd1tL6B6ekDdbWholdwQ'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleCtaClick = (type: string) => {
    if (type === 'catalog') {
      onNavigateCategory('all');
      const catalog = document.getElementById('product-catalog');
      if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'warranty') {
      onOpenWarranty();
    } else if (type === 'promo') {
      onActivatePromo();
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-xl h-[450px] sm:h-[500px] lg:h-[580px] bg-[#121615]">
      {/* Background slider slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Overlay gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-l ${slides[currentSlide].bgGradient} opacity-90 z-10`} />
          <img
            src={slides[currentSlide].imageUrl}
            alt={slides[currentSlide].title}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Slide Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 lg:px-16 text-right max-w-4xl mr-auto sm:mr-0 ml-auto select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Promo Badge */}
            <div className="inline-flex items-center gap-1.5 bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-light px-3.5 py-1.5 rounded-full text-xs font-bold w-fit self-end">
              <Sparkles className="w-4 h-4 text-primary-light" />
              <span>{slides[currentSlide].badge}</span>
            </div>

            {/* Subtitle */}
            <h3 className="text-primary-light text-base sm:text-lg lg:text-xl font-bold tracking-wide">
              {slides[currentSlide].subtitle}
            </h3>

            {/* Main title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {slides[currentSlide].title}
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-xs sm:text-sm lg:text-base max-w-2xl leading-relaxed font-light">
              {slides[currentSlide].description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2 justify-start">
              <button
                onClick={() => handleCtaClick(slides[currentSlide].actionType)}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{slides[currentSlide].ctaText}</span>
              </button>

              <button
                onClick={onOpenWarranty}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-primary-light" />
                <span>تفعيل الضمان الإلكتروني</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-300 cursor-pointer hover:scale-105"
        title="السابق"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-300 cursor-pointer hover:scale-105"
        title="التالي"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === index ? 'w-8 bg-primary' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
