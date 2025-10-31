import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchAllReservations() {
  try {
    console.log('Fetching reservations from Supabase...\n')

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        customers (
          full_name,
          email,
          phone,
          driver_license_number
        ),
        vehicles (
          display_name,
          plate,
          status,
          daily_rate
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reservations:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('No reservations found.')
      return
    }

    console.log(`Found ${data.length} reservation(s):\n`)
    console.log('=' .repeat(100))

    data.forEach((reservation, index) => {
      console.log(`\n#${index + 1} Reservation ID: ${reservation.id}`)
      console.log('-'.repeat(100))
      console.log(`Customer: ${reservation.customers?.full_name || 'N/A'}`)
      console.log(`Email: ${reservation.customers?.email || 'N/A'}`)
      console.log(`Phone: ${reservation.customers?.phone || 'N/A'}`)
      console.log(`License: ${reservation.customers?.driver_license_number || 'N/A'}`)
      console.log(`\nVehicle: ${reservation.vehicles?.display_name || 'N/A'}`)
      console.log(`Plate: ${reservation.vehicles?.plate || 'N/A'}`)
      console.log(`Daily Rate: $${reservation.vehicles?.daily_rate || 'N/A'}`)
      console.log(`\nStart Date: ${new Date(reservation.start_at).toLocaleString()}`)
      console.log(`End Date: ${new Date(reservation.end_at).toLocaleString()}`)
      console.log(`Status: ${reservation.status}`)
      console.log(`Source: ${reservation.source || 'N/A'}`)
      console.log(`Total Amount: ${reservation.currency} ${reservation.total_amount}`)
      console.log(`Created: ${new Date(reservation.created_at).toLocaleString()}`)
      console.log(`Updated: ${new Date(reservation.updated_at).toLocaleString()}`)

      if (reservation.addons && Object.keys(reservation.addons).length > 0) {
        console.log(`\nAdd-ons: ${JSON.stringify(reservation.addons, null, 2)}`)
      }
    })

    console.log('\n' + '='.repeat(100))
    console.log(`\nTotal: ${data.length} reservation(s)`)

    // Also save to JSON file
    const fs = await import('fs')
    fs.writeFileSync(
      'reservations-export.json',
      JSON.stringify(data, null, 2)
    )
    console.log('\nReservations saved to: reservations-export.json')

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

fetchAllReservations()
