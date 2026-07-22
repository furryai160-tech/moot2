import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, CornerDownLeft, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const MORBIDO_SYSTEM_PROMPT = `أنت "مساعد موربيدو الذكي للنوم والراحة", خبير المبيعات والدعم الفني لشركة "موربيدو بد" (Morbido Bed) المتخصصة في صناعة المراتب الطبية، والمفروشات الفندقية، والمخدات والوسائد الفاخرة في مصر.
كن ودوداً جداً، ومرحباً، وبشوشاً، وتحدث دائماً بلهجة مصرية مهذبة أو لغة عربية فصحى مبسطة.
منتجاتنا: مخدة ميموري فوم بـ 1200جنيه، مخدة لاتكس بـ 1550جنيه، مرتبة أورثوبيدك بـ 4500جنيه، مرتبة ميموري بوكيت بـ 6800جنيه (ضمان 10 سنوات)، لحاف فنادق بـ 1800جنيه، طقم ملاية جكار بـ 1150جنيه.
التوصيل مجاني لأي طلب فوق 2000جنيه. الدفع عند الاستلام. ضمان واسترجاع كامل. خدمة عملاء 20/7 على 01034462884.`;

const getSimulatedReply = (lastMessage: string): string => {
  const msg = lastMessage.toLowerCase();
  if (msg.includes('سعر') || msg.includes('بكام') || msg.includes('مرتبة')) return 'المرتبة الطبية أورثوبيدك بـ 4500جنيه، والمرتبة ميموري بوكيت بـ 6800جنيه مع ضمان 10 سنوات وتوصيل مجاني! يمكنك إضافتها للسلة الآن.';
  if (msg.includes('مخدة') || msg.includes('مخد') || msg.includes('وسادة')) return 'المخدة الطبية ميموري فوم بـ 1200جنيه ومخدة لاتكس طبيعي بـ 1550جنيه. كلتهما تخففان آلام الرقبة وتوفران نوماً ملوكياً!';
  if (msg.includes('شحن') || msg.includes('توصيل')) return 'التوصيل مجاني لأي طلب فوق 2000جنيه ويصلك خلال 48 ساعة لجميع المحافظات مع إمكانية الدفع عند الاستلام!';
  if (msg.includes('ضمان') || msg.includes('استرجاع')) return 'نوفر ضمان استبدال واسترجاع كامل لو واجهتك أي مشكلة. ضمان المراتب يصل لـ 10 سنوات حقيقية!';
  if (msg.includes('ظهر') || msg.includes('فقرات') || msg.includes('آلام')) return 'مرتبة موربيدو أورثوبيدك هي الأمثل لآلام الظهر. مصممة خصيصاً لدعم العمود الفقري بجاونة سوست كربونية وإسفنج طبي عالي الكثافة بسعر 4500جنيه فقط!';
  return 'أهلاً بك يا فندم في موربيدو بد! ❤️ نسعد جداً بخدمتك. كيف يمكنني مساعدتك في اختيار المرتبة أو المخدة المناسبة لك;️';
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_SUGGESTIONS = [
  'أريد مخدة ميموري فوم الطبية 🛏️',
  'ما هي أفضل مرتبة لآلام الظهر والفقرات؟ 🩺',
  'هل يوجد توصيل مجاني لمحافظتي؟ 🚚',
  'ما هو طقم الملاية الجكار الملوكي؟ ✨',
  'أحتاج مخدة مريحة للحوامل 🤰',
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessageBadge, setHasNewMessageBadge] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('morbido_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        setHasNewMessageBadge(false);
      } catch (e) {
        console.error("Error parsing chat history:", e);
      }
    } else {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'أهلاً بك في موربيدو بد! ❤️ أنا مساعدك الطبي والريادي الذكي. يسعدني جداً إرشادك وتوفير معلومات دقيقة عن المراتب الطبية، والمفروشات الفندقية، والوسائد الفاخرة التي تلبي رغباتك لراحة لا تضاهى. كيف يمكنني مساعدتك اليوم؟ 😊',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Save chat history to localStorage on updates
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('morbido_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages or open state changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  // Close when clicking outside on desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        // Only close if screen is large
        if (window.innerWidth >= 768) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const activeHistory = [...messages, userMsg].slice(-15);

    try {
      let replyText = '';

      if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
        // Call Gemini directly from the browser
        const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const formattedContents = activeHistory.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const response = await genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: formattedContents,
          config: {
            systemInstruction: MORBIDO_SYSTEM_PROMPT,
            temperature: 0.7,
          }
        });
        replyText = response.text || '';
      }

      if (!replyText) {
        // Fallback: simulation mode
        await new Promise(r => setTimeout(r, 700));
        replyText = getSimulatedReply(userMsg.content);
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: replyText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chatbot error:", error);
      // Graceful fallback on any error
      const fallbackMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: getSimulatedReply(userMsg.content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('هل ترغب في مسح محادثتك الحالية بالكامل؟')) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: 'تم تصفير المحادثة بنجاح! ✨ كيف يمكن لـ موربيدو مساعدتك مجدداً؟ 😊',
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
      localStorage.setItem('morbido_chat_history', JSON.stringify([welcomeMsg]));
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-50 font-sans" dir="rtl" id="morbido-chatbot-root">
      
      {/* Floating launcher button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="chatbot-trigger-btn"
            onClick={() => {
              setIsOpen(true);
              setHasNewMessageBadge(false);
            }}
            whileHover={{ scale: 1.1, rotate: -3 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:bg-primary-hover relative transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            <MessageSquare className="w-6 h-6 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-2 right-2" />
            
            {hasNewMessageBadge && (
              <span className="absolute -top-1 -left-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-extrabold items-center justify-center">١</span>
              </span>
            )}
            
            {/* Friendly assist label on hover */}
            <span className="absolute right-16 bg-white border border-gray-100 text-charcoal shadow-md px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
              <span>استشر المساعد الذكي</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-window"
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[calc(100vw-32px)] sm:w-96 h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-w-md max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 relative">
                  <Bot className="w-6 h-6 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-primary rounded-full"></span>
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-sm flex items-center gap-1">
                    <span>مساعد موربيدو الذكي</span>
                    <span className="bg-white/20 text-[9px] px-1.5 py-0.2 rounded-md font-medium">ذكاء اصطناعي</span>
                  </h3>
                  <p className="text-[10px] text-white/80 font-light">متواجد ومستعد لمساعدتك الآن</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="مسح المحادثة"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  تصفير
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Warning banner in case API is offline */}
            <div className="bg-amber-50 border-b border-amber-100 px-3 py-1.5 text-[10px] text-amber-800 font-medium flex items-center gap-1.5 justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
              <span>اطرح أي سؤال عن الأسعار والضمان والمراتب الطبية!</span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/45 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Icon/Avatar */}
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'bg-charcoal text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble content */}
                  <div className="max-w-[80%] flex flex-col space-y-1">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm font-medium ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-charcoal border border-gray-100 rounded-tl-none text-right'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <span className={`text-[9px] text-gray-400 font-light px-1 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bot Loading/Typing State */}
              {isLoading && (
                <div className="flex items-start gap-2.5 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-charcoal text-white">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white text-charcoal border border-gray-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 justify-center min-w-[70px]">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-3 py-2 border-t border-gray-50 bg-white max-h-24 overflow-y-auto shrink-0">
              <div className="flex flex-wrap gap-1.5 justify-start">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    disabled={isLoading}
                    className="bg-gray-50 border border-gray-150 hover:bg-primary/5 hover:border-primary/30 text-[10px] text-charcoal hover:text-primary px-2.5 py-1 rounded-xl transition-all cursor-pointer font-bold disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="اسألني عن المراتب والمخدات والضمان..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white focus:outline-none text-right font-medium disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-40"
                title="إرسال الرسالة"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
