import { Globe, Youtube, MapPin, PhoneCall, ShieldCheck, Mail } from 'lucide-react';
import MorbidoLogo from './MorbidoLogo';

interface FooterProps {
  onCategoryChange: (category: string) => void;
  onOpenWarranty: () => void;
}

export default function Footer({ onCategoryChange, onOpenWarranty }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleCategoryClick = (catId: string) => {
    onCategoryChange(catId);
    // Scroll to products
    const grid = document.getElementById('product-catalog');
    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0F1E2E] text-white pt-16 pb-24 md:pb-12 border-t-4 border-[#004D95]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-right">
          
          {/* Col 1: Brand details */}
          <div className="space-y-4">
            <MorbidoLogo variant="vertical" showText={true} textColor="light" className="!items-start !text-right" />
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              تأسست شركة موربيدو (Morbido) لصناعة المراتب والمفروشات الفندقية على قيم الجودة الفائقة والراحة الملوكية. نبتكر بأحدث التقنيات الطبية لدعم العمود الفقري والظهر لنمنحكم أهدأ نوم وأجمل أحلام.
            </p>
            <div className="flex items-center gap-4 justify-start">
              <a 
                href="https://morbido-bed.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300"
                title="الموقع الرسمي لموربيدو"
              >
                <Globe className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300"
                title="يوتيوب"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-r-4 border-[#004D95] pr-3 text-white">الأقسام الرئيسية</h3>
            <ul className="space-y-2 text-sm text-gray-400 font-light">
              <li>
                <button 
                  onClick={() => handleCategoryClick('mattresses')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  مراتب طبية وسوست منفصلة
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('pillows')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  مخدات طبية وميموري فوم
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('bedding')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  مفروشات ولحف فندقية فاخرة
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('all')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  المنتجات الموصى بها طبياً
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Useful Links */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-r-4 border-[#004D95] pr-3 text-white">روابط هامة للمساعدة</h3>
            <ul className="space-y-2 text-sm text-gray-400 font-light">
              <li>
                <button 
                  onClick={onOpenWarranty}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full flex items-center justify-end gap-1"
                >
                  <span>تفعيل ضمان مرتبتك إلكترونياً</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#49B2A4]" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => alert('نحن في موربيدو نلتزم بحماية خصوصيتك بالكامل. جميع بياناتك الشخصية آمنة ومحفوظة.')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  سياسة الخصوصية والأمان لموربيدو
                </button>
              </li>
              <li>
                <button 
                  onClick={() => alert('تطبق الشروط والأحكام الخاصة بشركة موربيدو للمراتب والمفروشات في جمهورية مصر العربية.')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  الشروط والأحكام العامة للبيع والضمان
                </button>
              </li>
              <li>
                <button 
                  onClick={() => alert('يحق للعميل استبدال أو استرجاع المنتجات غير المستخدمة في غلافها الأصلي خلال ١٤ يوماً من تاريخ الشراء.')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  سياسة الاستبدال والاسترجاع والضمان
                </button>
              </li>
              <li>
                <button 
                  onClick={() => alert('الأسئلة الشائعة:\n\nس: هل تتوفر خدمة التوصيل للمنزل؟\nج: نعم، توصيل مجاني لكل محافظات مصر في أسرع وقت.\n\nس: ما هي مدة ضمان مراتب موربيدو؟\nج: ضمان حقيقي ومعتمد لمدة ١٠ سنوات ضد عيوب التصنيع وهبوط المرتبة.\n\nس: كيف أقوم بتنظيف مخدة الميموري فوم؟\nج: يتم غسل الغطاء الخارجي القطني فقط بسحاب ولا تغسل حشوة الفوم بالماء.')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  الأسئلة الشائعة عن منتجات موربيدو
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Secure Payments */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-r-4 border-[#004D95] pr-3 text-white">اتصل بنا (طلب سريع)</h3>
            <div className="space-y-3 text-sm text-gray-300 font-light">
              <div className="flex items-start gap-3 justify-end text-right">
                <p className="text-xs text-gray-400">
                  جمهورية مصر العربية - المنطقة الصناعية - مصانع موربيدو للمراتب والمفروشات
                </p>
                <MapPin className="w-5 h-5 text-[#49B2A4] shrink-0" />
              </div>
              
              <div className="flex items-center gap-3 justify-end pt-2">
                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-black text-[#49B2A4]" dir="ltr">01034462884</p>
                  <p className="text-[10px] text-gray-400">الخط الساخن والطلب السريع بالتليفون</p>
                </div>
                <PhoneCall className="w-6 h-6 text-[#49B2A4] shrink-0 animate-bounce" />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2 text-xs">
                <span>info@morbido-bed.com</span>
                <Mail className="w-4 h-4 text-[#49B2A4] shrink-0" />
              </div>
            </div>

            {/* Secure Payments Block */}
            <div className="pt-4 border-t border-white/10 text-right">
              <p className="text-xs text-gray-400 mb-3">طرق الدفع الآمنة والمعتمدة</p>
              <div className="flex gap-2 justify-end">
                <span className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors rounded text-[10px] font-bold text-gray-200 uppercase tracking-wider">
                  الدفع عند الاستلام (CASH)
                </span>
                <span className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors rounded text-[10px] font-bold text-gray-200 uppercase tracking-wider">
                  VISA / MASTERCARD
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright and Tax Info Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-light text-center sm:text-right">
          <div className="space-y-1">
            <p>© {currentYear} جميع الحقوق محفوظة لمصانع موربيدو (Morbido) لصناعة المراتب والمفروشات الفاخرة</p>
            <p className="text-gray-600 hover:text-gray-400 transition-colors">
              تم تطويره بواسطة <span className="font-bold text-[#49B2A4]">yasseen sabry elawamy</span>
            </p>
          </div>
          <div className="flex items-center gap-4 justify-center">
            <span>الرقم الضريبي الموحد: ٥٢٥ - ٩٦٥ - ١٢٢</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
