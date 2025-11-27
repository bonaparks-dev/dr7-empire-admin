import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../supabaseClient'

interface Vehicle {
  id: string
  display_name: string
  status: string
  category: 'exotic' | 'urban' | 'aziendali' | null
}

interface Booking {
  id: string
  vehicle_name: string
  pickup_date: string
  dropoff_date: string
  status: string
  customer_name: string
  customer_email: string
  price_total: number
}

type CellStatus = 'available' | 'rented'

export default function CalendarTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCell, setSelectedCell] = useState<{
    vehicle: string
    date: string
    bookings: Booking[]
  } | null>(null)

  useEffect(() => {
    loadData()

    // Real-time subscription
    const subscription = supabase
      .channel('calendar-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => loadData()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load vehicles - Exotic first, then Urban
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, display_name, status, category')
        .neq('status', 'retired')
        .order('category', { ascending: true })
        .order('display_name')

      if (vehiclesError) throw vehiclesError

      // Load bookings (only car rentals, not car wash) - include ALL statuses except cancelled
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, vehicle_name, pickup_date, dropoff_date, status, customer_name, customer_email, price_total, service_type')
        .or('service_type.is.null,service_type.eq.car_rental')
        .neq('status', 'cancelled')
        .order('pickup_date', { ascending: true })

      if (bookingsError) throw bookingsError

      console.log('📅 CALENDARIO - Veicoli caricati:', vehiclesData?.length || 0)
      console.log('📅 CALENDARIO - Prenotazioni caricate:', bookingsData?.length || 0)

      if (bookingsData && bookingsData.length > 0) {
        console.log('📅 CALENDARIO - Prima prenotazione:', {
          vehicle: bookingsData[0].vehicle_name,
          pickup: bookingsData[0].pickup_date,
          dropoff: bookingsData[0].dropoff_date,
          status: bookingsData[0].status
        })
      }

      // Log vehicle names for debugging matching
      console.log('📅 CALENDARIO - Nomi veicoli:', vehiclesData?.map(v => v.display_name))
      console.log('📅 CALENDARIO - Nomi nelle prenotazioni:', [...new Set(bookingsData?.map(b => b.vehicle_name))])

      setVehicles(vehiclesData || [])
      setBookings(bookingsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: lastDay }, (_, i) => i + 1)
  }, [currentDate])

  const getCellStatus = (vehicle: Vehicle, day: number): CellStatus => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const checkDate = new Date(year, month, day)
    checkDate.setHours(0, 0, 0, 0)

    // Find bookings for this vehicle on this day
    // Use case-insensitive and trimmed comparison to handle any formatting differences
    const vehicleBookings = bookings.filter(booking => {
      const bookingVehicle = booking.vehicle_name?.trim().toLowerCase()
      const vehicleDisplay = vehicle.display_name?.trim().toLowerCase()

      if (bookingVehicle !== vehicleDisplay) return false

      const pickupDate = new Date(booking.pickup_date)
      const dropoffDate = new Date(booking.dropoff_date)

      pickupDate.setHours(0, 0, 0, 0)
      dropoffDate.setHours(0, 0, 0, 0)

      // The car is rented from pickup day (inclusive) to the day BEFORE dropoff day
      // On dropoff day, the car is available again (green)
      return checkDate >= pickupDate && checkDate < dropoffDate
    })

    return vehicleBookings.length > 0 ? 'rented' : 'available'
  }

  const getCellBookings = (vehicle: Vehicle, day: number): Booking[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const checkDate = new Date(year, month, day)
    checkDate.setHours(0, 0, 0, 0)

    return bookings.filter(booking => {
      const bookingVehicle = booking.vehicle_name?.trim().toLowerCase()
      const vehicleDisplay = vehicle.display_name?.trim().toLowerCase()

      if (bookingVehicle !== vehicleDisplay) return false

      const pickupDate = new Date(booking.pickup_date)
      const dropoffDate = new Date(booking.dropoff_date)

      pickupDate.setHours(0, 0, 0, 0)
      dropoffDate.setHours(0, 0, 0, 0)

      return checkDate >= pickupDate && checkDate < dropoffDate
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthName = currentDate.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric'
  })

  // Get today's date for highlighting
  const today = new Date()
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() &&
                         today.getFullYear() === currentDate.getFullYear()
  const todayDay = isCurrentMonth ? today.getDate() : null

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Caricamento calendario...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Calendario Disponibilità Flotta</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Veicoli totali:</span>
              <span className="text-dr7-gold font-bold text-lg">{vehicles.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors text-xl font-bold"
              aria-label="Mese precedente"
            >
              ← Mese Precedente
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors text-xl font-bold"
              aria-label="Mese successivo"
            >
              Mese Successivo →
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-xl text-white capitalize font-semibold">{monthName}</h3>
        </div>
      </div>

      {/* All Vehicles Grid - Combined */}
      {vehicles.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 lg:p-6 overflow-x-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-400">Tutti i Veicoli ({vehicles.length})</span>
          </h3>

          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-900 border border-gray-700 px-2 py-1 text-left text-white font-bold text-xs min-w-[140px]">
                    Veicolo
                  </th>
                  {daysInMonth.map(day => (
                    <th
                      key={day}
                      className={`border border-gray-700 px-1 py-1 text-center text-[10px] font-semibold min-w-[24px] ${
                        day === todayDay ? 'bg-dr7-gold/20 text-dr7-gold' : 'text-gray-400'
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td className="sticky left-0 z-10 bg-gray-900 border border-gray-700 px-2 py-1 text-white font-semibold text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{vehicle.display_name}</span>
                        {vehicle.category && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${
                            vehicle.category === 'exotic'
                              ? 'bg-purple-900 text-purple-200'
                              : vehicle.category === 'urban'
                              ? 'bg-cyan-900 text-cyan-200'
                              : 'bg-orange-900 text-orange-200'
                          }`}>
                            {vehicle.category}
                          </span>
                        )}
                      </div>
                    </td>
                    {daysInMonth.map(day => {
                      const status = getCellStatus(vehicle, day)
                      const cellBookings = getCellBookings(vehicle, day)
                      return (
                        <td
                          key={day}
                          onClick={() => cellBookings.length > 0 && setSelectedCell({
                            vehicle: vehicle.display_name,
                            date: `${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`,
                            bookings: cellBookings
                          })}
                          className={`border border-gray-700 p-0.5 min-w-[24px] h-6 transition-all ${
                            status === 'rented'
                              ? 'bg-red-500 hover:bg-red-600 cursor-pointer'
                              : 'bg-green-500 hover:bg-green-600'
                          } ${day === todayDay ? 'ring-1 ring-dr7-gold ring-inset' : ''}`}
                          title={status === 'rented' ? `${vehicle.display_name} - Noleggiato` : `${vehicle.display_name} - Disponibile`}
                        />
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-gray-400">Nessun veicolo trovato</p>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedCell && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCell(null)}
        >
          <div
            className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    🚗 {selectedCell.vehicle}
                  </h3>
                  <p className="text-gray-400">{selectedCell.date}</p>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-gray-400 hover:text-white transition-colors text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedCell.bookings.map(booking => (
                <div key={booking.id} className="bg-gray-800/50 rounded-lg p-5 border border-red-500/30">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-white font-bold text-lg mb-1">{booking.customer_name}</div>
                      <div className="text-gray-400 text-sm">{booking.customer_email}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ritiro:</span>
                      <span className="text-white font-medium">
                        {new Date(booking.pickup_date).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Riconsegna:</span>
                      <span className="text-white font-medium">
                        {new Date(booking.dropoff_date).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Prezzo Totale:</span>
                      <span className="text-dr7-gold font-bold text-lg">
                        €{(booking.price_total / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    ID: DR7-{booking.id.toUpperCase().slice(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
