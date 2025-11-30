import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

interface UnpaidBooking {
  id: string
  service_type: 'rental' | 'car_wash' | 'mechanical_service'
  customer_name: string
  customer_email: string
  customer_phone: string
  service_name?: string
  vehicle_name?: string
  appointment_date?: string
  appointment_time?: string
  pickup_date?: string
  return_date?: string
  price_total: number
  status: string
  payment_status: string
  created_at: string
}

export default function UnpaidBookingsTab() {
  const [bookings, setBookings] = useState<UnpaidBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterService, setFilterService] = useState<'all' | 'rental' | 'car_wash' | 'mechanical_service'>('all')

  useEffect(() => {
    loadUnpaidBookings()

    // Real-time subscription
    const subscription = supabase
      .channel('unpaid-bookings-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => loadUnpaidBookings()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadUnpaidBookings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('payment_status', ['pending', 'unpaid'])
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBookings(data || [])
    } catch (error) {
      console.error('Failed to load unpaid bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePaymentStatus(bookingId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      alert('Stato pagamento aggiornato!')
      loadUnpaidBookings()
    } catch (error) {
      console.error('Failed to update payment status:', error)
      alert('Errore nell\'aggiornamento dello stato pagamento')
    }
  }

  const filteredBookings = filterService === 'all'
    ? bookings
    : bookings.filter(b => b.service_type === filterService)

  const totalUnpaid = filteredBookings.reduce((sum, b) => sum + (b.price_total || 0), 0)

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'rental': return '🚗'
      case 'car_wash': return '🧼'
      case 'mechanical_service': return '🔧'
      default: return '📋'
    }
  }

  const getServiceLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'rental': return 'Noleggio'
      case 'car_wash': return 'Lavaggio'
      case 'mechanical_service': return 'Meccanica'
      default: return 'Altro'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Caricamento prenotazioni da saldare...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">💳 Prenotazioni Da Saldare</h2>
            <p className="text-sm text-gray-400 mt-1">
              Tutte le prenotazioni con pagamento in sospeso
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Totale Da Saldare</div>
          <div className="text-2xl font-bold text-red-400">
            €{(totalUnpaid / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Prenotazioni</div>
          <div className="text-2xl font-bold text-white">{filteredBookings.length}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Noleggio</div>
          <div className="text-2xl font-bold text-white">
            {bookings.filter(b => b.service_type === 'rental').length}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Lavaggio + Meccanica</div>
          <div className="text-2xl font-bold text-white">
            {bookings.filter(b => b.service_type === 'car_wash' || b.service_type === 'mechanical_service').length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterService('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterService === 'all'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tutti ({bookings.length})
          </button>
          <button
            onClick={() => setFilterService('rental')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterService === 'rental'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🚗 Noleggio ({bookings.filter(b => b.service_type === 'rental').length})
          </button>
          <button
            onClick={() => setFilterService('car_wash')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterService === 'car_wash'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🧼 Lavaggio ({bookings.filter(b => b.service_type === 'car_wash').length})
          </button>
          <button
            onClick={() => setFilterService('mechanical_service')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterService === 'mechanical_service'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🔧 Meccanica ({bookings.filter(b => b.service_type === 'mechanical_service').length})
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Servizio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Dettagli</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Importo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Stato</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getServiceIcon(booking.service_type)}</span>
                      <span className="text-white font-medium">{getServiceLabel(booking.service_type)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-white font-semibold">{booking.customer_name}</div>
                    <div className="text-gray-400 text-xs">{booking.customer_email}</div>
                    <div className="text-gray-400 text-xs">{booking.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.service_type === 'rental' ? (
                      <div>
                        <div className="text-white">{booking.vehicle_name}</div>
                        <div className="text-gray-400 text-xs">
                          {booking.pickup_date && new Date(booking.pickup_date).toLocaleDateString('it-IT')} -
                          {booking.return_date && new Date(booking.return_date).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-white">{booking.service_name}</div>
                        <div className="text-gray-400 text-xs">
                          {booking.appointment_date && new Date(booking.appointment_date).toLocaleDateString('it-IT')} {booking.appointment_time}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(booking.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-red-400 font-bold text-lg">
                      €{(booking.price_total / 100).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      booking.payment_status === 'pending'
                        ? 'bg-yellow-600 text-black'
                        : 'bg-red-600 text-white'
                    }`}>
                      {booking.payment_status === 'pending' ? 'Da Saldare' : 'Non Pagato'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => updatePaymentStatus(booking.id, 'paid')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Segna Pagato
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {filterService === 'all'
                      ? 'Nessuna prenotazione da saldare! 🎉'
                      : `Nessuna prenotazione ${getServiceLabel(filterService).toLowerCase()} da saldare`
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
