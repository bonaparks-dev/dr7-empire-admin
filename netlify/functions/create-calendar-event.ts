import { Handler } from '@netlify/functions'
import { google } from 'googleapis'

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    const {
      vehicleName,
      customerName,
      customerEmail,
      customerPhone,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      pickupLocation,
      returnLocation,
      totalPrice,
      bookingId
    } = body

    // Validate required environment variables
    const calendarId = process.env.GOOGLE_CALENDAR_ID
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

    if (!calendarId || !serviceAccountEmail || !privateKey) {
      console.error('Missing Google Calendar credentials')
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Calendar integration not configured',
          details: 'Missing environment variables'
        })
      }
    }

    // Create JWT auth client
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: ['https://www.googleapis.com/auth/calendar']
    })

    const calendar = google.calendar({ version: 'v3', auth })

    // Format dates for Google Calendar (ISO 8601)
    const startDateTime = `${pickupDate}T${pickupTime}:00`
    const endDateTime = `${returnDate}T${returnTime}:00`

    // Create event description
    const description = `
📋 Booking ID: ${bookingId || 'N/A'}
👤 Cliente: ${customerName}
📧 Email: ${customerEmail || 'N/A'}
📱 Telefono: ${customerPhone || 'N/A'}
🚗 Veicolo: ${vehicleName}
📍 Ritiro: ${pickupLocation} - ${pickupDate} ${pickupTime}
📍 Riconsegna: ${returnLocation} - ${returnDate} ${returnTime}
💰 Totale: €${totalPrice}
    `.trim()

    // Create the event
    const event = {
      summary: `🚗 ${vehicleName} - ${customerName}`,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Rome'
      },
      location: pickupLocation,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }        // 1 hour before
        ]
      },
      colorId: vehicleName.includes('🚿') ? '7' : '10' // Blue for car wash, green for rental
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event
    })

    console.log('✅ Calendar event created:', response.data.id)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      })
    }
  } catch (error: any) {
    console.error('❌ Failed to create calendar event:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create calendar event',
        details: error.message
      })
    }
  }
}

export { handler }
