/**
 * Script to find and remove duplicate bookings from the database
 * Run this once to clean up duplicate entries
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

interface Booking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  vehicle_name: string
  pickup_date: string
  dropoff_date: string
  status: string
  created_at: string
  service_type?: string
  appointment_date?: string
}

async function findAndRemoveDuplicates() {
  console.log('🔍 Searching for duplicate bookings...')

  // Fetch all bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching bookings:', error)
    return
  }

  if (!bookings || bookings.length === 0) {
    console.log('✅ No bookings found')
    return
  }

  console.log(`📊 Found ${bookings.length} total bookings`)

  // Group by customer name + email + vehicle/service + dates
  const bookingGroups = new Map<string, Booking[]>()

  bookings.forEach((booking: Booking) => {
    // Create a unique key for identifying potential duplicates
    const key = [
      booking.customer_name?.toLowerCase().trim(),
      booking.customer_email?.toLowerCase().trim(),
      booking.vehicle_name?.toLowerCase().trim() || booking.service_type,
      booking.pickup_date || booking.appointment_date,
      booking.dropoff_date
    ].join('|')

    if (!bookingGroups.has(key)) {
      bookingGroups.set(key, [])
    }
    bookingGroups.get(key)!.push(booking)
  })

  // Find duplicates (groups with more than 1 booking)
  const duplicates: Array<{ key: string; bookings: Booking[] }> = []
  bookingGroups.forEach((group, key) => {
    if (group.length > 1) {
      duplicates.push({ key, bookings: group })
    }
  })

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!')
    return
  }

  console.log(`⚠️  Found ${duplicates.length} sets of duplicate bookings:\n`)

  duplicates.forEach((dup, idx) => {
    console.log(`\n--- Duplicate Set ${idx + 1} ---`)
    console.log(`Customer: ${dup.bookings[0].customer_name}`)
    console.log(`Email: ${dup.bookings[0].customer_email}`)
    console.log(`Vehicle/Service: ${dup.bookings[0].vehicle_name || dup.bookings[0].service_type}`)
    console.log(`Bookings:`)

    dup.bookings.forEach((booking, i) => {
      console.log(`  ${i + 1}. ID: ${booking.id.substring(0, 8)}... | Status: ${booking.status} | Created: ${new Date(booking.created_at).toLocaleString('it-IT')}`)
    })

    // Keep the newest booking (first one since we sorted by created_at DESC)
    // Mark others for deletion
    const toKeep = dup.bookings[0]
    const toDelete = dup.bookings.slice(1)

    console.log(`\n  ✅ Will KEEP: ${toKeep.id.substring(0, 8)}... (${toKeep.status})`)
    console.log(`  ❌ Will DELETE: ${toDelete.map(b => `${b.id.substring(0, 8)}... (${b.status})`).join(', ')}`)
  })

  console.log('\n\n🚨 READY TO DELETE DUPLICATES')
  console.log('To proceed, add the --confirm flag when running this script')
  console.log('Example: tsx remove-duplicate-bookings.ts --confirm')

  // Check if --confirm flag is present
  if (process.argv.includes('--confirm')) {
    console.log('\n⚠️  DELETING DUPLICATES...\n')

    let deletedCount = 0
    for (const dup of duplicates) {
      const toDelete = dup.bookings.slice(1) // Keep first, delete rest

      for (const booking of toDelete) {
        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', booking.id)

        if (deleteError) {
          console.error(`❌ Failed to delete ${booking.id}:`, deleteError)
        } else {
          console.log(`✅ Deleted booking ${booking.id.substring(0, 8)}... (${booking.status})`)
          deletedCount++
        }
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} duplicate bookings!`)
  }
}

findAndRemoveDuplicates().catch(console.error)
