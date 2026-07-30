import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, ShoppingCart, HelpCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data';

interface SleepQuizProps {
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    value: string;
    desc: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'ما هي وضعية النوم المفضلة لديك؟',
    options: [
      { label: 'النوم على الجانب', value: 'side', desc: 'تحتاج مخدة متوسطة الارتفاع لدعم الفراغ بين الأذن والكتف' },
      { label: 'النوم على الظهر', value: 'back', desc: 'تحتاج دعم طبي متوسط لفقرات الرقبة والعمود الفقري' },
      { label: 'النوم على البطن', value: 'stomach', desc: 'تحتاج مخدة منخفضة وناعمة لتجنب إجهاد الرقبة' },
      { label: 'متقلب طوال الليل', value: 'toss', desc: 'تحتاج وسادة مرنة ومرتبة ذكية تعزل الحركة وتتكيف مع حركتك' }
    ]
  },
  {
    id: 2,
    text: 'هل تشعر بأي من المتاعب التالية عند الاستيقاظ؟',
    options: [
      { label: 'آلام وتشنج في الرقبة والكتف', value: 'neck_pain', desc: 'رغوة الميموري فوم الطبية هي الخيار الأنسب لك' },
      { label: 'آلام في أسفل الظهر والعمود الفقري', value: 'back_pain', desc: 'تحتاج مرتبة طبية تدعم الظهر بقوة وتمنع الهبوط' },
      { label: 'حرارة زائدة وتعرق أثناء الليل', value: 'hot', desc: 'قنوات التهوية واللاتكس الطبيعي المبرد سيمنحك نوماً منعشاً' },
      { label: 'أشعر بالخمول أو الصداع الصباحي', value: 'headache', desc: 'نوعية نومك تحتاج إلى تحسين الدعم وتوزيع الوزن بالتساوي' },
      { label: 'لا توجد آلام، أبحث عن رفاهية إضافية', value: 'luxury', desc: 'تستحق تجربة لحاف الريش الفندقي أو مرتبة بوكيت الذكية' }
    ]
  },
  {
    id: 3,
    text: 'ما هو مستوى الملمس أو الصلابة المفضل لديك؟',
    options: [
      { label: 'ناعم وغائر كالغيمة والريش', value: 'soft', desc: 'ألياف بديل الريش والمايكروفايبر المنفوش' },
      { label: 'متوسط الدعم والارتداد المرن', value: 'medium', desc: 'لاتكس طبيعي ١٠٠٪ مرن أو ميموري فوم هلامي' },
      { label: 'متماسك وصلب لدعم الفقرات', value: 'firm', desc: 'إسفنج طبي مضغوط مع سوست كربونية قوية' }
    ]
  }
];

