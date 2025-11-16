import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../supabaseClient'

interface Booking {
  id: string
  service_type: 'car_rental' | 'car_wash' | null
  service_name?: string
  vehicle_name: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  appointment_date?: string
  appointment_time?: string
  pickup_date?: string
  dropoff_date?: string
  price_total: number
  status: string
  payment_status: string
  booking_source?: string
  currency?: string
}

type ViewMode = 'month' | 'day'

export default function CalendarTab() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[] | null>(null)

  // View mode state - responsive default
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      setViewMode(mobile ? 'day' : 'month')
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        .select('id, service_type, service_name, vehicle_name, customer_name, customer_email, customer_phone, appointment_date, appointment_time, pickup_date, dropoff_date, price_total, status, payment_status, booking_source, currency')
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

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 1)
      } else {
        newDate.setDate(prev.getDate() + 1)
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

  const dayName = currentDate.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const todayBookings = getBookingsForDate(currentDate)

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
      {/* Controls */}
      <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Vehicle Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filtra per veicolo
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm lg:text-base"
            >
              <option value="all">Tutti i veicoli</option>
              {vehicles.map(vehicle => (
                <option key={vehicle} value={vehicle}>
                  {vehicle}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => viewMode === 'day' ? navigateDay('prev') : navigateMonth('prev')}
              className="px-3 lg:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors text-lg lg:text-xl"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="flex-1 px-3 lg:px-4 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors text-sm lg:text-base"
            >
              Oggi
            </button>
            <button
              onClick={() => viewMode === 'day' ? navigateDay('next') : navigateMonth('next')}
              className="px-3 lg:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors text-lg lg:text-xl"
              aria-label="Next"
            >
              →
            </button>
          </div>

          {/* Stats & View Toggle */}
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-800/50 rounded-lg p-3 lg:p-4">
              <div className="text-xs lg:text-sm text-gray-400">Prenotazioni</div>
              <div className="text-xl lg:text-2xl font-bold text-white">
                {viewMode === 'day' ? todayBookings.length : filteredBookings.length}
              </div>
            </div>

            {/* View Mode Toggle - Desktop Only */}
            {!isMobile && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-dr7-gold text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Mese
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    viewMode === 'day'
                      ? 'bg-dr7-gold text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Giorno
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold text-white capitalize">
          {viewMode === 'day' ? dayName : monthName}
        </h2>
      </div>

      {/* DAY VIEW - Mobile & Desktop when selected */}
      {viewMode === 'day' && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Day Header */}
          <div className="bg-gradient-to-r from-dr7-gold to-yellow-500 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-black text-sm lg:text-base font-medium">
                  {currentDate.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}
                </div>
                <div className="text-black text-3xl lg:text-4xl font-bold">
                  {currentDate.getDate()}
                </div>
                <div className="text-black/80 text-sm lg:text-base">
                  {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-black text-2xl lg:text-3xl font-bold">
                  {todayBookings.length}
                </div>
                <div className="text-black/80 text-xs lg:text-sm">
                  prenotazion{todayBookings.length === 1 ? 'e' : 'i'}
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="p-4 lg:p-6">
            {todayBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl lg:text-5xl mb-4">📅</div>
                <p className="text-base lg:text-lg">Nessuna prenotazione per questo giorno</p>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {todayBookings
                  .sort((a, b) => {
                    // Sort by time
                    const timeA = a.service_type === 'car_wash' ? a.appointment_time : new Date(a.pickup_date || 0).toTimeString()
                    const timeB = b.service_type === 'car_wash' ? b.appointment_time : new Date(b.pickup_date || 0).toTimeString()
                    return (timeA || '').localeCompare(timeB || '')
                  })
                  .map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`
                        bg-gray-800/50 rounded-lg p-4 lg:p-5 cursor-pointer
                        hover:bg-gray-800 transition-all duration-200
                        border-l-4 ${getStatusColor(booking.status).split(' ')[0]}
                      `}
                    >
                      <div className="flex items-start gap-3 lg:gap-4">
                        {/* Icon */}
                        <div className="text-3xl lg:text-4xl flex-shrink-0">
                          {booking.service_type === 'car_wash' ? '🚿' : '🚗'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Time */}
                          <div className="text-dr7-gold font-bold text-base lg:text-lg mb-1">
                            {booking.service_type === 'car_wash' ? (
                              booking.appointment_time || 'Ora non specificata'
                            ) : (
                              booking.pickup_date
                                ? new Date(booking.pickup_date).toLocaleTimeString('it-IT', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })
                                : 'Ora non specificata'
                            )}
                          </div>

                          {/* Vehicle/Service */}
                          <div className="text-white font-semibold text-base lg:text-lg mb-1">
                            {booking.service_type === 'car_wash'
                              ? booking.service_name || booking.vehicle_name
                              : booking.vehicle_name}
                          </div>

                          {/* Customer */}
                          <div className="text-gray-300 text-sm lg:text-base mb-2">
                            👤 {booking.customer_name}
                          </div>

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-2 lg:gap-3 items-center text-xs lg:text-sm">
                            {/* Status Badge */}
                            <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>

                            {/* Price */}
                            <span className="text-gray-400">
                              💰 €{(booking.price_total / 100).toFixed(2)}
                            </span>

                            {/* Duration for rentals */}
                            {booking.service_type !== 'car_wash' && booking.dropoff_date && (
                              <span className="text-gray-400">
                                → {new Date(booking.dropoff_date).toLocaleString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-500 text-xl flex-shrink-0">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MONTH VIEW - Desktop Only */}
      {viewMode === 'month' && (
        <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 lg:gap-3 mb-4">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, idx) => (
              <div
                key={idx}
                className="text-center text-xs lg:text-sm font-semibold text-gray-400 py-2 lg:py-3"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2 lg:gap-3">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-[100px] lg:min-h-[140px]" />
              }

              const dayBookings = getBookingsForDate(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day)
                    if (isMobile) {
                      setViewMode('day')
                    }
                  }}
                  className={`
                    min-h-[100px] lg:min-h-[140px] border-2 rounded-xl p-2 lg:p-3
                    transition-all duration-200 cursor-pointer
                    ${isToday
                      ? 'border-dr7-gold bg-dr7-gold/10 shadow-lg shadow-dr7-gold/20'
                      : 'border-gray-700 hover:border-gray-600'
                    }
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${dayBookings.length > 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'}
                    hover:bg-gray-800/50 hover:scale-[1.02]
                  `}
                >
                  {/* Day number */}
                  <div className={`
                    text-sm lg:text-base font-bold mb-2 lg:mb-3
                    ${isToday ? 'text-dr7-gold' : 'text-white'}
                  `}>
                    {day.getDate()}
                  </div>

                  {/* Booking indicators */}
                  <div className="space-y-1 lg:space-y-1.5">
                    {dayBookings.slice(0, 2).map(booking => (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBooking(booking)
                        }}
                        className={`
                          text-[10px] lg:text-xs px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md border
                          cursor-pointer transition-all duration-150
                          ${getStatusColor(booking.status)}
                          hover:scale-105 hover:shadow-md
                          flex items-center gap-1
                        `}
                        title={`${booking.vehicle_name} - ${booking.customer_name}`}
                      >
                        <span className="text-sm lg:text-base flex-shrink-0">
                          {booking.service_type === 'car_wash' ? '🚿' : '🚗'}
                        </span>
                        <span className="truncate font-medium flex-1">
                          {booking.service_type === 'car_wash'
                            ? booking.appointment_time || booking.vehicle_name
                            : booking.vehicle_name
                          }
                        </span>
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentDate(day)
                          setViewMode('day')
                        }}
                        className="text-[10px] lg:text-xs text-dr7-gold hover:text-yellow-400 cursor-pointer font-bold py-1 text-center transition-colors"
                      >
                        +{dayBookings.length - 2} altro
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
        <h4 className="text-sm font-semibold text-white mb-3 lg:mb-4">Legenda</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl lg:text-2xl">🚿</span>
            <span className="text-xs lg:text-sm text-gray-300">Autolavaggio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl lg:text-2xl">🚗</span>
            <span className="text-xs lg:text-sm text-gray-300">Noleggio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-xs lg:text-sm text-gray-300">Confermato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
            <span className="text-xs lg:text-sm text-gray-300">In attesa</span>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-4 lg:p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                  {selectedBooking.service_type === 'car_wash' ? '🚿 Autolavaggio' : '🚗 Noleggio'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-400">ID: DR7-{selectedBooking.id.toUpperCase().slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl lg:text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              {/* Status */}
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-400">Stato</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.toUpperCase()}
                  </span>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium ${
                    selectedBooking.payment_status === 'succeeded' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    Pagamento: {selectedBooking.payment_status}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 lg:p-5">
                <h4 className="text-base lg:text-lg font-semibold text-white mb-3">👤 Cliente</h4>
                <div className="space-y-2 text-sm lg:text-base">
                  <div>
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-white ml-2">{selectedBooking.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2 break-all">{selectedBooking.customer_email}</span>
                  </div>
                  {selectedBooking.customer_phone && (
                    <div>
                      <span className="text-gray-400">Telefono:</span>
                      <span className="text-white ml-2">{selectedBooking.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle/Service Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 lg:p-5">
                <h4 className="text-base lg:text-lg font-semibold text-white mb-3">
                  {selectedBooking.service_type === 'car_wash' ? '🚿 Servizio' : '🚗 Veicolo'}
                </h4>
                <div className="space-y-2 text-sm lg:text-base">
                  <div>
                    <span className="text-gray-400">
                      {selectedBooking.service_type === 'car_wash' ? 'Servizio:' : 'Veicolo:'}
                    </span>
                    <span className="text-white ml-2">
                      {selectedBooking.service_type === 'car_wash'
                        ? selectedBooking.service_name || selectedBooking.vehicle_name
                        : selectedBooking.vehicle_name
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Date/Time Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 lg:p-5">
                <h4 className="text-base lg:text-lg font-semibold text-white mb-3">📅 Date</h4>
                <div className="space-y-2 text-sm lg:text-base">
                  {selectedBooking.service_type === 'car_wash' ? (
                    <>
                      <div>
                        <span className="text-gray-400">Data:</span>
                        <span className="text-white ml-2">
                          {selectedBooking.appointment_date
                            ? new Date(selectedBooking.appointment_date).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                timeZone: 'Europe/Rome'
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Ora:</span>
                        <span className="text-white ml-2">{selectedBooking.appointment_time || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-400">Ritiro:</span>
                        <span className="text-white ml-2">
                          {selectedBooking.pickup_date
                            ? new Date(selectedBooking.pickup_date).toLocaleString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Europe/Rome',
                                hour12: false
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Riconsegna:</span>
                        <span className="text-white ml-2">
                          {selectedBooking.dropoff_date
                            ? new Date(selectedBooking.dropoff_date).toLocaleString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Europe/Rome',
                                hour12: false
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Price Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 lg:p-5">
                <h4 className="text-base lg:text-lg font-semibold text-white mb-3">💰 Prezzo</h4>
                <div className="space-y-2 text-sm lg:text-base">
                  <div>
                    <span className="text-gray-400">Totale:</span>
                    <span className="text-white ml-2 text-lg lg:text-xl font-bold">
                      {(selectedBooking.price_total / 100).toFixed(2)} {selectedBooking.currency || 'EUR'}
                    </span>
                  </div>
                  {selectedBooking.booking_source && (
                    <div>
                      <span className="text-gray-400">Fonte:</span>
                      <span className="text-white ml-2 capitalize">{selectedBooking.booking_source}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
