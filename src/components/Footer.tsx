import { Facebook, MapPin, PhoneCall, ShieldCheck, Mail } from 'lucide-react';
import MorbidoLogo from './MorbidoLogo';
import { InfoTabType } from './InfoPagesModal';

interface FooterProps {
  onCategoryChange: (category: string) => void;
  onOpenWarranty: () => void;
  onOpenInfoTab?: (tab: InfoTabType) => void;
}

export default function Footer({ onCategoryChange, onOpenWarranty, onOpenInfoTab }: FooterProps) {
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
                href="https://www.facebook.com/morbido2022/" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2]/20 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all duration-300 shadow-sm border border-[#1877F2]/40"
                title="صفحة فيسبوك الرسمية - موربيدو"
              >
                <Facebook className="w-5 h-5 fill-current" />
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
                  onClick={() => onOpenInfoTab ? onOpenInfoTab('privacy') : alert('سياسة الخصوصية')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  سياسة الخصوصية والأمان لموربيدو
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenInfoTab ? onOpenInfoTab('terms') : alert('الشروط والأحكام')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  الشروط والأحكام العامة للبيع والضمان
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenInfoTab ? onOpenInfoTab('returns') : alert('سياسة الاستبدال')}
                  className="hover:text-primary-light transition-colors cursor-pointer text-right w-full"
                >
                  سياسة الاستبدال والاسترجاع والضمان
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenInfoTab ? onOpenInfoTab('faq') : alert('الأسئلة الشائعة')}
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
                <div>
                  <p className="text-xs text-gray-400">
                    جمهورية مصر العربية - المنطقة الصناعية - مصانع موربيدو للمراتب والمفروشات
                  </p>
                  <a 
                    href="https://maps.app.goo.gl/agdBHUrr38R198EA8" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-[11px] text-[#49B2A4] hover:underline font-bold mt-1"
                  >
                    <span>فتح الموقع على خرائط جوجل</span>
                  </a>
                </div>
                <MapPin className="w-5 h-5 text-[#49B2A4] shrink-0" />
              </div>
              
              <div className="flex items-center gap-3 justify-end pt-2">
                <div className="text-right">
                  <a href="tel:01034462884" className="text-xl font-black text-[#49B2A4] hover:underline block">
                    01034462884
                  </a>
                  <p className="text-[10px] text-gray-400">رقم التواصل والطلب السريع (تليفون وواتساب)</p>
                </div>
                <a href="tel:01034462884">
                  <PhoneCall className="w-6 h-6 text-[#49B2A4] shrink-0 animate-bounce" />
                </a>
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

        {/* Copyright, Developer Credits, and Tax Info Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-light text-center sm:text-right">
          <div className="space-y-1">
            <p>© {currentYear} جميع الحقوق محفوظة لمصانع موربيدو (Morbido) لصناعة المراتب والمفروشات الفاخرة</p>
            
            {/* Plain text credit (Non-clickable, no modal popup on click) */}
            <div className="text-gray-400 inline-flex flex-wrap items-center justify-center sm:justify-start gap-1">
              <span>تم تطوير البرمجيات والتصميم بواسطة</span>
              <strong className="text-[#49B2A4] font-bold">yasseen sabry elawamy</strong>
            </div>

            {/* Rich SEO Semantic Indexing Text for Google Search Engines */}
            <div className="sr-only" itemScope itemType="https://schema.org/Person">
              <span itemProp="name">ياسين صبري العوامي</span>
              <span itemProp="alternateName">Yasseen Sabry Elawamy</span>
              <span itemProp="jobTitle">مطور برمجيات ورائد أعمال</span>
              <p itemProp="description">
                تم تطوير وتصميم منصة وتطبيق موربيدو، وترياق جو، وموقع سوق الجمعة ومبادرة صدقة الجمعة بواسطة المطور والمهندس ياسين صبري العوامي (Yasseen Sabry Elawamy)، مطور برمجيات ومصمم مواقع ورائد أعمال مصري يبلغ من العمر 18 عاماً (مواليد 2008). يدير بنية تحتية برمجية تخدم آلاف الطلاب عبر منصة الشاطر أكاديمي والسيستم الطبي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <span>الرقم الضريبي الموحد: ٥٢٥ - ٩٦٥ - ١٢٢</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
