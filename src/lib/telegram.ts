import { Order, WarrantyRequest } from '../types';

/**
 * Dispatches a detailed markdown message to the configured Telegram Bot
 */
export async function sendTelegramOrderNotification(
  order: Order, 
  paymentMethod: 'cod' | 'fawaiterk', 
  isPaid: boolean
): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('morbido_telegram_token') || '';
  const chatId = localStorage.getItem('morbido_telegram_chat_id') || '';

  if (!token.trim() || !chatId.trim()) {
    return { 
      success: false, 
      message: 'لم يتم إرسال إشعار تلجرام لأن الإعدادات غير مكتملة في لوحة تحكم الأدمن.' 
    };
  }

  const paymentMethodText = paymentMethod === 'cod' ? 'الدفع عند الاستلام (COD)' : 'دفع إلكتروني (فواتيرك)';
  const paymentStatusText = isPaid ? '✅ تم الدفع بنجاح' : '⏳ بانتظار التحصيل / الدفع عند الاستلام';

  const itemsDetails = order.items.map((item, idx) => {
    let sizeLine = '';
    if (item.selectedSize) {
      if (item.selectedSize.includes('تفصيل') || item.selectedSize.includes('خاص')) {
        sizeLine = `\n   📐 *مقاس تفصيل خاص:* \`${item.selectedSize}\``;
      } else {
        sizeLine = `\n   📏 *المقاس المطلوب:* \`${item.selectedSize}\``;
      }
    } else {
      sizeLine = `\n   📏 *المقاس:* \`قياسي / موحد\``;
    }
    return `${idx + 1}. *${item.product.name}*${sizeLine}\n   الكمية: ${item.quantity} | السعر: ${item.product.price.toLocaleString('ar-EG')} ج.م`;
  }).join('\n\n');

  // Markdown message format for beautiful Telegram message layout
  const text = `🔔 *طلب شراء جديد من موربيدو Morbido!* 🔔\n\n` +
               `*رقم الطلب:* \`${order.id}\`\n` +
               `*العميل الفاضل:* ${order.customerName}\n` +
               `*رقم الموبايل:* ${order.phone}\n` +
               `*المحافظة:* ${order.city}\n` +
               `*العنوان بالكامل:* ${order.address}\n\n` +
               `📦 *المنتجات المطلوبة:*\n${itemsDetails}\n\n` +
               `💵 *طريقة الدفع:* ${paymentMethodText}\n` +
               `💳 *حالة الدفع:* ${paymentStatusText}\n\n` +
               `💰 *الإجمالي المستحق:* ${order.total.toLocaleString('ar-EG')} جنيه مصري\n\n` +
               `📅 _تاريخ الطلب: ${order.createdAt}_`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    const result = await response.json();
    if (!result.ok) {
      return { success: false, message: result.description || 'خطأ من سيرفر تلجرام' };
    }
    return { success: true, message: 'تم إرسال إشعار الطلب بنجاح للبوت.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'فشل الاتصال بسيرفر تلجرام.' };
  }
}

/**
 * Dispatches a detailed markdown message when a customer activates product warranty
 */
export async function sendTelegramWarrantyNotification(
  warranty: WarrantyRequest
): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('morbido_telegram_token') || '';
  const chatId = localStorage.getItem('morbido_telegram_chat_id') || '';

  if (!token.trim() || !chatId.trim()) {
    return { 
      success: false, 
      message: 'لم يتم إرسال إشعار تلجرام لأن إعدادات البوت غير مكتملة.' 
    };
  }

  const text = `🛡️ *تفعيل ضمان إلكتروني جديد من موربيدو Morbido!* 🛡️\n\n` +
               `*رقم شهادة الضمان:* \`${warranty.id}\`\n` +
               `*رقم الفاتورة:* \`${warranty.invoiceNumber}\`\n` +
               `*اسم العميل:* ${warranty.customerName}\n` +
               `*رقم الموبايل:* ${warranty.phone}\n` +
               `*المنتج:* ${warranty.productName} (${warranty.productType})\n` +
               `*الرقم التسلسلي (السيريال):* \`${warranty.serialNumber}\`\n` +
               `*تاريخ الشراء والبدء:* ${warranty.purchaseDate}\n` +
               `*مدة الضمان:* 10 سنوات كاملة (ضد عيوب التصنيع والهبوط)\n` +
               (warranty.notes ? `*ملاحظات العميل:* ${warranty.notes}\n` : '') +
               `\n⏰ _تاريخ التفعيل: ${new Date(warranty.createdAt).toLocaleString('ar-EG')}_`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    const result = await response.json();
    if (!result.ok) {
      return { success: false, message: result.description || 'خطأ من سيرفر تلجرام' };
    }
    return { success: true, message: 'تم إرسال إشعار الضمان بنجاح للبوت.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'فشل الاتصال بسيرفر تلجرام.' };
  }
}

/**
 * Sends a custom test message to verify Telegram bot setup
 */
export async function sendTelegramTestMessage(
  token: string, 
  chatId: string
): Promise<{ success: boolean; message: string }> {
  const text = `👋 *رسالة تجريبية من لوحة تحكم موربيدو!*\n\n` +
               `مبروك! لقد قمت بربط البوت بنجاح ومستعد لاستقبال طلبات العملاء الآن.\n` +
               `⏰ _الوقت: ${new Date().toLocaleTimeString('ar-EG')}_`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    const result = await response.json();
    if (!result.ok) {
      return { success: false, message: result.description || 'خطأ من سيرفر تلجرام' };
    }
    return { success: true, message: 'تم إرسال الرسالة التجريبية بنجاح!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'فشل الاتصال بسيرفر تلجرام.' };
  }
}
