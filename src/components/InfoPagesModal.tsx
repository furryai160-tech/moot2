import { useState } from 'react';
import { 
  X, ShieldCheck, FileText, RefreshCw, HelpCircle, Lock, 
  CheckCircle2, ChevronDown, ChevronUp, Phone, Truck, Award 
} from 'lucide-react';

export type InfoTabType = 'privacy' | 'terms' | 'returns' | 'faq';

interface InfoPagesModalProps {
  initialTab?: InfoTabType;
  onClose: () => void;
  onOpenWarranty?: () => void;
}

export default function InfoPagesModal({ initialTab = 'privacy', onClose, onOpenWarranty }: InfoPagesModalProps) {
  const [activeTab, setActiveTab] = useState<InfoTabType>(initialTab);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const tabs = [
    {
      id: 'privacy' as InfoTabType,
      title: 'سياسة الخصوصية والأمان',
      icon: Lock,
    },
    {
      id: 'terms' as InfoTabType,
      title: 'الشروط والأحكام العامة',
      icon: FileText,
    },
    {
      id: 'returns' as InfoTabType,
      title: 'سياسة الاستبدال والاسترجاع',
      icon: RefreshCw,
    },
    {
      id: 'faq' as InfoTabType,
      title: 'الأسئلة الشائعة',
      icon: HelpCircle,
    },
  ];

  const faqs = [
    {
      q: 'ما هي الميزة الرئيسية لمراتب السوست المنفصلة من موربيدo؟',
      a: 'تتميز مراتب السوست المنفصلة (Pocket Springs) من موربيدو بعزل الحركة تماماً؛ حيث تعبأ كل سوستة داخل جيب قماشي منفصل من الفازلين غير المنسوج، مما يعني عدم تأثر الشريك أثناء النوم أو الحركة، مع توزيع استثنائي لوزن الجسم ودعم فقرى دقيق لكل فقرات الظهر.'
    },
    {
      q: 'ما هي مدة الضمان وكيف أقوم بتفعيله؟',
      a: 'تمنحك شركة موربيدو ضماناً حقيقياً ومعتمداً لمدة ١٠ سنوات على المراتب الطبية والسوست ضد عيوب التصنيع أو هبوط الشاسيه. يمكنك تفعيل الضمان بسهولة من خلال رابط "تفعيل الضمان إلكترونياً" في موقعنا وإرفاق صورة الفاتورة ورقم السيريال.'
    },
    {
      q: 'كيف أختار المقاس والارتفاع المناسب لسريري؟',
      a: 'يرجى قياس أبعاد السرير الداخلية (الطول × العرض) بالسنتمتر بدقة قبل الطلب. تتوفر مراتب موربيدو بارتفاعات متعددة (٢٥ سم، ٢٨ سم، ٣٠ سم، ٣٢ سم). إذا كان عمق مجرى السرير صغيراً يُفضل ارتفاع ٢٥ أو ٢٨ سم، بينما الارتفاعات الكبيرة ٣٠ و٣٢ سم تناسب السراير مودرن والفندقية ذات العمق المنخفض.'
    },
    {
      q: 'هل المخدة الطبية الميموري فوم قابلة للغسيل بالماء؟',
      a: 'لا تُغسل حشوة الميموري فوم الداخلية بالماء نهائياً لتجنب تلف جزيئات الفوم الذكي. بدلاً من ذلك، تحتوي مخدات موربيدو الطبية على غطاء قطني خارجي مزود بسحاب قابل للفك والغسيل في الغسالة الكهربائية بسهولة للحفاظ على النظافة والتعقيم.'
    },
    {
      q: 'ما هي مدة التوصيل وتكلفة الشحن للمحافظات؟',
      a: 'نقوم بتوصيل طلبات المراتب والمفروشات لجميع المحافظات بجمهورية مصر العربية (القاهرة، الدلتا، الإسكندرية، والصعيد) خلال ٢ إلى ٥ أيام عمل. التوصيل مجاني أو برسوم رمزية محددة بوضوح عند تأكيد الطلب.'
    },
    {
      q: 'هل يمكنني معاينة المنتجات عند الاستلام قبل الدفع؟',
      a: 'نعم بالتأكيد! تتيح موربيدو خيار الدفع عند الاستلام (COD) مع إمكانية فتح الكرتون الخارجي ومعاينة خامة القماش والتغليف وجودة التقفيل بحضور المندوب قبل السداد.'
    },
    {
      q: 'ما هي وسائل الدفع المتاحة على موقع موربيدو؟',
      a: 'نوفر وسائل دفع متعددة تناسب جميع العملاء: الدفع نقداً عند الاستلام (Cash on Delivery)، أو الدفع الإلكتروني عبر بطاقات الفيزا والماستر كارد والمحافظ الإلكترونية بالربط مع بوابة "فواتيرك" الآمنة والمعتمدة.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-border-light flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-[#0F1E2E] text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-[#004D95] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004D95]/40 border border-[#004D95] flex items-center justify-center text-[#49B2A4]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                روابط هامة ومعلومات الخدمة
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                موربيدو للمراتب والمفروشات - دليل الجودة والسياسات الرسمية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-100/80 border-b border-gray-200 p-2 flex items-center gap-1.5 overflow-x-auto shrink-0 dir-rtl scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#004D95] text-white shadow-sm'
                    : 'bg-white/60 text-gray-600 hover:bg-white hover:text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#49B2A4]' : 'text-gray-400'}`} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-right dir-rtl leading-relaxed text-charcoal">
          
          {/* TAB 1: Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-r-4 border-[#004D95] pr-4 bg-primary/5 p-4 rounded-l-xl">
                <h3 className="text-base sm:text-lg font-black text-[#004D95] mb-1">
                  سياسة الخصوصية والأمان لموربيدو (Morbido Privacy Policy)
                </h3>
                <p className="text-xs sm:text-sm text-muted-gray">
                  تلتزم شركة موربيدو بحماية بياناتك الشخصية وتوفير أعلى معايير الأمان والتشفير لكافة معاملاتك الإلكترونية عبر موقعنا.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#49B2A4]" />
                    ١. البيانات التي نقوم بجمعها
                  </h4>
                  <p className="text-gray-600 pr-6">
                    نقوم بجمع البيانات الضرورية فقط لتنفيذ طلبك وتوصيل المراتب والمفروشات إلى باب منزلك، وتشمل: (الاسم الكامل، رقم الهاتف للتواصل والواتساب، عنوان التوصيل بالتفصيل، والمدينة).
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#49B2A4]" />
                    ٢. حماية البيانات وأمان المعاملات المالية
                  </h4>
                  <p className="text-gray-600 pr-6">
                    جميع المعاملات المالية والبطاقات البنكية تتم تشفيرها بالكامل بواسطة بروتوكول SSL بأسلوب 256-bit عبر بوابة "فواتيرك" المرخصة من البنك المركزي المصري. نحن لا نقوم بتخزين أرقام بطاقاتك الائتمانية أو بيانات الأمان الخاصة بها نهائياً على خوادمنا.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#49B2A4]" />
                    ٣. سرية المعلومات وعدم المشاركة
                  </h4>
                  <p className="text-gray-600 pr-6">
                    نتعهد بعدم بيع أو تأجير أو إتاحة بياناتك الشخصية لأي طرف ثالث لأغراض تسويقية. يتم مشاركة عنوانك ورقم هاتفك فقط مع شركة الشحن المعتمدة لموربيدو لغرض توصيل الطلب.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#49B2A4]" />
                    ٤. حقوق العميل
                  </h4>
                  <p className="text-gray-600 pr-6">
                    يحق لك في أي وقت تعديل بياناتك أو طلب حذف حسابك وسجل طلباتك نهائياً من قاعدة بياناتنا بالتواصل المباشر مع خدمة العملاء هاتفياً أو عبر الواتساب على الرقم: <strong>01034462884</strong>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: Terms and Conditions */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-r-4 border-[#004D95] pr-4 bg-primary/5 p-4 rounded-l-xl">
                <h3 className="text-base sm:text-lg font-black text-[#004D95] mb-1">
                  الشروط والأحكام العامة للبيع والضمان (Terms & Conditions)
                </h3>
                <p className="text-xs sm:text-sm text-muted-gray">
                  يسري استخدامك لموقع موربيدو وإتمام طلبات الشراء بناءً على الأحكام والشروط التنظيمية المبينة أدناه وفقاً للقوانين المصرية وحماية المستهلك.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#49B2A4]" />
                    ١. دقة المواصفات والقياسات
                  </h4>
                  <p className="text-gray-600 pr-6">
                    جميع المنتجات المعروضة من مراتب ومخدات ومفروشات تطابق المواصفات القياسية الطبية المعلنة. يلتزم العميل بمراجعة أبعاد السرير قبل الشراء، حيث يُصنع كل منتج بأعلى جودة واختبارات ضغط متطورة.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#49B2A4]" />
                    ٢. شروط الضمان الـ ١٠ سنوات
                  </h4>
                  <p className="text-gray-600 pr-6">
                    تضمن موربيدو المراتب لمدة 10 سنوات ضد هبوط الشاسيه أو عيوب التصنيع في السوست والطبقات الإسفنجية. لا يشمل الضمان التلف النتايج عن سوء الاستخدام (مثل سكب السوائل، الحرق، الاستخدام بدون ملائات حماية، أو ثني المرتبة بأبعاد لا تسمح بذلك).
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#49B2A4]" />
                    ٣. الأسعار والتخفيضات
                  </h4>
                  <p className="text-gray-600 pr-6">
                    جميع الأسعار المعروضة بالجنيه المصري وشاملة للضرائب المقررة. تحتفظ الشركة بحق تعديل العروض والتخفيضات في أي وقت دون إشعار مسبق مع الالتزام بالأسعار المعلنة للطلبات المؤكدة.
                  </p>
                </section>

                {onOpenWarranty && (
                  <div className="bg-[#004D95]/10 border border-[#004D95]/20 p-4 rounded-xl flex items-center justify-between gap-4 mt-6">
                    <div>
                      <p className="font-bold text-primary text-xs sm:text-sm">هل قمت بشراء مرتبة موربيدو مؤخراً؟</p>
                      <p className="text-xs text-gray-600">قم بتفعيل شهادة الضمان الرقمية الخاصة بك الآن للحصول على التغطية الفورية.</p>
                    </div>
                    <button
                      onClick={() => { onClose(); onOpenWarranty(); }}
                      className="bg-[#004D95] hover:bg-[#003A70] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
                    >
                      تفعيل الضمان الان
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Returns & Replacement */}
          {activeTab === 'returns' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-r-4 border-[#004D95] pr-4 bg-primary/5 p-4 rounded-l-xl">
                <h3 className="text-base sm:text-lg font-black text-[#004D95] mb-1">
                  سياسة الاستبدال والاسترجاع والضمان (Exchange & Return Policy)
                </h3>
                <p className="text-xs sm:text-sm text-muted-gray">
                  حرصاً منا على رضاكم التام ورعاية صحتك ونومك، نضمن لك تجربة تسوق آمنة وسلسة وفقاً لقانون حماية المستهلك المصري رقم 181 لسنة 2018.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">حق الاسترجاع ١٤ يوماً</span>
                    <p className="text-xs text-gray-700 leading-relaxed pt-1">
                      يحق للعميل استبدال أو استرجاع المنتج خلال ١٤ يوماً من تاريخ الاستلام بشرط أن يكون المنتج في غلافه البلاستيكي الأصلي المغلق تماماً ودون أي استخدام.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">الاستثناءات الصحية</span>
                    <p className="text-xs text-gray-700 leading-relaxed pt-1">
                      وفقاً لمعايير الصحة العامة والوقاية، لا يجوز استبدال أو استرجاع المخدات واللحف والملائات أو المراتب بعد فك غلافها النيلون الشفاف نهائياً.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h4 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#49B2A4]" />
                    إجراءات وخطوات طلب الاستبدال:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 pr-2">
                    <li>التواصل مع فريق الدعم الفني لموربيدو عبر الهاتف أو الواتساب على <strong>01034462884</strong>.</li>
                    <li>تقديم رقم الطلب ورقم الفاتورة وصورة للتغليف الأصلي للمنتج.</li>
                    <li>يقوم المندوب بزيارتك لفحص واستلام المنتج خلال ٣ إلى ٥ أيام عمل.</li>
                    <li>في حالة وجود عيب تصنيع مثبت عند الفتح، يتم الاستبدال مجاناً بالكامل دون تحميل العميل أي مصاريف شحن.</li>
                    <li>في حالة طلب الاستبدال لرغبة العميل (مثل تغيير المقاس)، يتحمل العميل فارق التكلفة ومصاريف الشحن الفعلية.</li>
                  </ol>
                </section>
              </div>
            </div>
          )}

          {/* TAB 4: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-r-4 border-[#004D95] pr-4 bg-primary/5 p-4 rounded-l-xl">
                <h3 className="text-base sm:text-lg font-black text-[#004D95] mb-1">
                  الأسئلة الشائعة عن منتجات موربيدو (Morbido FAQs)
                </h3>
                <p className="text-xs sm:text-sm text-muted-gray">
                  إليك الإجابات الشافية عن أبرز استفسارات عملائنا الكرام حول اختيار المراتب والمخدات الطبية والشحن والضمان.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div 
                      key={idx}
                      className="border border-gray-200 rounded-xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full text-right p-4 font-bold text-xs sm:text-sm text-charcoal flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer gap-3"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#004D95] shrink-0" />
                          <span>{faq.q}</span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#004D95] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-1 text-xs sm:text-sm text-gray-600 border-t border-gray-100 bg-gray-50/50 leading-relaxed animate-in fade-in duration-150">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer help contact */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-right dir-rtl shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-4 h-4 text-[#004D95]" />
            <span>هل لديك أي استفسار آخر؟ اتصل بالمستشار الطبي لموربيدو: <strong>01034462884</strong></span>
          </div>

          <button
            onClick={onClose}
            className="bg-[#004D95] hover:bg-[#003A70] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer w-full sm:w-auto"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
}
