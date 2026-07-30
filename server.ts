import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini Client
// We use process.env.GEMINI_API_KEY and specify user-agent: 'aistudio-build'
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set. Chatbot will run in simulation mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiClient();

// Detailed System Instruction in Arabic about Morbido Bed (products, prices, specs, policies)
const MORBIDO_SYSTEM_PROMPT = `
أنت "مساعد موربيدو الذكي للنوم والراحة"، خبير المبيعات والخدمات والدعم الفني الذكي والأول لشركة "موربيدو بد" (Morbido Bed)، المتخصصة في صناعة المراتب الطبية، والمفروشات الفندقية، والمخدات والوسائد الفاخرة في مصر.

هدفنا في موربيدو هو تقديم نوم ملوكي مريح وصحي لعملائنا بأفضل خامات وأعلى معايير جودة.

قواعد التعامل وسلوكيات المساعد:
1. كن ودوداً جداً، ومرحباً، وبشوشاً، وتحدث دائماً بلهجة مصرية مهذبة أو لغة عربية فصحى مبسطة وقريبة لقلوب عملائنا المصريين.
2. اعرض دائماً المساعدة في اختيار المنتج الأنسب لحالتهم الصحية (مثل آلام الرقبة أو العمود الفقري أو نوم الحوامل).
3. التزم تماماً بأسعار المنتجات والمواصفات المحددة في كتالوج موربيدو أدناه ولا تخترع أسعاراً أو عروضاً غير موجودة.
4. شجع العملاء على الطلب من المتجر مباشرة عبر الضغط على سلة المشتريات وإتمام الطلب؛ حيث نوفر شحناً مجانياً وسريعاً للمشتريات التي تتجاوز قيمتها 2000 جنيه مصري، وضماناً حقيقياً وضمان استرجاع كامل في حال وجود أي عيب صناعي.

دليل وكتالوج منتجات "موربيدو بد" الرسمي:

1. مخدات طبية وفندقية (Pillows):
- "موربيدو مخدة ميموري فوم الطبية": السعر 1200 جنيه مصري (بدلاً من 1500). مصنوعة من رغوة الذاكرة عالية الكثافة المبردة لدعم فقرات الرقبة والعمود الفقري وتخفيف آلام الضغط والصداع والشد العضلي. مقاسها 60 × 40 × 12 سم. الغطاء قطن ناعم ممتاز قابل للإزالة والغسيل.
- "موربيدو مخدة لاتكس طبيعي مبرد": السعر 1550 جنيه مصري (بدلاً من 1950). مستوردة ومجمعة بأعلى معايير جودة ومصنوعة من حليب شجر المطاط الطبيعي 100% مع قنوات تهوية ذاتية تمنع التعرق وصديقة لمرضى الحساسية والجيوب الأنفية ومقاومة لحشرات الفراش.
- "موربيدو خدادية كمفورت فايبر هولو": السعر 300 جنيه مصري. محشوة بفايبر هولو معالج حرارياً بمرونة ممتازة تدوم طويلاً ولا تهبط. مقاس 70 × 50 سم.
- "مخدة الحوامل الطبية الداعمة": السعر 490 جنيه مصري (بدلاً من 650). مصممة على شكل حرف U لتدعم البطن والظهر والركبتين وتقلل التورم لراحة تامة طوال فترة الحمل.

2. مراتب طبية فاخرة (Mattresses):
- "مرتبة موربيدو الطبية أورثوبيدك لدعم الظهر": السعر 4500 جنيه مصري (بدلاً من 5800). مصممة لدعم العمود الفقري ومحاربة آلام الظهر. تتميز بشاسيه سوست كربونية قوية معالجة ضد الصدأ وطبقات إسفنج طبي مضغوط عالي الكثافة. الارتفاع 28 سم. غطاء دبل نت معالج ضد البكتيريا وحشرات الفراش.
- "مرتبة موربيدو ميموري بوكيت الذكية": السعر 6800 جنيه مصري (بدلاً من 8500). راحة ملوكية مطلقة. تحتوي على سوست منفصلة مغلفة (Pocket Springs) تعزل الحركة والاهتزاز تماماً عن الشريك + طبقة ميموري فوم مبرد بسمك 3 سم تمنع التعرق الليلي. الارتفاع 32 سم. تأتي مع ضمان حقيقي معتمد ومسجل لمدة 10 سنوات ضد عيوب الصناعة أو الهبوط.

3. مفروشات وأطقم سرير فندقية (Bedding):
- "لحاف فنادق فاخر من موربيدو بد": السعر 1800 جنيه مصري (بدلاً من 2600). محشو بمايكروفايبر بديل الريش الطبيعي ومضاد للتحسس، يعطي دفئاً وملمساً حريرياً فخماً مثل فنادق الـ 5 نجوم. مقاس مزدوج كينج 240 × 220 سم وبوزن 450 جرام لكل متر مربع.
- "طقم ملاية جكار فندقي 4 قطع": السعر 1150 جنيه مصري (بدلاً من 1600). قطن جكار حريري ثقيل مطرز بنقوش كلاسيكية فخمة. طقم مكون من ملاية سرير كبيرة (240 × 260 سم)، و2 غطاء وسادة كبير، وغطاء وسادة صغير مطرز.
- "ملاية أستيك قطن فندقي": السعر 720 جنيه مصري (بدلاً من 1300). قطن مصري 100% طويل التيلة مع جوانب ممتدة حتى ارتفاع 35 سم لتغطية وتثبيت المراتب المرتفعة بالكامل دون أي انزلاق. مقاس 200 × 200 + 35 سم.

سياسات المتجر وخدماتنا:
- الشحن والتوصيل: شحن سريع وآمن لجميع المحافظات في مصر (عادة خلال 48 ساعة عمل). الشحن مجاني بالكامل لأي طلب يتجاوز 2000 جنيه مصري.
- الضمان والاسترجاع: نضمن جودة المنتجات 100%. يحق للعميل الاسترجاع الكامل أو الاستبدال في حالة وجود عيوب صناعة أو تلفيات. ضمان المراتب يصل إلى 10 سنوات حقيقية.
- طرق الدفع: نوفر الدفع عند الاستلام كخيار أساسي وآمن لتسهيل الشراء للعملاء في مصر.

تذكر دائماً أن تتحدث باحترام وتخدم مصلحة العميل وتوجهه بلطف لإتمام طلبه من الموقع الإلكتروني.
`;

