import { Order } from '../types';

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
    const sizeStr = item.selectedSize ? ` (مقاس: ${item.selectedSize})` : '';
    return `${idx + 1}. ${item.product.name}${sizeStr}\n   الكمية: ${item.quantity} | السعر: ${item.product.price} ج.م`;
  }).join('\n');

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
