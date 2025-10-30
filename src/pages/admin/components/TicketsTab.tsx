import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Button from './Button'

interface BookingLineItem {
  id: string
  booking_id: string
  item_type: 'rental' | 'insurance' | 'extra' | 'service'
  description: string
  quantity: number
  unit_price: number
  total_price: number
  currency: string
  metadata: Record<string, any> | null
  created_at: string
}

interface BookingWithLineItems {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  vehicle_name: string
  status: string
  payment_status: string
  created_at: string
  line_items: BookingLineItem[]
}

export default function TicketsTab() {
  const [tickets, setTickets] = useState<BookingLineItem[]>([])
  const [bookingsWithTickets, setBookingsWithTickets] = useState<BookingWithLineItems[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'all' | 'grouped'>('all')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    setLoading(true)
    try {
      // Fetch all booking line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('booking_line_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (lineItemsError) throw lineItemsError

      setTickets(lineItems || [])

      // Fetch bookings with their line items grouped
      const bookingIds = [...new Set((lineItems || []).map(item => item.booking_id))]

      if (bookingIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, customer_name, customer_email, customer_phone, vehicle_name, status, payment_status, created_at')
          .in('id', bookingIds)

        if (bookingsError) throw bookingsError

        // Group line items by booking
        const bookingsWithItems: BookingWithLineItems[] = (bookings || []).map(booking => ({
          ...booking,
          line_items: (lineItems || []).filter(item => item.booking_id === booking.id)
        }))

        setBookingsWithTickets(bookingsWithItems)
      }
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(cents: number, currency: string = 'EUR'): string {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }

  function getItemTypeLabel(type: string): string {
    switch (type) {
      case 'rental': return 'Noleggio'
      case 'insurance': return 'Assicurazione'
      case 'extra': return 'Extra'
      case 'service': return 'Servizio'
      default: return type
    }
  }

  function getItemTypeColor(type: string): string {
    switch (type) {
      case 'rental': return 'bg-blue-900 text-blue-200'
      case 'insurance': return 'bg-green-900 text-green-200'
      case 'extra': return 'bg-purple-900 text-purple-200'
      case 'service': return 'bg-yellow-900 text-yellow-200'
      default: return 'bg-gray-700 text-gray-200'
    }
  }

  const filteredTickets = filterType === 'all'
    ? tickets
    : tickets.filter(t => t.item_type === filterType)

  const totalRevenue = filteredTickets.reduce((sum, ticket) => sum + ticket.total_price, 0)

  async function handleExport() {
    try {
      const csvData = [
        ['ID', 'Booking ID', 'Type', 'Description', 'Quantity', 'Unit Price', 'Total Price', 'Currency', 'Date'].join(','),
        ...filteredTickets.map(ticket => [
          ticket.id,
          ticket.booking_id,
          getItemTypeLabel(ticket.item_type),
          `"${ticket.description}"`,
          ticket.quantity,
          (ticket.unit_price / 100).toFixed(2),
          (ticket.total_price / 100).toFixed(2),
          ticket.currency,
          new Date(ticket.created_at).toLocaleString('it-IT')
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Impossibile esportare i biglietti')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Biglietti Venduti</h2>
        <div className="flex gap-3">
          <Button onClick={handleExport} variant="secondary">
            Esporta CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Totale Biglietti</div>
          <div className="text-2xl font-bold text-white">{filteredTickets.length}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Fatturato Totale</div>
          <div className="text-2xl font-bold text-white">{formatPrice(totalRevenue)}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Noleggi</div>
          <div className="text-2xl font-bold text-white">
            {tickets.filter(t => t.item_type === 'rental').length}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Servizi/Extra</div>
          <div className="text-2xl font-bold text-white">
            {tickets.filter(t => t.item_type === 'extra' || t.item_type === 'service').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('all')}
            variant={viewMode === 'all' ? 'primary' : 'secondary'}
            className="text-sm"
          >
            Vista Dettagliata
          </Button>
          <Button
            onClick={() => setViewMode('grouped')}
            variant={viewMode === 'grouped' ? 'primary' : 'secondary'}
            className="text-sm"
          >
            Raggruppati per Prenotazione
          </Button>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm"
        >
          <option value="all">Tutti i tipi</option>
          <option value="rental">Noleggi</option>
          <option value="insurance">Assicurazioni</option>
          <option value="extra">Extra</option>
          <option value="service">Servizi</option>
        </select>
      </div>

      {/* All Tickets View */}
      {viewMode === 'all' && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Descrizione</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Quantità</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Prezzo Unitario</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Totale</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getItemTypeColor(ticket.item_type)}`}>
                        {getItemTypeLabel(ticket.item_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{ticket.description}</td>
                    <td className="px-4 py-3 text-sm text-white">{ticket.quantity}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatPrice(ticket.unit_price, ticket.currency)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{formatPrice(ticket.total_price, ticket.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(ticket.created_at).toLocaleDateString('it-IT')}</td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nessun biglietto trovato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grouped by Booking View */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {bookingsWithTickets.map((booking) => {
            const bookingTotal = booking.line_items.reduce((sum, item) => sum + item.total_price, 0)
            return (
              <div key={booking.id} className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{booking.vehicle_name}</h3>
                    <div className="text-sm text-gray-400 mt-1">
                      Cliente: {booking.customer_name || booking.customer_email || 'N/A'}
                    </div>
                    {booking.customer_phone && (
                      <div className="text-sm text-gray-400">Tel: {booking.customer_phone}</div>
                    )}
                    <div className="text-sm text-gray-400">
                      Data: {new Date(booking.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Totale Prenotazione</div>
                    <div className="text-2xl font-bold text-white">{formatPrice(bookingTotal)}</div>
                    <span className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                      booking.payment_status === 'paid' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                    }`}>
                      {booking.payment_status}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400">
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Descrizione</th>
                        <th className="text-right py-2">Qtà</th>
                        <th className="text-right py-2">Prezzo</th>
                        <th className="text-right py-2">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.line_items.map((item) => (
                        <tr key={item.id} className="text-sm text-white">
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getItemTypeColor(item.item_type)}`}>
                              {getItemTypeLabel(item.item_type)}
                            </span>
                          </td>
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">{formatPrice(item.unit_price, item.currency)}</td>
                          <td className="text-right py-2 font-semibold">{formatPrice(item.total_price, item.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
          {bookingsWithTickets.length === 0 && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 text-center text-gray-500">
              Nessuna prenotazione con biglietti trovata
            </div>
          )}
        </div>
      )}
    </div>
  )
}
