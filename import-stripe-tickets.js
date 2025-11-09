#!/usr/bin/env node

/**
 * Import Stripe tickets from CSV to Supabase
 *
 * Usage: node import-stripe-tickets.js stripe-tickets.csv
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const row = {};
    headers.forEach((header, i) => {
      let value = values[i] || '';
      value = value.replace(/^"|"$/g, '').trim();
      row[header] = value;
    });
    return row;
  });
}

function parseAmount(amountStr) {
  // Convert "20,00" to 2000 (cents) or "1,00" to 100
  const cleaned = amountStr.replace(/"/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
}

function parseDate(dateStr) {
  // Parse "2025-11-03 21:18:51" format
  return new Date(dateStr).toISOString();
}

async function importTickets(csvFilePath) {
  console.log('📖 Reading CSV file...\n');

  const csvText = fs.readFileSync(csvFilePath, 'utf-8');
  const rows = parseCSV(csvText);

  console.log(`Found ${rows.length} transactions in CSV\n`);

  // Filter for valid ticket purchases
  const validTickets = rows.filter(row => {
    const purchaseType = row['purchaseType (metadata)'] || row['email (metadata)'];
    const amount = parseAmount(row['Amount']);

    // Include if:
    // 1. purchaseType is commercial-operation-ticket or lottery-ticket
    // 2. OR amount is 2000 cents (20€)
    // 3. Status is Paid
    return (
      row['Status'] === 'Paid' &&
      (purchaseType === 'commercial-operation-ticket' ||
       purchaseType === 'lottery-ticket' ||
       amount === 2000)
    );
  });

  console.log(`Found ${validTickets.length} valid ticket purchases\n`);

  // Get the highest ticket number currently in database
  const { data: existingTickets } = await supabase
    .from('commercial_operation_tickets')
    .select('ticket_number')
    .order('ticket_number', { ascending: false })
    .limit(1);

  let nextTicketNumber = existingTickets && existingTickets.length > 0
    ? existingTickets[0].ticket_number + 1
    : 1;

  console.log(`Starting ticket numbers from: ${nextTicketNumber}\n`);

  const ticketsToInsert = [];

  for (const row of validTickets) {
    const chargeId = row['id'];
    const email = row['email (metadata)'] || row['Customer Email'] || '';
    const amount = parseAmount(row['Amount']);
    const currency = row['Currency'].toLowerCase();
    const purchaseDate = parseDate(row['Created date (UTC)']);

    // Get quantity from metadata, default to 1
    let quantity = parseInt(row['tickets_qty (metadata)'] || '1', 10);

    // If no explicit quantity but amount is multiple of 20€, calculate it
    if (!row['tickets_qty (metadata)'] && amount >= 2000) {
      quantity = Math.floor(amount / 2000);
    }

    // Create tickets based on quantity
    for (let i = 0; i < quantity; i++) {
      ticketsToInsert.push({
        uuid: `${chargeId}-${i}`,
        ticket_number: nextTicketNumber++,
        user_id: null,
        email: email,
        full_name: email.split('@')[0], // Use email username as name if no name provided
        payment_intent_id: chargeId,
        amount_paid: 2000, // Each ticket is 20€
        currency: 'eur',
        purchase_date: purchaseDate,
        quantity: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    console.log(`✓ Prepared ${quantity} ticket(s) for ${email || chargeId} (${amount/100}€)`);
  }

  console.log(`\n📦 Inserting ${ticketsToInsert.length} tickets into Supabase...\n`);

  // Insert in batches of 50
  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < ticketsToInsert.length; i += batchSize) {
    const batch = ticketsToInsert.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('commercial_operation_tickets')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      // Continue with next batch
    } else {
      successCount += batch.length;
      console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} tickets)`);
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Total tickets inserted: ${successCount}`);
  console.log(`   - Ticket numbers: ${ticketsToInsert[0]?.ticket_number} - ${ticketsToInsert[ticketsToInsert.length - 1]?.ticket_number}`);
  console.log(`   - Unique transactions: ${validTickets.length}`);
}

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('❌ Error: CSV file path required');
  console.error('   Usage: node import-stripe-tickets.js stripe-tickets.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: File not found: ${csvFilePath}`);
  process.exit(1);
}

// Run the import
importTickets(csvFilePath).catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
