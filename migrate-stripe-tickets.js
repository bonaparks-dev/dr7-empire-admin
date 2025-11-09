#!/usr/bin/env node

/**
 * Migration script to import historical ticket purchases from Stripe to Supabase
 *
 * Usage:
 * 1. Set environment variables:
 *    export STRIPE_SECRET_KEY="sk_live_..."
 *    export SUPABASE_URL="https://your-project.supabase.co"
 *    export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *
 * 2. Run: node migrate-stripe-tickets.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Update this with your actual Stripe Price ID for the 20€ ticket
const TICKET_PRICE_ID = 'price_YOUR_PRICE_ID_HERE'; // e.g., price_1abc123...
const TICKET_AMOUNT = 2000; // 20€ in cents

async function migrateTickets() {
  console.log('🔍 Fetching tickets from Stripe...\n');

  try {
    // Fetch all successful payments
    const payments = await stripe.paymentIntents.list({
      limit: 100, // Adjust if you have more
      expand: ['data.customer']
    });

    console.log(`Found ${payments.data.length} payments in Stripe\n`);

    // Filter for ticket purchases (20€ amount)
    const ticketPayments = payments.data.filter(payment => {
      return payment.status === 'succeeded' && payment.amount === TICKET_AMOUNT;
    });

    console.log(`Found ${ticketPayments.length} ticket purchases\n`);

    if (ticketPayments.length === 0) {
      console.log('❌ No ticket purchases found. Please check:');
      console.log('  - TICKET_AMOUNT is correct (currently set to', TICKET_AMOUNT, 'cents)');
      console.log('  - You have ticket purchases in Stripe');
      return;
    }

    // Get the highest ticket number currently in the database
    const { data: existingTickets } = await supabase
      .from('commercial_operation_tickets')
      .select('ticket_number')
      .order('ticket_number', { ascending: false })
      .limit(1);

    let nextTicketNumber = existingTickets && existingTickets.length > 0
      ? existingTickets[0].ticket_number + 1
      : 1;

    console.log(`Starting ticket numbers from: ${nextTicketNumber}\n`);

    // Prepare tickets for insertion
    const ticketsToInsert = [];

    for (const payment of ticketPayments) {
      // Get customer details from metadata or customer object
      const metadata = payment.metadata || {};
      const customer = payment.customer;

      let email = metadata.email || payment.receipt_email || '';
      let fullName = metadata.fullName || metadata.full_name || '';

      // If we have a customer object, get details from there
      if (customer && typeof customer === 'object') {
        email = email || customer.email || '';
        fullName = fullName || customer.name || '';
      }

      const quantity = parseInt(metadata.quantity || '1', 10);

      // Create tickets for each quantity
      for (let i = 0; i < quantity; i++) {
        ticketsToInsert.push({
          uuid: `${payment.id}-${i}`,
          ticket_number: nextTicketNumber++,
          user_id: null,
          email: email,
          full_name: fullName || 'Cliente',
          payment_intent_id: payment.id,
          amount_paid: TICKET_AMOUNT,
          currency: payment.currency,
          purchase_date: new Date(payment.created * 1000).toISOString(),
          quantity: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      console.log(`✓ Prepared ${quantity} ticket(s) for ${fullName || email || payment.id}`);
    }

    console.log(`\n📦 Inserting ${ticketsToInsert.length} tickets into Supabase...\n`);

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < ticketsToInsert.length; i += batchSize) {
      const batch = ticketsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('commercial_operation_tickets')
        .insert(batch);

      if (error) {
        console.error('❌ Error inserting batch:', error);
        throw error;
      }

      console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} tickets)`);
    }

    console.log('\n✅ Migration complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total tickets migrated: ${ticketsToInsert.length}`);
    console.log(`   - Ticket numbers: ${ticketsToInsert[0]?.ticket_number} - ${ticketsToInsert[ticketsToInsert.length - 1]?.ticket_number}`);
    console.log(`   - Unique payments: ${ticketPayments.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateTickets();
