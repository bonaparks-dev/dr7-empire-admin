import type { Handler } from "@netlify/functions";

const CALLMEBOT_ADMIN_PHONE = process.env.CALLMEBOT_ADMIN_PHONE; // Admin phone number
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || "6526748";

interface ReservationNotification {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vehicle_name: string;
  start_at: string;
  end_at: string;
  total_amount: number;
  currency: string;
  status: string;
  reservation_id: string;
  recipient_type: 'admin' | 'customer';
  customer_whatsapp?: string; // Optional: customer's WhatsApp number for customer notifications
}

/**
 * Sends WhatsApp notification for manual reservations created in admin panel
 * Uses CallMeBot API
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const notification: ReservationNotification = JSON.parse(event.body || '{}');

  if (!notification.customer_name || !notification.vehicle_name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required reservation data' }),
    };
  }

  const recipientPhone = notification.recipient_type === 'admin'
    ? CALLMEBOT_ADMIN_PHONE
    : notification.customer_whatsapp;

  // Check if phone number is configured
  if (!recipientPhone) {
    console.error(`Phone number not configured for ${notification.recipient_type}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Phone number not configured for ${notification.recipient_type}`
      }),
    };
  }

  let message = '';

  // Format dates in Italian timezone
  const startDate = new Date(notification.start_at);
  const endDate = new Date(notification.end_at);

  const startDateFormatted = startDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Rome'
  });
  const startTimeFormatted = startDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome'
  });

  const endDateFormatted = endDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Rome'
  });
  const endTimeFormatted = endDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome'
  });

  const totalFormatted = notification.total_amount.toFixed(2);
  const currency = notification.currency === 'EUR' ? '€' : notification.currency;

  if (notification.recipient_type === 'admin') {
    // Admin notification - detailed
    message = `🚘 *NUOVA PRENOTAZIONE MANUALE*\n\n`;
    message += `*ID:* ${notification.reservation_id}\n`;
    message += `*Cliente:* ${notification.customer_name}\n`;
    message += `*Email:* ${notification.customer_email}\n`;
    message += `*Telefono:* ${notification.customer_phone}\n`;
    message += `*Veicolo:* ${notification.vehicle_name}\n`;
    message += `*Ritiro:* ${startDateFormatted} alle ${startTimeFormatted}\n`;
    message += `*Riconsegna:* ${endDateFormatted} alle ${endTimeFormatted}\n`;
    message += `*Totale:* ${currency}${totalFormatted}\n`;
    message += `*Stato:* ${notification.status}\n`;
    message += `*Creata:* Manualmente da admin panel`;
  } else {
    // Customer notification - friendly
    message = `🚗 *DR7 EMPIRE - Conferma Prenotazione*\n\n`;
    message += `Gentile *${notification.customer_name}*,\n\n`;
    message += `La tua prenotazione è stata confermata!\n\n`;
    message += `*Veicolo:* ${notification.vehicle_name}\n`;
    message += `*Ritiro:* ${startDateFormatted} alle ${startTimeFormatted}\n`;
    message += `*Riconsegna:* ${endDateFormatted} alle ${endTimeFormatted}\n`;
    message += `*Totale:* ${currency}${totalFormatted}\n\n`;
    message += `*ID Prenotazione:* ${notification.reservation_id}\n\n`;
    message += `Ti aspettiamo!\n`;
    message += `Per info: ${CALLMEBOT_ADMIN_PHONE || '+39 345 790 5205'}`;
  }

  try {
    // Send via CallMeBot
    const encodedMessage = encodeURIComponent(message);
    const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${recipientPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_API_KEY}`;

    const response = await fetch(callmebotUrl);

    if (!response.ok) {
      const error = await response.text();
      console.error('CallMeBot API error:', error);
      throw new Error(`CallMeBot API error: ${error}`);
    }

    console.log(`✅ WhatsApp notification sent to ${notification.recipient_type} via CallMeBot`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `WhatsApp notification sent to ${notification.recipient_type} via CallMeBot`,
        success: true
      }),
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error sending WhatsApp notification',
        error: error.message
      }),
    };
  }
};

export { handler };
