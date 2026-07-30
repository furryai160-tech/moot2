import { 
  X, Code2, Sparkles, Server, Heart, ExternalLink, 
  Award, ShieldCheck, CheckCircle2, UserCheck, Phone, Mail, Globe, Cpu, Rocket
} from 'lucide-react';

interface DeveloperModalProps {
  onClose: () => void;
}

export default function DeveloperModal({ onClose }: DeveloperModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#0F1E2E] via-[#0A1622] to-[#050C14] border border-[#004D95]/50 text-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden relative">
        
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#49B2A4]/20 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#004D95]/30 blur-[100px] pointer-events-none rounded-full" />

        {/* Top Header Controls */}
        <div className="p-4 sm:p-6 pb-0 flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#49B2A4]/10 border border-[#49B2A4]/30 text-[#49B2A4] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ملف المطور والمهندس الرئيسي</span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Hero Profile Header */}
        <div className="p-6 sm:p-8 text-right dir-rtl relative z-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar / Monogram Badge */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#004D95] to-[#49B2A4] p-1 shadow-xl shadow-[#004D95]/30">
                <div className="w-full h-full bg-[#0B1724] rounded-xl flex flex-col items-center justify-center text-center p-2">
                  <span className="font-serif italic font-black text-2xl sm:text-3xl text-[#49B2A4]">YS</span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">DEV 18y/o</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -left-2 bg-[#49B2A4] text-[#0A1622] p-1.5 rounded-lg shadow-lg" title="مطوّر معتمد">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Intro */}
            <div className="space-y-2 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  ياسين صبري العوامي
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-[#49B2A4]/20 text-[#49B2A4] border border-[#49B2A4]/40 text-xs font-bold">
                  ١٨ عاماً - رائد أعمال ومطور برمجيات
                </span>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed font-light">
                مطور برمجيات ومصمم منصات متكاملة. برغم صغر سنه (مواليد ٢٠٠٨)، نجح في كسب ثقة السوق المصري والعربي من خلال تنفيذ وإدارة مشاريع برمجية وأنظمة حماية معقدة لكبار الأطباء والمدرسين والشركات.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Cpu className="w-3.5 h-3.5 text-[#49B2A4]" />
                  هندسة وتطوير البرمجيات
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Server className="w-3.5 h-3.5 text-[#49B2A4]" />
                  إدارة السيرفرات والبنية التحتية
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Rocket className="w-3.5 h-3.5 text-[#49B2A4]" />
                  ريادة الأعمال الرقمية
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content - Projects & Story */}
        <div className="p-6 sm:p-8 space-y-6 text-right dir-rtl relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar">
          
          {/* Main Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Highlight 1: Experience & Trust */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 hover:border-[#49B2A4]/40 transition-colors">
              <div className="flex items-center gap-2 text-[#49B2A4]">
                <Award className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">القدرة التقنية والثقة</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                تميز بالتعامل البرمجي المباشر مع أطباء ومدرسين كبار لإنشاء منصات وأنظمة حماية معقدة، مما جعله نموذجاً ملهماً بين المبرمجين الشباب في مصر بتقديم حلول منافسة للشركات الكبرى.
              </p>
            </div>

            {/* Highlight 2: Large Scale Infrastructure */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 hover:border-[#49B2A4]/40 transition-colors">
              <div className="flex items-center gap-2 text-[#49B2A4]">
                <Server className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">إدارة السيرفرات والمنصات</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                يدير بنية تحتية برمجية عالية الأداء تخدم آلاف الطلاب والمستخدمين يومياً عبر منصة <strong>"الشاطر أكاديمي"</strong> والمنظومات الطبية والتعليمية.
              </p>
            </div>

          </div>

          {/* Featured Works & Projects List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-r-2 border-[#49B2A4] pr-2">
              <Code2 className="w-4 h-4 text-[#49B2A4]" />
              <span>أبرز الأطراف والمنصات المطورة بواسطة ياسين صبري:</span>
            </h3>

            <div className="space-y-2.5 text-xs text-gray-300">
              
              {/* Project A: Morbido */}
              <div className="bg-gradient-to-r from-[#004D95]/30 to-transparent border border-[#004D95]/40 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">منصة ومتجر موربيدو للمراتب والمفروشات</span>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">مباشر الآن</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    تطوير وتصميم متجر إلكتروني متكامل بالكامل مع نظام سلة التسوق المتطور، وحاسبة الضمان الرقمي، ونظام الإدارة للطلبات المخزنية مع ربط واتساب والدفع الإلكتروني.
                  </p>
                </div>
              </div>

              {/* Project B: Teriaq Go */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">منصة وتطبيق ترياق جو (Teriaq Go)</span>
                  <span className="text-[10px] bg-[#49B2A4]/20 text-[#49B2A4] px-2 py-0.5 rounded">قطاع الرعاية الطبية</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  تم تطوير وتصميم منصة وتطبيق ترياق جو للخدمات والمنظومات الطبية المعقدة بآليات حماية وتشفير متقدمة للمستخدمين والأطباء.
                </p>
              </div>

              {/* Project C: Souk El Gomaa & Sadakat El Gomaa */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">موقع سوق الجمعة ومبادرة صدقة الجمعة</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">منصة خيرية وخدمية</span>
                  </div>
                  <a 
                    href="https://www.soukelgomaa.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#49B2A4] hover:underline font-mono text-[11px] shrink-0"
                  >
                    <span>soukelgomaa.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  منصة إلكترونية مخصصة لبيع وشراء المنتجات المستعملة في مصر بشكل آمن، مع نظام مدمج <strong>"مبادرة صدقة الجمعة"</strong> التي تتيح للمستخدمين التبرع بالأغراض الزائدة عن حاجتهم كصدقة جارية.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Actions & Contact Footer */}
        <div className="p-4 sm:p-6 bg-[#07111C] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-right dir-rtl relative z-10">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <UserCheck className="w-4 h-4 text-[#49B2A4]" />
            <span>لطلب الاستشارات البرمجية أو تطوير تطبيقك الخاص، تواصل مع المطور.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href="https://www.facebook.com/morbido2022/"
              target="_blank"
              rel="noreferrer"
              className="bg-[#49B2A4] hover:bg-[#3fa295] text-[#0A1622] font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Phone className="w-4 h-4" />
              <span>التواصل والتطوير البرمجي</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