// AI Chatbot endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "الرجاء تقديم قائمة الرسائل بشكل صحيح." });
    }

    // Format messages for the @google/genai SDK (it expects user/model roles and parts)
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content || "" }]
    }));

    if (!ai) {
      // Simulation mode fallback if no API key is present
      const lastMessage = messages[messages.length - 1]?.content || "";
      let simulatedReply = "أهلاً بك يا فندم في موربيدو بد! ❤️ نسعد جداً بخدمتك. متجرنا يوفر مخدات ميموري فوم الطبية، ومراتب أورثوبيدك لدعم الظهر، ولحاف الفنادق الفاخر. كيف يمكننا مساعدتك اليوم؟";

      if (lastMessage.includes("سعر") || lastMessage.includes("بكام") || lastMessage.includes("مرتبة") || lastMessage.includes("مخدة")) {
        simulatedReply = "أهلاً بك يا فندم! المخدة الطبية ميموري فوم بمبلغ 1200 جنيه، والمرتبة الطبية أورثوبيدك لدعم الظهر بـ 4500 جنيه، بينما المرتبة ميموري بوكيت الذكية بسعر 6800 جنيه وعليها ضمان 10 سنوات وتوصيل مجاني! يمكنك إضافة المنتج للسلة الآن والطلب مباشرة.";
      } else if (lastMessage.includes("شحن") || lastMessage.includes("توصيل")) {
        simulatedReply = "التوصيل مجاني تماماً لأي طلبية تتجاوز 2000 جنيه مصري يا فندم! ويصلك في خلال 48 ساعة عمل لجميع المحافظات مع إمكانية الدفع عند الاستلام.";
      } else if (lastMessage.includes("ضمان") || lastMessage.includes("استرجاع")) {
        simulatedReply = "نوفر لك ضمان استبدال واسترجاع كامل لو واجهتك أي مشكلة أو عيب صناعة، والخدمة تتم بسرعة فائقة عبر فريق الدعم ومندوبينا! تفضل بطلبك بأمان وثقة.";
      }

      // Mimic slight typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({ reply: simulatedReply });
    }

    // Query Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: MORBIDO_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const reply = response.text || "عذراً يا فندم، واجهت مشكلة في معالجة طلبك حالياً. هل يمكنك إعادة كتابة سؤالك؟";
    return res.json({ reply });

  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء التواصل مع خادم الذكاء الاصطناعي." });
  }
});

