import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

interface Customer {
  id: string
  full_name: string
  email: string | null
  phone: string | null
}

interface MechanicalBooking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_name: string
  vehicle_info: string // Customer's vehicle info
  appointment_date: string
  appointment_time: string
  price_total: number
  status: string
  payment_status: string
  booking_details: any
  created_at: string
}

// Mechanical services based on the price list
const MECHANICAL_SERVICES = [
  // CAMBIO PASTIGLIE FRENI
  { id: 'brake-pads-front', name: 'Cambio Pastiglie Freni - Anteriori', price: 29, category: 'Freni' },
  { id: 'brake-pads-rear', name: 'Cambio Pastiglie Freni - Posteriori', price: 29, category: 'Freni' },
  { id: 'brake-pads-all', name: 'Cambio Pastiglie Freni - Anteriori + Posteriori', price: 49, category: 'Freni' },

  // TAGLIANDO RAPIDO
  { id: 'service-city', name: 'Tagliando Rapido (Olio + Filtri) - City Car/Utilitarie', price: 39, category: 'Tagliando' },
  { id: 'service-sedan', name: 'Tagliando Rapido (Olio + Filtri) - Berlina/SUV', price: 49, category: 'Tagliando' },
  { id: 'service-luxury', name: 'Tagliando Rapido (Olio + Filtri) - Luxury/Sportive', price: 59, category: 'Tagliando' },

  // CAMBIO SPAZZOLE TERGICRISTALLI
  { id: 'wipers-front', name: 'Cambio Spazzole Tergicristalli - Coppia Anteriore', price: 5, category: 'Accessori' },
  { id: 'wipers-rear', name: 'Cambio Spazzole Tergicristalli - Posteriore', price: 3, category: 'Accessori' },

  // SOSTITUZIONE BATTERIA
  { id: 'battery-city', name: 'Sostituzione Batteria - City Car/Utilitarie', price: 15, category: 'Elettrica' },
  { id: 'battery-sedan', name: 'Sostituzione Batteria - Berlina/SUV', price: 19, category: 'Elettrica' },

  // CAMBIO LAMPADINE
  { id: 'bulb-standard', name: 'Cambio Lampadina - Standard', price: 5, category: 'Elettrica' },
  { id: 'bulb-led', name: 'Cambio Lampadina - LED/Xenon', price: 10, category: 'Elettrica' },

  // LUCIDATURA FARI
  { id: 'headlight-polish-1', name: 'Lucidatura Fari - 1 Faro', price: 15, category: 'Carrozzeria' },
  { id: 'headlight-polish-2', name: 'Lucidatura Fari - 2 Fari', price: 30, category: 'Carrozzeria' },
  { id: 'headlight-polish-4', name: 'Lucidatura Fari - 4 Fari', price: 50, category: 'Carrozzeria' },

  // LUCIDATURA COMPLETA CARROZZERIA
  { id: 'body-polish-small', name: 'Lucidatura Completa Carrozzeria - Auto Piccola', price: 200, category: 'Carrozzeria' },
  { id: 'body-polish-medium', name: 'Lucidatura Completa Carrozzeria - Auto Media', price: 250, category: 'Carrozzeria' },
  { id: 'body-polish-large', name: 'Lucidatura Completa Carrozzeria - Auto Grande/SUV', price: 300, category: 'Carrozzeria' },
]

// Generate time slots: 9h-13h and 15h-19h, every 30 minutes
const generateTimeSlots = () => {
  const slots: string[] = []

  // Morning slots: 9h-13h
  for (let hour = 9; hour < 13; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }

  // Afternoon slots: 15h-18h (18:00 is the last slot)
  for (let hour = 15; hour < 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      if (hour === 18 && minute > 0) break
      slots.push(time)
    }
  }

  return slots
}

const TIME_SLOTS = generateTimeSlots()

