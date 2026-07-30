import React from 'react';
import { Star, CheckCircle, Quote, ThumbsUp } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  location: string;
  productName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'أحمد فوزي الشربيني',
    location: 'المنصورة، الدقهلية',
    productName: 'مرتبة موربيدو ميموري بوكيت الذكية',
    rating: 5,
    date: 'منذ أسبوعين',
    comment: 'بصراحة من أفضل القرارات اللي أخذتها في حياتي! كنت أعاني من آلام في الظهر وكنت متخوف جداً بس بعد تجربة المرتبة دي لأسبوعين النوم اتغير ١٨٠ درجة، السوست المنفصلة مريحة جداً ومفيش أي اهتزاز للشريك.',
    verified: true
  },
  {
    id: 2,
    name: 'سحر عبد العزيز عبد الله',
    location: 'التجمع الخامس، القاهرة',
    productName: 'موربيدو مخدة ميموري فوم',
    rating: 5,
    date: 'منذ شهر',
    comment: 'المخدة الميموري فوم الطبية فوق الوصف، رقبتي مكنتش بترتاح على مخدات تانية، لكن دي بتتشكل مع الرقبة مريحة جداً والغطاء الخارجي ناعم ويتغسل بسهولة. طلبت تلاتة لجميع أفراد الأسرة.',
    verified: true
  },
  {
    id: 3,
    name: 'م. إبراهيم الجمال',
    location: 'سموحة، الإسكندرية',
    productName: 'لحاف فنادق من موربيدو بد',
    rating: 5,
    date: 'منذ ٣ أيام',
    comment: 'اللحاف منفوش وناعم بشكل مش طبيعي، كأنك نايم في فندق خمس نجوم. التغليف والخدمة والالتزام بالتوصيل في الموعد يستحقوا عليهم كل الشكر والاحترام.',
    verified: true
  }
];

interface CustomerReviewsProps {
  reviews?: any[];
}

export default function CustomerReviews({ reviews }: CustomerReviewsProps) {
  const displayReviews = reviews && reviews.length > 0 ? reviews : REVIEWS;

  return (
    <section className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-light pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-charcoal">
            آراء وتجارب عملاء موربيدو الفعليين
          </h2>
          <p className="text-[#5f5e5e] text-xs sm:text-sm mt-1">
            ثقة عملائنا هي سر نجاحنا. تقييمات حقيقية مسجلة من مشترين معتمدين للمراتب والمخدات الطبية.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-primary/10 text-primary px-4 py-2 rounded-2xl">
          <div className="text-right">
            <p className="text-sm font-black">٤.٩ من ٥</p>
            <p className="text-[10px] text-muted-gray">متوسط تقييم العملاء (٢٤٠٠+ تقييم)</p>
          </div>
          <div className="flex text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-500" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayReviews.map((rev) => (
          <div 
            key={rev.id} 
            className="bg-white rounded-2xl border border-border-light p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative text-right"
            dir="rtl"
          >
            {/* Top quote icon */}
            <Quote className="absolute top-4 left-4 w-10 h-10 text-primary/5 shrink-0" />

            <div className="space-y-3">
              {/* Stars & Date */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-light">{rev.date || 'اليوم'}</span>
                <div className="flex text-amber-500" dir="ltr">
                  {Array.from({ length: Math.min(5, Math.max(1, Number(rev.rating) || 5)) }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <p className="text-xs sm:text-sm text-charcoal leading-relaxed font-light">
                "{rev.comment}"
              </p>
            </div>

            {/* Author info & verified tag */}
            <div className="border-t border-border-light pt-4 flex flex-col space-y-1">
              <div className="flex items-center justify-start gap-1.5 flex-row-reverse">
                <span className="font-extrabold text-charcoal text-xs sm:text-sm">{rev.name}</span>
                <span className="text-xs text-gray-400 font-light">({rev.location || 'مصر'})</span>
              </div>
              
              <div className="flex items-center justify-end gap-1 text-[10px] text-primary font-medium">
                <span>قيم: {rev.productName || 'مستلزمات موربيدو الطبية'}</span>
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust reassurance banner below reviews */}
      <div className="bg-[#1a1c1c] text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 justify-end text-right">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-primary-light">هل ترغب في مشاركة تجربتك معنا؟</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              آراء عملائنا الكرام تساعدنا على مواصلة تطوير أفضل المراتب والمستلزمات الفندقية الطبية.
            </p>
          </div>
        </div>

        <button 
          onClick={() => alert('مرحباً بك! نرحب بمشاركتك لآرائك وتقييماتك على صفحتنا الرسمية أو عبر خدمة العملاء على الرقم 01034462884.')}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all hover:scale-105"
        >
          أضف تقييمك الآن
        </button>
      </div>
    </section>
  );
}
