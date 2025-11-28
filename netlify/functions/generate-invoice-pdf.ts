import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface InvoiceData {
  bookingId: string
  bookingType: 'car_rental' | 'car_wash' | 'mechanical'
  customerName: string
  customerEmail: string
  customerPhone: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  total: number
  paymentStatus: string
  bookingDate: string
  serviceDate: string
  notes?: string
}

// Generate HTML for PDF invoice
function generateInvoiceHTML(data: InvoiceData): string {
  const invoiceNumber = `DR7-${data.bookingId.substring(0, 8).toUpperCase()}`
  const invoiceDate = new Date().toLocaleDateString('it-IT')

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fattura ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      color: #333;
      padding: 40px;
      background: white;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border: 1px solid #ddd;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      border-bottom: 3px solid #d4af37;
      padding-bottom: 20px;
    }
    .company-info h1 {
      color: #d4af37;
      font-size: 32px;
      margin-bottom: 5px;
    }
    .company-info p {
      font-size: 12px;
      color: #666;
      line-height: 1.5;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-details h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-details p {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    .customer-info {
      margin-bottom: 30px;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
    }
    .customer-info h3 {
      font-size: 16px;
      margin-bottom: 10px;
      color: #d4af37;
    }
    .customer-info p {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .items-table {
      width: 100%;
      margin-bottom: 30px;
      border-collapse: collapse;
    }
    .items-table thead {
      background: #d4af37;
      color: white;
    }
    .items-table th {
      padding: 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
    }
    .items-table tbody tr:hover {
      background: #f9f9f9;
    }
    .text-right { text-align: right; }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-row.subtotal {
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .totals-row.total {
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #d4af37;
    }
    .payment-status {
      margin-top: 30px;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      font-weight: bold;
      font-size: 16px;
    }
    .payment-status.paid {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .payment-status.pending {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    .payment-status.unpaid {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .notes {
      margin-top: 30px;
      padding: 15px;
      background: #f9f9f9;
      border-left: 3px solid #d4af37;
      font-size: 13px;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>DR7 EMPIRE</h1>
        <p>Via Esempio, 123<br>
        09100 Cagliari, CA<br>
        P.IVA: IT12345678901<br>
        Tel: +39 123 456 7890<br>
        Email: info@dr7empire.com</p>
      </div>
      <div class="invoice-details">
        <h2>FATTURA</h2>
        <p><strong>N°:</strong> ${invoiceNumber}</p>
        <p><strong>Data:</strong> ${invoiceDate}</p>
        <p><strong>Data Prenotazione:</strong> ${new Date(data.bookingDate).toLocaleDateString('it-IT')}</p>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="customer-info">
      <h3>INTESTATO A:</h3>
      <p><strong>${data.customerName}</strong><br>
      ${data.customerEmail ? `Email: ${data.customerEmail}<br>` : ''}
      ${data.customerPhone ? `Tel: ${data.customerPhone}` : ''}</p>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Descrizione</th>
          <th class="text-right">Qtà</th>
          <th class="text-right">Prezzo Unit.</th>
          <th class="text-right">Totale</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">€${(item.unitPrice / 100).toFixed(2)}</td>
          <td class="text-right">€${(item.total / 100).toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row subtotal">
        <span>Subtotale:</span>
        <span>€${(data.subtotal / 100).toFixed(2)}</span>
      </div>
      ${data.tax > 0 ? `
      <div class="totals-row">
        <span>IVA (22%):</span>
        <span>€${(data.tax / 100).toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>TOTALE:</span>
        <span>€${(data.total / 100).toFixed(2)}</span>
      </div>
    </div>

    <!-- Payment Status -->
    <div class="payment-status ${data.paymentStatus}">
      ${data.paymentStatus === 'paid' ? '✓ PAGATO' :
        data.paymentStatus === 'pending' ? '⏳ DA SALDARE' : '✗ NON PAGATO'}
    </div>

    ${data.notes ? `
    <div class="notes">
      <strong>Note:</strong><br>
      ${data.notes}
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>Grazie per aver scelto DR7 Empire</p>
      <p>www.dr7empire.com</p>
    </div>
  </div>
</body>
</html>
  `
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const invoiceData: InvoiceData = JSON.parse(event.body || '{}')

    // Generate HTML
    const html = generateInvoiceHTML(invoiceData)

    // Store invoice in Supabase fatture table
    const { data: invoice, error } = await supabase
      .from('fatture')
      .insert([{
        booking_id: invoiceData.bookingId,
        booking_type: invoiceData.bookingType,
        invoice_number: `DR7-${invoiceData.bookingId.substring(0, 8).toUpperCase()}`,
        customer_name: invoiceData.customerName,
        customer_email: invoiceData.customerEmail,
        customer_phone: invoiceData.customerPhone,
        total_amount: invoiceData.total,
        payment_status: invoiceData.paymentStatus,
        invoice_date: new Date().toISOString(),
        invoice_html: html,
        items: invoiceData.items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      throw error
    }

    console.log('✅ Invoice created:', invoice)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        invoice,
        html
      })
    }
  } catch (error: any) {
    console.error('Failed to generate invoice:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
