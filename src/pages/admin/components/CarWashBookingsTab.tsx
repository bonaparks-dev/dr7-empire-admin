import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

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

export default function CarWashBookingsTab() {
  const [bookings, setBookings] = useState<CarWashBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_name: '',
    appointment_date: '',
    appointment_time: '',
    price_total: 0,
    notes: ''
  })

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    setLoading(true)
    try {
      const { data, error} = await supabase
        .from('bookings')
        .select('*')
        .eq('service_type', 'car_wash')
        .order('appointment_date', { ascending: false })

      if (error) throw error

      setBookings(data || [])
    } catch (error) {
      console.error('Failed to load car wash bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`

      const { error } = await supabase
        .from('bookings')
        .insert([{
          service_type: 'car_wash',
          service_name: formData.service_name,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          appointment_date: appointmentDateTime,
          appointment_time: formData.appointment_time,
          price_total: formData.price_total * 100,
          currency: 'EUR',
          status: 'confirmed',
          payment_status: 'paid',
          booking_details: { notes: formData.notes },
          booked_at: new Date().toISOString()
        }])

      if (error) throw error

      alert('✅ Prenotazione creata con successo!')
      setShowForm(false)
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        service_name: '',
        appointment_date: '',
        appointment_time: '',
        price_total: 0,
        notes: ''
      })
      loadBookings()
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('❌ Errore nella creazione della prenotazione')
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome Cliente</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefono</label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
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
                  Totale: EUR {formData.price_total.toFixed(2)}
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Stato</th>
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
                          booking.status === 'confirmed'
                            ? 'bg-green-900 text-green-300'
                            : booking.status === 'pending'
                            ? 'bg-yellow-900 text-yellow-300'
                            : booking.status === 'cancelled'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.payment_status === 'completed' || booking.payment_status === 'paid'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-yellow-900 text-yellow-300'
                        }`}
                      >
                        {booking.payment_status}
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