// Fawaterk Payment Gateway - Create Invoice Endpoint
app.post("/api/fawaterk/create-invoice", async (req, res) => {
  try {
    const { orderId, customerName, phone, email, total, items, redirectUrl } = req.body;

    if (!orderId || !customerName || !phone || !total || !items) {
      return res.status(400).json({ 
        success: false, 
        error: "بيانات الطلب غير مكتملة. يرجى ملء جميع الحقول المطلوبة." 
      });
    }

    const fawaterkApiKey = process.env.VITE_FAWATERK_API_KEY;

    if (!fawaterkApiKey || fawaterkApiKey === 'your_fawaiterk_api_key_here') {
      console.warn("⚠️ Fawaterk API key not configured. Running in simulation mode.");
      // Simulation mode: return a mock payment URL
      return res.json({
        success: true,
        invoiceId: `SIM-${orderId}`,
        invoiceKey: `sim_key_${Date.now()}`,
        paymentUrl: `https://app.fawaterk.com/`,
        simulated: true,
        message: "تم إنشاء فاتورة تجريبية. يرجى تعيين VITE_FAWATERK_API_KEY في ملف .env لتفعيل الدفع الحقيقي."
      });
    }

    // Prepare cart items for Fawaterk API
    const cartItemsFormatted = items.map((item: any) => ({
      name: item.name || "منتج موربيدو",
      price: item.price || 0,
      quantity: item.quantity || 1,
    }));

    // Call Fawaterk API to create an invoice
    const fawaterkResponse = await fetch("https://app.fawaterk.com/api/v2/createInvoiceLink", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fawaterkApiKey}`,
      },
      body: JSON.stringify({
        cartTotal: total.toString(),
        currency: "EGP",
        customer: {
          first_name: customerName.split(" ")[0] || customerName,
          last_name: customerName.split(" ").slice(1).join(" ") || ".",
          email: email || `${phone}@morbido.shop`,
          phone: phone,
          address: "Egypt",
        },
        redirectionUrls: {
          successUrl: redirectUrl || `${req.protocol}://${req.get('host')}/?payment=success&order=${orderId}`,
          failUrl: redirectUrl || `${req.protocol}://${req.get('host')}/?payment=failed&order=${orderId}`,
          pendingUrl: redirectUrl || `${req.protocol}://${req.get('host')}/?payment=pending&order=${orderId}`,
        },
        cartItems: cartItemsFormatted,
      }),
    });

    const fawaterkData = await fawaterkResponse.json();

    if (!fawaterkResponse.ok || fawaterkData.status === "fail" || fawaterkData.status === "error") {
      console.error("Fawaterk API Error:", fawaterkData);
      return res.status(502).json({
        success: false,
        error: fawaterkData.message || fawaterkData.data?.message || "حدث خطأ أثناء إنشاء فاتورة الدفع من فواتيرك. يرجى المحاولة مرة أخرى.",
        details: fawaterkData,
      });
    }

    // Success: return payment URL
    console.log(`✅ Fawaterk invoice created for order ${orderId}:`, fawaterkData.data?.url || fawaterkData.data?.invoice_id);

    return res.json({
      success: true,
      invoiceId: fawaterkData.data?.invoice_id || orderId,
      invoiceKey: fawaterkData.data?.invoice_key || "",
      paymentUrl: fawaterkData.data?.url || "",
      simulated: false,
      message: "تم إنشاء فاتورة الدفع بنجاح. سيتم توجيهك لبوابة الدفع الآمنة."
    });

  } catch (error: any) {
    console.error("❌ Fawaterk Create Invoice Error:", error);
    return res.status(500).json({
      success: false,
      error: "حدث خطأ غير متوقع أثناء الاتصال ببوابة الدفع. يرجى المحاولة لاحقاً.",
    });
  }
});

// Configure Vite or Static Serve
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Running in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Running in PRODUCTION mode serving static build.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ Server is listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
