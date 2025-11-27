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

export default function CarWashBookingsTab() {
  const [bookings, setBookings] = useState<CarWashBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
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
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              Per creare una nuova prenotazione lavaggio, vai alla tab <strong className="text-dr7-gold">"Prenotazioni Auto"</strong> e seleziona "Servizio Autolavaggio" nel modulo di prenotazione.
            </p>
            <p className="text-sm text-gray-500">
              Oppure usa il sistema di prenotazione sul sito principale.
            </p>
          </div>
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
                      �{(booking.price_total / 100).toFixed(2)}
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
