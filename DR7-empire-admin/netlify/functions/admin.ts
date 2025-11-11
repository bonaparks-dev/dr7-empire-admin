import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminApiToken = process.env.ADMIN_API_TOKEN!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const ALLOWED_ORIGIN = 'https://admin.dr7empire.com'

function corsHeaders(origin: string = ALLOWED_ORIGIN): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json'
  }
}

function response(statusCode: number, body: any, origin?: string): HandlerResponse {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(body)
  }
}

function unauthorized(origin?: string): HandlerResponse {
  return response(401, { error: 'Unauthorized' }, origin)
}

async function logAudit(actorId: string | null, action: string, entityType: string, entityId: string | null, diff: any) {
  try {
    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      diff
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const origin = event.headers.origin || event.headers.Origin || ALLOWED_ORIGIN

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: ''
    }
  }

  const authHeader = event.headers.authorization || event.headers.Authorization
  const token = authHeader?.replace('Bearer ', '')

  if (token !== adminApiToken) {
    return unauthorized(origin)
  }

  const path = event.path.replace('/.netlify/functions/admin', '')
  const method = event.httpMethod

  try {
    // GET /customers
    if (path === '/customers' && method === 'GET') {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return response(200, { data }, origin)
    }

    // POST /customers
    if (path === '/customers' && method === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { full_name, email, phone, driver_license_number, notes } = body

      const { data, error } = await supabase
        .from('customers')
        .insert({
          full_name,
          email: email || null,
          phone: phone || null,
          driver_license_number: driver_license_number || null,
          notes: notes || null
        })
        .select()
        .single()

      if (error) throw error

      await logAudit(null, 'create', 'customer', data.id, body)
      return response(201, { data }, origin)
    }

    // PATCH /customers
    if (path === '/customers' && method === 'PATCH') {
      const body = JSON.parse(event.body || '{}')
      const { id, full_name, email, phone, driver_license_number, notes } = body

      const { data: oldData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      const { data, error } = await supabase
        .from('customers')
        .update({
          full_name,
          email: email || null,
          phone: phone || null,
          driver_license_number: driver_license_number || null,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await logAudit(null, 'update', 'customer', id, { old: oldData, new: data })
      return response(200, { data }, origin)
    }

    // GET /vehicles
    if (path === '/vehicles' && method === 'GET') {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return response(200, { data }, origin)
    }

    // POST /vehicles
    if (path === '/vehicles' && method === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { display_name, plate, status, daily_rate } = body

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          display_name,
          plate: plate || null,
          status: status || 'available',
          daily_rate: parseFloat(daily_rate)
        })
        .select()
        .single()

      if (error) throw error

      await logAudit(null, 'create', 'vehicle', data.id, body)
      return response(201, { data }, origin)
    }

    // PATCH /vehicles
    if (path === '/vehicles' && method === 'PATCH') {
      const body = JSON.parse(event.body || '{}')
      const { id, display_name, plate, status, daily_rate } = body

      const { data: oldData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      const { data, error } = await supabase
        .from('vehicles')
        .update({
          display_name,
          plate: plate || null,
          status,
          daily_rate: parseFloat(daily_rate),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await logAudit(null, 'update', 'vehicle', id, { old: oldData, new: data })
      return response(200, { data }, origin)
    }

    // GET /reservations
    if (path === '/reservations' && method === 'GET') {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customers(*), vehicles(*)')
        .order('start_at', { ascending: false })

      if (error) throw error
      return response(200, { data }, origin)
    }

    // POST /reservations
    if (path === '/reservations' && method === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { customer_id, vehicle_id, start_at, end_at, status, source, total_amount, currency } = body

      // Validate dates and times
      const startDate = new Date(start_at)
      const endDate = new Date(end_at)

      // Check if Sunday (0)
      if (startDate.getDay() === 0 || endDate.getDay() === 0) {
        return response(400, {
          error: 'Le prenotazioni non sono disponibili la domenica.'
        }, origin)
      }

      // Check Saturday time restrictions (day 6)
      if (endDate.getDay() === 6) {
        const endHour = endDate.getHours()
        const endMinutes = endDate.getMinutes()
        const endTimeInMinutes = endHour * 60 + endMinutes

        // Maximum 12:00 on Saturday
        if (endTimeInMinutes > 12 * 60) {
          return response(400, {
            error: 'Il sabato, la riconsegna deve essere entro le 12:00.'
          }, origin)
        }
      }

      // Get vehicle details to check conflicts
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('display_name')
        .eq('id', vehicle_id)
        .single()

      if (vehicle) {
        // Check conflicts in bookings table (main website)
        const { data: bookingConflicts } = await supabase
          .from('bookings')
          .select('pickup_date, dropoff_date, vehicle_name, status')
          .eq('vehicle_name', vehicle.display_name)
          .in('status', ['confirmed', 'pending'])

        // Check conflicts in reservations table (admin panel)
        const { data: reservationConflicts } = await supabase
          .from('reservations')
          .select('start_at, end_at, vehicle_id, status')
          .eq('vehicle_id', vehicle_id)
          .in('status', ['confirmed', 'pending', 'active'])

        // Check for overlapping dates
        const hasConflict = (existingStart: Date, existingEnd: Date) => {
          return (
            (startDate >= existingStart && startDate < existingEnd) ||
            (endDate > existingStart && endDate <= existingEnd) ||
            (startDate <= existingStart && endDate >= existingEnd)
          )
        }

        // Check booking conflicts
        if (bookingConflicts && bookingConflicts.length > 0) {
          for (const booking of bookingConflicts) {
            const existingStart = new Date(booking.pickup_date)
            const existingEnd = new Date(booking.dropoff_date)
            if (hasConflict(existingStart, existingEnd)) {
              return response(400, {
                error: `❌ Questo veicolo non è disponibile. È già prenotato dal ${existingStart.toLocaleDateString('it-IT')} al ${existingEnd.toLocaleDateString('it-IT')}.`
              }, origin)
            }
          }
        }

        // Check reservation conflicts
        if (reservationConflicts && reservationConflicts.length > 0) {
          for (const reservation of reservationConflicts) {
            const existingStart = new Date(reservation.start_at)
            const existingEnd = new Date(reservation.end_at)
            if (hasConflict(existingStart, existingEnd)) {
              return response(400, {
                error: `❌ Questo veicolo non è disponibile. È già prenotato dal ${existingStart.toLocaleDateString('it-IT')} al ${existingEnd.toLocaleDateString('it-IT')}.`
              }, origin)
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          customer_id,
          vehicle_id,
          start_at,
          end_at,
          status: status || 'pending',
          source: source || 'admin',
          total_amount: parseFloat(total_amount),
          currency: currency || 'USD'
        })
        .select()
        .single()

      if (error) throw error

      await logAudit(null, 'create', 'reservation', data.id, body)
      return response(201, { data }, origin)
    }

    // PATCH /reservations
    if (path === '/reservations' && method === 'PATCH') {
      const body = JSON.parse(event.body || '{}')
      const { id, customer_id, vehicle_id, start_at, end_at, status, source, total_amount, currency } = body

      const { data: oldData } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single()

      const { data, error } = await supabase
        .from('reservations')
        .update({
          customer_id,
          vehicle_id,
          start_at,
          end_at,
          status,
          source,
          total_amount: parseFloat(total_amount),
          currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await logAudit(null, 'update', 'reservation', id, { old: oldData, new: data })
      return response(200, { data }, origin)
    }

    // GET /export/reservations.csv
    if (path === '/export/reservations.csv' && method === 'GET') {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, start_at, end_at, status, total_amount, currency, source')
        .order('start_at', { ascending: false })

      if (error) throw error

      const csv = [
        'id,start_at,end_at,status,total_amount,currency,source',
        ...data.map((r: any) =>
          `${r.id},${r.start_at},${r.end_at},${r.status},${r.total_amount},${r.currency},${r.source || ''}`
        )
      ].join('\n')

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="reservations.csv"'
        },
        body: csv
      }
    }

    return response(404, { error: 'Not found' }, origin)

  } catch (error: any) {
    console.error('Function error:', error)
    return response(500, { error: error.message || 'Internal server error' }, origin)
  }
}
