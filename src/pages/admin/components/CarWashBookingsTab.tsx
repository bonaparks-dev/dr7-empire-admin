import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

interface Customer {
  id: string
  full_name: string
  email: string | null
  phone: string | null
}

interface CarWashBooking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_name: string
  appointment_date: string
  appointment_time: string
  price_total: number
  status: string
  payment_status: string
  booking_details: any
  created_at: string
}

const CAR_WASH_SERVICES = [
  { id: 'full-clean', name: 'Lavaggio Completo', price: 25, duration: '45 min' },
  { id: 'top-shine', name: 'Lavaggio Top', price: 49, duration: '1.5 ore' },
  { id: 'vip', name: 'Lavaggio VIP', price: 75, duration: '3 ore' },
  { id: 'dr7-luxury', name: 'Lavaggio DR7 Luxury', price: 99, duration: '4 ore' }
]

const ADDITIONAL_SERVICES = [
  { value: 'interior-sanification', label: 'Sanificazione interni (+€30)', price: 30 },
  { value: 'engine-cleaning', label: 'Pulizia motore (+€50)', price: 50 },
  { value: 'headlight-polish', label: 'Lucidatura fari (+€40)', price: 40 }
]

export default function CarWashBookingsTab() {
  const [bookings, setBookings] = useState<CarWashBooking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newCustomerMode, setNewCustomerMode] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    customer_id: '',
    service_name: '',
    appointment_date: '',
    appointment_time: '',
    additional_service: '',
    price_total: 0,
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
      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_type', 'car_wash')
        .order('appointment_date', { ascending: false })

      if (bookingsError) throw bookingsError

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, full_name, email, phone')
        .order('full_name')

      if (customersError) throw customersError

      setBookings(bookingsData || [])
      setCustomers(customersData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.phone?.includes(customerSearchQuery)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      let customerName = ''
      let customerEmail = ''
      let customerPhone = ''

      // If new customer mode, create the customer first
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

        customerName = newCustomer.full_name
        customerEmail = newCustomer.email || ''
        customerPhone = newCustomer.phone || ''
      } else {
        // Get customer details from selected customer
        const customer = customers.find(c => c.id === formData.customer_id)
        if (!customer) throw new Error('Cliente non trovato')

        customerName = customer.full_name
        customerEmail = customer.email || ''
        customerPhone = customer.phone || ''
      }

      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`

      // Calculate total price
      let totalPrice = formData.price_total
      if (formData.additional_service) {
        const additionalService = ADDITIONAL_SERVICES.find(s => s.value === formData.additional_service)
        if (additionalService) {
          totalPrice += additionalService.price
        }
      }

      const bookingDetails: any = {
        notes: formData.notes
      }

      if (formData.additional_service) {
        const additionalService = ADDITIONAL_SERVICES.find(s => s.value === formData.additional_service)
        bookingDetails.additionalService = additionalService?.label || formData.additional_service
      }

      const { error } = await supabase
        .from('bookings')
        .insert([{
          user_id: null, // Admin-created booking
          guest_name: customerName,
          guest_email: customerEmail,
          guest_phone: customerPhone,
          service_type: 'car_wash',
          service_name: formData.service_name,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          appointment_date: appointmentDateTime,
          appointment_time: formData.appointment_time,
          price_total: totalPrice * 100, // Convert to cents
          currency: 'EUR',
          status: 'confirmed',
          payment_status: 'paid',
          booking_details: bookingDetails,
          booked_at: new Date().toISOString()
        }])

      if (error) throw error

      alert('✅ Prenotazione creata con successo!')
      setShowForm(false)
      setNewCustomerMode(false)
      setCustomerSearchQuery('')
      setFormData({
        customer_id: '',
        service_name: '',
        appointment_date: '',
        appointment_time: '',
        additional_service: '',
        price_total: 0,
        notes: ''
      })
      setNewCustomerData({
        full_name: '',
        email: '',
        phone: ''
      })
      loadData()
    } catch (error: any) {
      console.error('Failed to create booking:', error)
      alert(`❌ Errore nella creazione della prenotazione: ${error.message}`)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-dr7-gold">Prenotazioni Lavaggio</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {bookings.length} prenotazion{bookings.length !== 1 ? 'i' : 'e'}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors"
          >
            {showForm ? 'Chiudi' : '+ Nuova Prenotazione'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Crea Nuova Prenotazione Lavaggio</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Selection */}
            <div className="border-b border-gray-700 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setNewCustomerMode(false)
                    setCustomerSearchQuery('')
                  }}
                  className={`px-4 py-2 rounded ${
                    !newCustomerMode
                      ? 'bg-dr7-gold text-black font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Seleziona Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setNewCustomerMode(true)}
                  className={`px-4 py-2 rounded ${
                    newCustomerMode
                      ? 'bg-dr7-gold text-black font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Nuovo Cliente
                </button>
              </div>

              {!newCustomerMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cerca Cliente</label>
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Nome, email o telefono..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mb-2"
                  />
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">Seleziona un cliente</option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} - {customer.email || customer.phone || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={newCustomerData.full_name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, full_name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefono</label>
                    <input
                      type="tel"
                      required
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Servizio</label>
                <select
                  required
                  value={formData.service_name}
                  onChange={(e) => {
                    const service = CAR_WASH_SERVICES.find(s => s.name === e.target.value)
                    setFormData({
                      ...formData,
                      service_name: e.target.value,
                      price_total: service?.price || 0
                    })
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Seleziona servizio</option>
                  {CAR_WASH_SERVICES.map(service => (
                    <option key={service.id} value={service.name}>
                      {service.name} - EUR {service.price} ({service.duration})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Servizio Aggiuntivo (opzionale)</label>
                <select
                  value={formData.additional_service}
                  onChange={(e) => setFormData({ ...formData, additional_service: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Nessuno</option>
                  {ADDITIONAL_SERVICES.map(service => (
                    <option key={service.value} value={service.value}>
                      {service.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                <input
                  type="date"
                  required
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ora</label>
                <input
                  type="time"
                  required
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Note (opzionale)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={3}
              />
            </div>
            {formData.price_total > 0 && (
              <div className="text-right">
                <span className="text-lg font-bold text-dr7-gold">
                  Totale: EUR {(formData.price_total + (formData.additional_service ? ADDITIONAL_SERVICES.find(s => s.value === formData.additional_service)?.price || 0 : 0)).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded"
              >
                Crea Prenotazione
              </button>
            </div>
          </form>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-dr7-dark rounded-lg border border-gray-800 p-8 text-center text-gray-500">
          Nessuna prenotazione lavaggio trovata
        </div>
      ) : (
        <div className="bg-dr7-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-dr7-darker">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Servizio</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Data & Ora</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Prezzo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-gray-800 hover:bg-dr7-darker/50">
                    <td className="px-4 py-3 text-sm text-white">
                      <div className="font-medium">{booking.customer_name}</div>
                      <div className="text-xs text-gray-400">{booking.customer_email}</div>
                      <div className="text-xs text-gray-400">{booking.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <div className="font-medium">{booking.service_name}</div>
                      {booking.booking_details?.additionalService && (
                        <div className="text-xs text-gray-400">
                          + {booking.booking_details.additionalService}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <div>
                        {booking.appointment_date
                          ? new Date(booking.appointment_date).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              timeZone: 'Europe/Rome'
                            })
                          : '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {booking.appointment_time || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-bold">
                      EUR {(booking.price_total / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.payment_status === 'completed' || booking.payment_status === 'paid'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {booking.payment_status === 'completed' || booking.payment_status === 'paid' ? 'Pagato' : 'Non Pagato'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
