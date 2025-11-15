import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../supabaseClient'

interface Booking {
  id: string
  service_type: 'car_rental' | 'car_wash' | null
  service_name?: string
  vehicle_name: string
  customer_name: string
  customer_email: string
  appointment_date?: string
  appointment_time?: string
  pickup_date?: string
  dropoff_date?: string
  price_total: number
  status: string
  payment_status: string
}

export default function CalendarTab() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')

  useEffect(() => {
    loadBookings()

    // Set up real-time subscription
    const subscription = supabase
      .channel('calendar-bookings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadBookings()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadBookings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_type, service_name, vehicle_name, customer_name, customer_email, appointment_date, appointment_time, pickup_date, dropoff_date, price_total, status, payment_status')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const vehicles = useMemo(() => {
    const uniqueVehicles = new Set<string>()
    bookings.forEach(booking => {
      if (booking.vehicle_name) {
        uniqueVehicles.add(booking.vehicle_name)
      }
    })
    return Array.from(uniqueVehicles).sort()
  }, [bookings])

  const filteredBookings = useMemo(() => {
    if (selectedVehicle === 'all') return bookings
    return bookings.filter(b => b.vehicle_name === selectedVehicle)
  }, [bookings, selectedVehicle])

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]

    return filteredBookings.filter(booking => {
      if (booking.service_type === 'car_wash' && booking.appointment_date) {
        const bookingDate = new Date(booking.appointment_date).toISOString().split('T')[0]
        return bookingDate === dateStr
      }

      // Handle car rentals
      const startDate = booking.pickup_date
      const endDate = booking.dropoff_date

      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const check = new Date(date)
        check.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)

        return check >= start && check <= end
      }

      return false
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

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const calendarDays = getCalendarDays()
  const monthName = currentDate.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric'
  })

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Caricamento calendario...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filtra per veicolo
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
            >
              <option value="all">Tutti i veicoli</option>
              {vehicles.map(vehicle => (
                <option key={vehicle} value={vehicle}>
                  {vehicle}
                </option>
              ))}
            </select>
          </div>

          {/* Month Navigation */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="flex-1 px-4 py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors"
            >
              Oggi
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              →
            </button>
          </div>

          {/* Stats */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Prenotazioni totali</div>
            <div className="text-2xl font-bold text-white">{filteredBookings.length}</div>
          </div>
        </div>
      </div>

      {/* Calendar Month/Year Display */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white capitalize">{monthName}</h2>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-900 rounded-lg p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, idx) => (
            <div key={idx} className="text-center text-sm font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const dayBookings = getBookingsForDate(day)
            const isToday = day.toDateString() === new Date().toDateString()
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square border rounded-lg p-2 transition-colors
                  ${isToday ? 'border-white bg-white/10' : 'border-gray-700'}
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                  ${dayBookings.length > 0 ? 'bg-gray-800/50' : 'bg-gray-900/30'}
                  hover:bg-gray-800 cursor-pointer
                `}
              >
                <div className="text-sm font-semibold text-white mb-1">
                  {day.getDate()}
                </div>

                {/* Booking indicators */}
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map(booking => (
                    <div
                      key={booking.id}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate border
                        ${getStatusColor(booking.status)}
                      `}
                      title={`${booking.vehicle_name} - ${booking.customer_name}`}
                    >
                      {booking.service_type === 'car_wash' ? '🚿' : '🚗'}{' '}
                      {booking.appointment_time || 'Noleggio'}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{dayBookings.length - 2} altro
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-900 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-white mb-4">Legenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚿</span>
            <span className="text-sm text-gray-300">Autolavaggio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <span className="text-sm text-gray-300">Noleggio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-sm text-gray-300">Confermato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
            <span className="text-sm text-gray-300">In attesa</span>
          </div>
        </div>
      </div>
    </div>
  )
}