export default function MechanicalBookingTab() {
  const [bookings, setBookings] = useState<MechanicalBooking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newCustomerMode, setNewCustomerMode] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    service_name: '',
    vehicle_info: '',
    appointment_date: '',
    appointment_time: '',
    price_total: 0,
    payment_status: 'paid',
    notes: ''
  })

  const [newCustomerData, setNewCustomerData] = useState({
    full_name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('full_name')

      if (customersError) throw customersError
      setCustomers(customersData || [])

      // Load mechanical service bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_type', 'mechanical_service')
        .order('appointment_date', { ascending: false })

      if (bookingsError) throw bookingsError
      setBookings(bookingsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      let customerId = formData.customer_id

      // Create new customer if needed
      if (newCustomerMode) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            full_name: newCustomerData.full_name,
            email: newCustomerData.email || null,
            phone: newCustomerData.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      const customerInfo = newCustomerMode ? newCustomerData : customers.find(c => c.id === customerId)

      const bookingData = {
        user_id: null,
        guest_name: customerInfo?.full_name || 'N/A',
        guest_email: customerInfo?.email || null,
        guest_phone: customerInfo?.phone || null,
        vehicle_type: 'service',
        vehicle_name: formData.vehicle_info, // Customer's vehicle info
        service_type: 'mechanical_service',
        service_name: formData.service_name,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        price_total: Math.round(formData.price_total * 100), // Convert to cents
        currency: 'EUR',
        status: 'confirmed',
        payment_status: formData.payment_status,
        payment_method: 'agency',
        customer_name: customerInfo?.full_name || 'N/A',
        customer_email: customerInfo?.email || null,
        customer_phone: customerInfo?.phone || null,
        booking_source: 'admin',
        booking_details: {
          customer: {
            fullName: customerInfo?.full_name || '',
            email: customerInfo?.email || '',
            phone: customerInfo?.phone || '',
            customerId: customerId
          },
          vehicleInfo: formData.vehicle_info,
          notes: formData.notes || null,
          source: 'admin_manual'
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { data: insertedBooking, error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select()
          .single()

        if (error) throw error

        // Generate PDF invoice for mechanical service
        try {
          await fetch('/.netlify/functions/generate-invoice-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: insertedBooking?.id || '',
              bookingType: 'mechanical',
              customerName: customerInfo?.full_name || '',
              customerEmail: customerInfo?.email || '',
              customerPhone: customerInfo?.phone || '',
              items: [{
                description: `Servizio Meccanico: ${formData.service_name} - ${formData.vehicle_info}`,
                quantity: 1,
                unitPrice: Math.round(formData.price_total * 100),
                total: Math.round(formData.price_total * 100)
              }],
              subtotal: Math.round(formData.price_total * 100),
              tax: 0,
              total: Math.round(formData.price_total * 100),
              paymentStatus: formData.payment_status,
              bookingDate: new Date().toISOString(),
              serviceDate: `${formData.appointment_date}T${formData.appointment_time}:00`,
              notes: formData.notes || ''
            })
          })
          console.log('✅ Invoice generated successfully')
        } catch (invoiceError) {
          console.error('⚠️ Failed to generate invoice:', invoiceError)
          // Don't fail the whole booking if invoice generation fails
        }

        // Create Google Calendar event
        try {
          const [hours, minutes] = formData.appointment_time.split(':').map(Number)
          const endHours = hours + 1 // Default 1 hour duration for mechanical services
          const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

          await fetch('/.netlify/functions/create-calendar-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleName: `🔧 ${formData.service_name}`,
              customerName: customerInfo?.full_name || '',
              customerEmail: customerInfo?.email || '',
              customerPhone: customerInfo?.phone || '',
              pickupDate: formData.appointment_date,
              pickupTime: formData.appointment_time,
              returnDate: formData.appointment_date,
              returnTime: endTime,
              pickupLocation: `DR7 Rapid Service - ${formData.vehicle_info}`,
              returnLocation: 'DR7 Office',
              totalPrice: formData.price_total
            })
          })
          console.log('✅ Calendar event created')
        } catch (calendarError) {
          console.error('⚠️ Failed to create calendar event:', calendarError)
        }
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save booking:', error)
      alert('Errore durante il salvataggio: ' + (error as Error).message)
    }
  }

  function resetForm() {
    setFormData({
      customer_id: '',
      service_name: '',
      vehicle_info: '',
      appointment_date: '',
      appointment_time: '',
      price_total: 0,
      payment_status: 'paid',
      notes: ''
    })
    setNewCustomerData({
      full_name: '',
      email: '',
      phone: ''
    })
    setNewCustomerMode(false)
    setCustomerSearchQuery('')
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa prenotazione?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Failed to delete booking:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🔧 Prenotazioni Meccanica</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors"
        >
          + Nuova Prenotazione
        </button>
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Modifica Prenotazione' : 'Nuova Prenotazione Meccanica'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-white font-semibold mb-3">Cliente</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setNewCustomerMode(false)}
                    className={`px-4 py-2 rounded-lg font-medium ${!newCustomerMode ? 'bg-dr7-gold text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                  >
                    Cliente Esistente
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustomerMode(true)}
                    className={`px-4 py-2 rounded-lg font-medium ${newCustomerMode ? 'bg-dr7-gold text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                  >
                    Nuovo Cliente
                  </button>
                </div>

                {!newCustomerMode ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Cerca cliente..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white mb-2"
                    />
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    >
                      <option value="">Seleziona cliente...</option>
                      {filteredCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} {c.phone ? `- ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Nome completo"
                      value={newCustomerData.full_name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, full_name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Telefono"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    />
                  </div>
                )}
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-white font-semibold mb-2">Servizio</label>
                <select
                  required
                  value={formData.service_name}
                  onChange={(e) => {
                    const selectedService = MECHANICAL_SERVICES.find(s => s.name === e.target.value)
                    setFormData({
                      ...formData,
                      service_name: e.target.value,
                      price_total: selectedService?.price || 0
                    })
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="">Seleziona servizio...</option>
                  {MECHANICAL_SERVICES.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} - €{s.price} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Info */}
              <div>
                <label className="block text-white font-semibold mb-2">Info Veicolo Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="es. Fiat Panda 2018 - AA123BB"
                  value={formData.vehicle_info}
                  onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                />
              </div>

              {/* Appointment Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Data</label>
                  <input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Ora</label>
                  <select
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  >
                    <option value="">Seleziona orario...</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Payment Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Prezzo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price_total}
                    onChange={(e) => setFormData({ ...formData, price_total: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Stato Pagamento</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  >
                    <option value="paid">Pagato</option>
                    <option value="pending">Da Saldare</option>
                    <option value="unpaid">Non Pagato</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white font-semibold mb-2">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  rows={3}
                  placeholder="Note aggiuntive..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors"
                >
                  Salva
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Veicolo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Servizio</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Appuntamento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Prezzo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Pagamento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-white">
                  <div>{booking.customer_name}</div>
                  <div className="text-gray-400 text-xs">{booking.customer_phone}</div>
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {booking.booking_details?.vehicleInfo || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {booking.service_name}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  <div>
                    {booking.appointment_date && new Date(booking.appointment_date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-dr7-gold">{booking.appointment_time}</div>
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  €{(booking.price_total / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.payment_status === 'paid' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {booking.payment_status === 'paid' ? 'Pagato' : 'Non Pagato'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Nessuna prenotazione trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Note */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">📝 Note Importanti</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Tutti i prezzi, tranne le lucidature, sono di sola manodopera</li>
          <li>• I pezzi possono essere forniti dal cliente o acquistati tramite DR7</li>
          <li>• Controllo livelli incluso nei tagliandi rapidi</li>
        </ul>
      </div>
    </div>
  )
}
