import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { signInUser, signUpUser, AppUser } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AppUser) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isLoginMode) {
      if (!email || !password) {
        setError('يرجى إدخال رقم الموبايل/البريد الإلكتروني وكلمة المرور.');
        setLoading(false);
        return;
      }
    } else {
      if (!fullName || !phone || !password) {
        setError('يرجى ملء جميع الحقول المطلوبة لإنشاء الحساب.');
        setLoading(false);
        return;
      }
      if (!/^01[0125][0-9]{8}$/.test(phone.trim())) {
        setError('يرجى إدخال رقم موبايل مصري صحيح مكون من ١١ رقم (مثال: 01012345678).');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLoginMode) {
        const { user, error: loginErr } = await signInUser(email.trim(), password);
        if (loginErr) {
          setError(loginErr);
        } else if (user) {
          setSuccess(`مرحباً بك مجدداً يا ${user.name}! تم تسجيل الدخول بنجاح.`);
          setTimeout(() => {
            onAuthSuccess(user);
            onClose();
          }, 1500);
        }
      } else {
        const registrationIdentifier = email.trim() || phone.trim();
        const { user, error: regErr } = await signUpUser(registrationIdentifier, password, fullName.trim(), phone.trim());
        if (regErr) {
          setError(regErr);
        } else if (user) {
          setSuccess('تم إنشاء حسابك بنجاح! يسعدنا انضمامك لعائلة موربيدو.');
          setTimeout(() => {
            onAuthSuccess(user);
            onClose();
          }, 1500);
        }
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-55 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 text-right flex flex-col border border-gray-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {isLoginMode ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-black text-charcoal">
              {isLoginMode ? 'تسجيل الدخول لموربيدو' : 'إنشاء حساب جديد'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-100 text-green-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLoginMode && (
              <>
                {/* Full name (Register only) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">الاسم بالكامل <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك الثلاثي"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white text-right outline-none transition-all"
                    />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                {/* Phone number (Register only) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">رقم الموبايل <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white text-left outline-none transition-all"
                      dir="ltr"
                    />
                    <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>
              </>
            )}

            {/* Email Address or Phone (Login) / Email Optional (Register) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal block">
                {isLoginMode ? (
                  <>رقم الموبايل أو البريد الإلكتروني <span className="text-red-500">*</span></>
                ) : (
                  <>البريد الإلكتروني <span className="text-gray-400 text-[10px] font-normal">(اختياري)</span></>
                )}
              </label>
              <div className="relative">
                <input
                  type={isLoginMode ? "text" : "email"}
                  required={isLoginMode}
                  placeholder={isLoginMode ? "رقم الموبايل 01xxxxxxxxx أو الإيميل" : "yourname@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white text-left outline-none transition-all font-medium"
                  dir="ltr"
                />
                {isLoginMode ? (
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                ) : (
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal block">كلمة المرور <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white text-left outline-none transition-all"
                  dir="ltr"
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLoginMode ? (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  <span>تسجيل الدخول</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4.5 h-4.5" />
                  <span>تأكيد وإنشاء حساب</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle login/register */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs sm:text-sm">
            {isLoginMode ? (
              <p className="text-muted-gray">
                ليس لديك حساب معنا؟{' '}
                <button 
                  onClick={() => { setIsLoginMode(false); setError(null); }}
                  className="text-primary font-black hover:underline cursor-pointer"
                >
                  إنشاء حساب جديد الآن
                </button>
              </p>
            ) : (
              <p className="text-muted-gray">
                لديك حساب بالفعل؟{' '}
                <button 
                  onClick={() => { setIsLoginMode(true); setError(null); }}
                  className="text-primary font-black hover:underline cursor-pointer"
                >
                  تسجيل الدخول هنا
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