export default function SleepQuiz({ onAddToCart, onOpenDetails }: SleepQuizProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);

  const handleOptionSelect = (qValue: string) => {
    const key = `q${currentStep + 1}`;
    const newAnswers = { ...answers, [key]: qValue };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate recommendation on final step
      calculateRecommendation(newAnswers);
    }
  };

  const calculateRecommendation = (finalAnswers: Record<string, string>) => {
    const q1 = finalAnswers.q1; // side, back, stomach, toss
    const q2 = finalAnswers.q2; // neck_pain, back_pain, hot, headache, luxury
    const q3 = finalAnswers.q3; // soft, medium, firm

    let matchedId = 'pillow-memory-foam'; // default fallback

    if (q2 === 'back_pain' || q3 === 'firm') {
      matchedId = 'mattress-orthopedic';
    } else if (q1 === 'toss' && q2 === 'luxury') {
      matchedId = 'mattress-pocket-spring';
    } else if (q2 === 'hot' || q3 === 'medium') {
      matchedId = 'pillow-natural-latex';
    } else if (q2 === 'neck_pain') {
      matchedId = 'pillow-memory-foam';
    } else if (q3 === 'soft') {
      matchedId = 'quilt-hotel-style';
    } else {
      matchedId = 'pillow-comfort-fiber';
    }

    const product = INITIAL_PRODUCTS.find(p => p.id === matchedId) || INITIAL_PRODUCTS[0];
    setRecommendedProduct(product);
    setCurrentStep(QUESTIONS.length); // go to result step
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendedProduct(null);
  };

  const progressPercentage = (currentStep / QUESTIONS.length) * 100;

  return (
    <section className="bg-white rounded-3xl border border-border-light shadow-md p-6 sm:p-8 text-right overflow-hidden relative">
      {/* Background elegant accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-light/10 rounded-full blur-2xl -z-10" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border-light pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-charcoal flex items-center gap-2 justify-end">
            <span>مستشار النوم الذكي من موربيدو</span>
            <Sparkles className="w-5 h-5 text-primary" />
          </h2>
          <p className="text-[#5f5e5e] text-xs sm:text-sm mt-1">
            أجب عن ٣ أسئلة بسيطة وسهلة لنقترح لك المخدة الطبية أو المرتبة الملائمة تماماً لراحة ظهرك وجسدك
          </p>
        </div>

        {currentStep < QUESTIONS.length && (
          <div className="text-xs sm:text-sm text-primary font-bold bg-primary/10 px-3.5 py-1.5 rounded-full">
            السؤال {(currentStep + 1).toLocaleString('ar-EG')} من {QUESTIONS.length.toLocaleString('ar-EG')}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {currentStep < QUESTIONS.length && (
        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep < QUESTIONS.length ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Question Title */}
            <h3 className="text-lg sm:text-xl font-extrabold text-charcoal">
              {QUESTIONS[currentStep].text}
            </h3>

            {/* Options list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUESTIONS[currentStep].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionSelect(opt.value)}
                  className="p-4 sm:p-5 text-right rounded-2xl border-2 border-border-light hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer group flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3 justify-end w-full">
                    <span className="font-extrabold text-charcoal text-sm sm:text-base group-hover:text-primary transition-colors text-right">
                      {opt.label}
                    </span>
                    <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                  {opt.desc && (
                    <p className="text-xs text-muted-gray mt-1.5 pr-7 text-right leading-relaxed font-light">
                      {opt.desc}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Back button */}
            {currentStep > 0 && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-xs sm:text-sm text-muted-gray hover:text-primary flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  <span>السؤال السابق</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* Result Step */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="p-6 sm:p-8 bg-gradient-to-br from-[#f8faf8] to-white rounded-2xl border border-primary/20 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-primary">تم حساب التوصية الطبية بنجاح!</h3>
              <p className="text-muted-gray text-xs sm:text-sm max-w-lg mx-auto">
                بناءً على تفضيلاتك ووضعية نومك والمشاكل الصحية المذكورة، وجدنا أن هذا المنتج الفاخر من موربيدو سيوفر لك ليلة نوم مثالية وخالية من الألم.
              </p>
            </div>

            {recommendedProduct && (
              <div className="border border-border-light rounded-2xl bg-white p-4 sm:p-6 flex flex-col md:flex-row-reverse items-center gap-6 shadow-sm">
                {/* Product Image */}
                <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                  <img
                    src={recommendedProduct.imageUrl}
                    alt={recommendedProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Product details */}
                <div className="flex-1 text-right space-y-3">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] sm:text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-md">
                      توصية طبية موصى بها
                    </span>
                    {recommendedProduct.tag && (
                      <span className="text-[10px] sm:text-xs bg-status-discount text-white font-bold px-2.5 py-1 rounded-md">
                        {recommendedProduct.tag}
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg sm:text-xl font-extrabold text-charcoal">
                    {recommendedProduct.name}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#5f5e5e] leading-relaxed font-light">
                    {recommendedProduct.description}
                  </p>

                  <div className="flex items-center gap-3 justify-end pt-2">
                    {recommendedProduct.oldPrice && (
                      <span className="text-xs sm:text-sm text-gray-400 line-through">
                        {recommendedProduct.oldPrice.toLocaleString('ar-EG')} جنيه
                      </span>
                    )}
                    <span className="text-lg sm:text-2xl font-black text-primary">
                      {recommendedProduct.price.toLocaleString('ar-EG')} <span className="text-xs font-normal text-muted-gray">جنيه مصري</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 justify-end pt-3">
                    <button
                      onClick={() => onOpenDetails(recommendedProduct)}
                      className="px-4 py-2.5 rounded-xl border border-border-light hover:border-primary hover:text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer bg-white"
                    >
                      التفاصيل والمواصفات
                    </button>
                    <button
                      onClick={() => onAddToCart(recommendedProduct, 1)}
                      className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>إضافة للسلة فوراً</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2 border-t border-border-light">
              <button
                onClick={handleReset}
                className="text-xs text-muted-gray hover:text-primary flex items-center gap-1.5 font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة إجراء الاختبار من جديد</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
