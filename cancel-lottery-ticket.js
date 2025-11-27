const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cancelTicketsByEmail(email) {
  console.log(`\n🔍 Searching for tickets with email: ${email}`)

  // First, find all tickets for this email
  const { data: tickets, error: fetchError } = await supabase
    .from('commercial_operation_tickets')
    .select('*')
    .eq('email', email)

  if (fetchError) {
    console.error('❌ Error fetching tickets:', fetchError)
    return
  }

  if (!tickets || tickets.length === 0) {
    console.log('ℹ️  No tickets found for this email')
    return
  }

  console.log(`\n📋 Found ${tickets.length} ticket(s):`)
  tickets.forEach(ticket => {
    console.log(`  - Ticket #${String(ticket.ticket_number).padStart(4, '0')}`)
    console.log(`    Customer: ${ticket.full_name}`)
    console.log(`    Phone: ${ticket.customer_phone || 'N/A'}`)
    console.log(`    Purchase Date: ${new Date(ticket.purchase_date).toLocaleString('it-IT')}`)
    console.log(`    Payment ID: ${ticket.payment_intent_id}`)
    console.log('')
  })

  // Delete all tickets for this email
  const { error: deleteError } = await supabase
    .from('commercial_operation_tickets')
    .delete()
    .eq('email', email)

  if (deleteError) {
    console.error('❌ Error deleting tickets:', deleteError)
    return
  }

  console.log(`✅ Successfully cancelled ${tickets.length} ticket(s) for ${email}`)
  console.log('\nTickets deleted:')
  tickets.forEach(ticket => {
    console.log(`  - #${String(ticket.ticket_number).padStart(4, '0')} (${ticket.full_name})`)
  })
}

// Run the cancellation
const emailToCancel = 'ophgrd@orange.fr'
cancelTicketsByEmail(emailToCancel)
  .then(() => {
    console.log('\n✅ Operation completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Operation failed:', error)
    process.exit(1)
  })
