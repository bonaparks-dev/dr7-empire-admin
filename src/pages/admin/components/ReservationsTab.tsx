import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Input from './Input'
import Select from './Select'
import Button from './Button'

interface Customer {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  driver_license_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface Vehicle {
  id: string
  display_name: string
  plate: string | null
  status: 'available' | 'rented' | 'maintenance' | 'retired'
  daily_rate: number
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

interface Reservation {
  id: string
  customer_id: string
  vehicle_id: string
  start_at: string
  end_at: string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  source: string | null
  total_amount: number
  currency: string
  addons: Record<string, any> | null
  created_by: string | null
  created_at: string
  updated_at: string
  customers?: Customer
  vehicles?: Vehicle
}

interface Booking {
  id: string
  user_id: string | null
  vehicle_name: string
  vehicle_image_url: string | null
  pickup_date: string
  dropoff_date: string
  pickup_location: string
  dropoff_location: string
  price_total: number
  currency: string
  status: string
  payment_status: string
  payment_method: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  booking_details: Record<string, any> | null
  booked_at: string
  created_at: string
  updated_at: string
}

const API_BASE = '/.netlify/functions/admin'
const API_TOKEN = import.meta.env.VITE_ADMIN_UI_TOKEN

export default function ReservationsTab() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    start_at: '',
    end_at: '',
    status: 'pending',
    source: 'admin',
    total_amount: '0',
    currency: 'USD'
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Fetch bookings directly from Supabase
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (bookingsError) {
        console.error('Failed to load bookings:', bookingsError)
      } else {
        setBookings(bookingsData || [])
      }

      // Fetch reservations, customers, and vehicles from API
      const [resData, custData, vehData] = await Promise.all([
        fetch(`${API_BASE}/reservations`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }).then(r => r.json()),
        fetch(`${API_BASE}/customers`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }).then(r => r.json()),
        fetch(`${API_BASE}/vehicles`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }).then(r => r.json())
      ])

      setReservations(resData.data || [])
      setCustomers(custData.data || [])
      setVehicles(vehData.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId
        ? { id: editingId, ...formData, total_amount: parseFloat(formData.total_amount) }
        : { ...formData, total_amount: parseFloat(formData.total_amount) }

      const res = await fetch(`${API_BASE}/reservations`, {
        method,
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save reservation')

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save reservation:', error)
      alert('Failed to save reservation')
    }
  }

  function resetForm() {
    setFormData({
      customer_id: '',
      vehicle_id: '',
      start_at: '',
      end_at: '',
      status: 'pending',
      source: 'admin',
      total_amount: '0',
      currency: 'USD'
    })
  }

  async function handleExport() {
    try {
      const res = await fetch(`${API_BASE}/export/reservations.csv`, {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export reservations')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-dr7-gold">Prenotazioni</h2>
        <div className="flex gap-3">
          <Button onClick={handleExport} variant="secondary">
            Esporta CSV
          </Button>
          <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}>
            + Nuova Prenotazione
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dr7-dark p-6 rounded-lg mb-6 border border-gray-800">
          <h3 className="text-xl font-semibold text-dr7-gold mb-4">
            {editingId ? 'Edit Reservation' : 'New Reservation'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer"
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              options={[
                { value: '', label: 'Select customer...' },
                ...customers.map(c => ({ value: c.id, label: c.full_name }))
              ]}
            />
            <Select
              label="Vehicle"
              required
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              options={[
                { value: '', label: 'Select vehicle...' },
                ...vehicles.map(v => ({ value: v.id, label: v.display_name }))
              ]}
            />
            <Input
              label="Start Date/Time"
              type="datetime-local"
              required
              value={formData.start_at}
              onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
            />
            <Input
              label="End Date/Time"
              type="datetime-local"
              required
              value={formData.end_at}
              onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
            />
            <Select
              label="Status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
            <Input
              label="Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
            <Input
              label="Total Amount"
              type="number"
              step="0.01"
              required
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
            />
            <Input
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="bg-dr7-dark rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dr7-darker">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Telefono</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Veicolo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Inizio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Fine</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Stato</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Totale</th>
              </tr>
            </thead>
            <tbody>
              {/* Display bookings from bookings table */}
              {bookings.map((booking) => (
                <tr key={`booking-${booking.id}`} className="border-t border-gray-800 hover:bg-dr7-darker/50">
                  <td className="px-4 py-3 text-sm">
                    {booking.booking_details?.customer?.fullName || booking.customer_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">{booking.customer_email || '-'}</td>
                  <td className="px-4 py-3 text-sm">{booking.customer_phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">{booking.vehicle_name}</td>
                  <td className="px-4 py-3 text-sm">{new Date(booking.pickup_date).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-sm">{new Date(booking.dropoff_date).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-900 text-green-300' :
                      booking.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      booking.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">€{(booking.price_total / 100).toFixed(2)}</td>
                </tr>
              ))}

              {/* Display reservations from reservations table */}
              {reservations.map((res) => (
                <tr key={`reservation-${res.id}`} className="border-t border-gray-800 hover:bg-dr7-darker/50">
                  <td className="px-4 py-3 text-sm">{res.customers?.full_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{res.customers?.email || '-'}</td>
                  <td className="px-4 py-3 text-sm">{res.customers?.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">{res.vehicles?.display_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{new Date(res.start_at).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-sm">{new Date(res.end_at).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      res.status === 'active' ? 'bg-green-900 text-green-300' :
                      res.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                      res.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{res.currency} {res.total_amount}</td>
                </tr>
              ))}

              {bookings.length === 0 && reservations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Nessuna prenotazione trovata
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
