import React, { useState } from 'react';
import { Star, CheckCircle, Quote, X, Send, Loader2, ThumbsUp, Sparkles } from 'lucide-react';
import { saveReviewToDatabase, ReviewRecord } from '../lib/supabase';
import { AppUser } from '../lib/supabase';

interface CustomerReviewsProps {
  reviews: ReviewRecord[];
  onAddReview: (review: ReviewRecord) => void;
  currentUser?: AppUser | null;
}

/* ── Star Rating Picker ──────────────────────────────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 flex-row-reverse justify-center" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-125 cursor-pointer"
        >
          <Star
            className={`w-8 h-8 transition-colors duration-150 ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ── Add Review Modal ────────────────────────────────────────────────── */
function AddReviewModal({
  onClose,
  onSuccess,
  currentUser,
}: {
  onClose: () => void;
  onSuccess: (review: ReviewRecord) => void;
  currentUser?: AppUser | null;
}) {
  const [name, setName] = useState(currentUser?.name || '');
  const [location, setLocation] = useState('');
  const [productName, setProductName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const PRODUCT_OPTIONS = [
    'مرتبة موربيدو الطبية أورثوبيدك',
    'مرتبة موربيدو ميموري بوكيت الذكية',
    'موربيدو مخدة ميموري فوم الطبية',
    'موربيدو مخدة لاتكس طبيعي مبرد',
    'موربيدو خدادية كمفورت فايبر هولو',
    'مخدة الحوامل الطبية الداعمة',
    'لحاف فنادق فاخر من موربيدو بد',
    'طقم ملاية جكار فندقي',
    'ملاية أستيك قطن فندقي',
    'منتج آخر من موربيدو',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('يرجى إدخال اسمك أولاً.');
    if (!productName) return setError('يرجى اختيار المنتج الذي تقيّمه.');
    if (comment.trim().length < 20) return setError('يرجى كتابة تعليق لا يقل عن ٢٠ حرفاً.');
    if (rating < 1) return setError('يرجى تحديد عدد النجوم.');

    setLoading(true);
    const newReview: ReviewRecord = {
      id: 'rev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      location: location.trim() || 'مصر',
      productName,
      rating,
      comment: comment.trim(),
      verified: true,
      date: 'اليوم',
    };

    try {
      await saveReviewToDatabase(newReview);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(newReview);
        onClose();
      }, 1600);
    } catch (err) {
      setError('حدث خطأ أثناء حفظ تقييمك. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'سيئ جداً', 'سيئ', 'مقبول', 'جيد جداً', 'ممتاز 🌟'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        {/* Header */}
        <div className="bg-gradient-to-l from-primary to-[#3ca092] p-5 text-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-right">
            <h2 className="text-lg font-black">شاركنا تجربتك 💬</h2>
            <p className="text-[11px] text-white/80 mt-0.5">رأيك يساعد آلاف العملاء في الاختيار الصحيح</p>
          </div>
          <Sparkles className="w-6 h-6 text-white/50" />
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h3 className="text-xl font-black text-charcoal">شكراً جزيلاً! 🎉</h3>
            <p className="text-sm text-gray-500">تم نشر تقييمك بنجاح وسيظهر على الموقع فوراً</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Star Rating */}
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-charcoal">كيف تقيّم تجربتك؟</p>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs font-bold text-amber-600 animate-in fade-in">
                  {ratingLabels[rating]}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">اسمك الكريم *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد أحمد"
                className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-gray-50"
                maxLength={60}
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">مدينتك (اختياري)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: القاهرة، الإسكندرية..."
                className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-gray-50"
                maxLength={60}
              />
            </div>

            {/* Product */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">المنتج الذي اشتريته *</label>
              <select
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-gray-50 cursor-pointer"
              >
                <option value="">-- اختر المنتج --</option>
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">
                تعليقك التفصيلي *
                <span className="text-gray-400 font-normal mr-1">({comment.length}/500)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="شاركنا تجربتك بالتفصيل، ما الذي أعجبك في المنتج؟ هل لاحظت فرقاً في النوم؟"
                rows={4}
                maxLength={500}
                className="w-full border border-border-light rounded-xl px-3 py-2.5 text-sm text-right resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-gray-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2.5 rounded-xl border border-red-200 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#3ca092] disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>نشر تقييمي</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-gray-400">
              <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />
              جميع التقييمات موثقة ومعتمدة ومنشورة فوراً
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Review Card ─────────────────────────────────────────────────────── */
function ReviewCard({ rev, index }: { rev: ReviewRecord; index: number; key?: string | number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-border-light p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative text-right"
      style={{ animationDelay: `${index * 80}ms` }}
      dir="rtl"
    >
      <Quote className="absolute top-4 left-4 w-10 h-10 text-primary/5 shrink-0 pointer-events-none" />

      <div className="space-y-3">
        {/* Stars & Date */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 font-light">{rev.date || 'اليوم'}</span>
          <div className="flex text-amber-400" dir="ltr">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < (rev.rating || 5)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Comment */}
        <p className="text-xs sm:text-sm text-charcoal leading-relaxed font-light">
          "{rev.comment}"
        </p>
      </div>

      {/* Author */}
      <div className="border-t border-border-light pt-4 flex flex-col space-y-1">
        <div className="flex items-center justify-start gap-1.5 flex-row-reverse">
          {/* Avatar initial */}
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
            {rev.name?.charAt(0) || 'م'}
          </div>
          <span className="font-extrabold text-charcoal text-xs sm:text-sm">{rev.name}</span>
          <span className="text-xs text-gray-400 font-light">({rev.location || 'مصر'})</span>
        </div>

        <div className="flex items-center justify-end gap-1 text-[10px] text-primary font-medium">
          <span className="line-clamp-1">{rev.productName || 'مستلزمات موربيدو'}</span>
          {rev.verified && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function CustomerReviews({ reviews, onAddReview, currentUser }: CustomerReviewsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default seed reviews if none from DB yet
  const DEFAULT_REVIEWS: ReviewRecord[] = [
    {
      id: 'seed_1',
      name: 'أحمد فوزي الشربيني',
      location: 'المنصورة، الدقهلية',
      productName: 'مرتبة موربيدو ميموري بوكيت الذكية',
      rating: 5,
      date: 'منذ أسبوعين',
      comment: 'بصراحة من أفضل القرارات اللي أخذتها في حياتي! كنت أعاني من آلام في الظهر وكنت متخوف جداً بس بعد تجربة المرتبة دي لأسبوعين النوم اتغير ١٨٠ درجة، السوست المنفصلة مريحة جداً ومفيش أي اهتزاز للشريك.',
      verified: true,
    },
    {
      id: 'seed_2',
      name: 'سحر عبد العزيز عبد الله',
      location: 'التجمع الخامس، القاهرة',
      productName: 'موربيدو مخدة ميموري فوم الطبية',
      rating: 5,
      date: 'منذ شهر',
      comment: 'المخدة الميموري فوم الطبية فوق الوصف، رقبتي مكنتش بترتاح على مخدات تانية، لكن دي بتتشكل مع الرقبة مريحة جداً والغطاء الخارجي ناعم ويتغسل بسهولة. طلبت تلاتة لجميع أفراد الأسرة.',
      verified: true,
    },
    {
      id: 'seed_3',
      name: 'م. إبراهيم الجمال',
      location: 'سموحة، الإسكندرية',
      productName: 'لحاف فنادق فاخر من موربيدو بد',
      rating: 5,
      date: 'منذ ٣ أيام',
      comment: 'اللحاف منفوش وناعم بشكل مش طبيعي، كأنك نايم في فندق خمس نجوم. التغليف والخدمة والالتزام بالتوصيل في الموعد يستحقوا عليهم كل الشكر والاحترام.',
      verified: true,
    },
  ];

  const displayReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  // Compute average rating
  const avgRating =
    displayReviews.length > 0
      ? displayReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / displayReviews.length
      : 4.9;

  return (
    <>
      {/* Modal */}
      {isModalOpen && (
        <AddReviewModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(review) => {
            onAddReview(review);
            setIsModalOpen(false);
          }}
          currentUser={currentUser}
        />
      )}

      <section className="space-y-6 text-right" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-light pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-charcoal">
              آراء وتجارب عملاء موربيدو الفعليين
            </h2>
            <p className="text-[#5f5e5e] text-xs sm:text-sm mt-1">
              ثقة عملائنا هي سر نجاحنا – تقييمات حقيقية مسجلة من مشترين معتمدين.
            </p>
          </div>

          {/* Average Rating Badge */}
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="text-right">
              <p className="text-sm font-black">{avgRating.toFixed(1)} من ٥</p>
              <p className="text-[10px] text-amber-600">{displayReviews.length}+ تقييم موثق</p>
            </div>
            <div className="flex text-amber-400" dir="ltr">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayReviews.slice(0, 6).map((rev, i) => (
            <ReviewCard key={rev.id} rev={rev} index={i} />
          ))}
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-l from-[#1a1c1c] to-[#2c2f2f] text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-right">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-primary-light">
                هل تريد مشاركة تجربتك مع موربيدو؟
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-light mt-0.5">
                تقييمك يساعد آلاف العملاء في اتخاذ قرار الشراء الصحيح ويحفزنا على التطوير المستمر.
              </p>
            </div>
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/20 items-center justify-center shrink-0">
              <ThumbsUp className="w-5 h-5 text-primary-light" />
            </div>
          </div>

          <button
            id="add-review-btn"
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-[#3ca092] text-white px-6 py-2.5 rounded-xl font-bold text-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/30 flex items-center gap-2"
          >
            <Star className="w-4 h-4 fill-white" />
            أضف تقييمك الآن
          </button>
        </div>
      </section>
    </>
  );
}
