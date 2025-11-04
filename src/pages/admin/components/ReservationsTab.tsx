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
  // Car wash specific fields
  service_type?: string
  service_name?: string
  appointment_date?: string
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

  const [bookingType, setBookingType] = useState<'rental' | 'carwash'>('rental')
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    start_at: '',
    end_at: '',
    status: 'pending',
    source: 'admin',
    total_amount: '0',
    currency: 'EUR'
  })

  const [carWashData, setCarWashData] = useState({
    service_name: '',
    appointment_date: '',
    additional_service: '',
    notes: ''
  })

  const [newCustomerMode, setNewCustomerMode] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    full_name: '',
    email: '',
    phone: '',
    driver_license_number: ''
  })

  const CAR_WASH_SERVICES = [
    { id: 'full-clean', name: 'LAVAGGIO COMPLETO', price: 25 },
    { id: 'top-shine', name: 'LAVAGGIO TOP', price: 49 },
    { id: 'vip', name: 'LAVAGGIO VIP', price: 75 },
    { id: 'dr7-luxury', name: 'LAVAGGIO DR7 LUXURY', price: 99 }
  ]

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
      let customerId = formData.customer_id

      // If creating new customer, create them first
      if (newCustomerMode) {
        const customerRes = await fetch(`${API_BASE}/customers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newCustomerData)
        })

        if (!customerRes.ok) throw new Error('Failed to create customer')
        const customerResult = await customerRes.json()
        customerId = customerResult.data.id
      }

      const customerInfo = newCustomerMode ? newCustomerData : customers.find(c => c.id === customerId)

      if (bookingType === 'carwash') {
        // Create car wash booking
        const carWashBookingData = {
          service_type: 'car_wash',
          service_name: carWashData.service_name,
          appointment_date: new Date(carWashData.appointment_date).toISOString(),
          price_total: Math.round(parseFloat(formData.total_amount) * 100), // Convert to cents
          currency: formData.currency.toLowerCase(),
          status: formData.status,
          payment_status: formData.status === 'confirmed' ? 'completed' : 'pending',
          payment_method: 'agency',
          customer_name: customerInfo?.full_name || '',
          customer_email: customerInfo?.email || '',
          customer_phone: customerInfo?.phone || '',
          booking_details: {
            customer: {
              fullName: customerInfo?.full_name || '',
              email: customerInfo?.email || '',
              phone: customerInfo?.phone || ''
            },
            additionalService: carWashData.additional_service || null,
            notes: carWashData.notes || null,
            source: 'admin_manual'
          }
        }

        const { error: carWashError } = await supabase
          .from('bookings')
          .insert([carWashBookingData])

        if (carWashError) {
          console.error('Failed to create car wash booking:', carWashError)
          throw new Error('Failed to create car wash booking')
        }
      } else {
        // Create vehicle rental booking in bookings table (for website availability blocking)
        const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
        const bookingData = {
          vehicle_name: vehicle?.display_name || '',
          vehicle_image_url: null,
          pickup_date: new Date(formData.start_at).toISOString(),
          dropoff_date: new Date(formData.end_at).toISOString(),
          pickup_location: 'Sede DR7',
          dropoff_location: 'Sede DR7',
          price_total: Math.round(parseFloat(formData.total_amount) * 100), // Convert to cents
          currency: formData.currency.toLowerCase(),
          status: formData.status,
          payment_status: formData.status === 'confirmed' ? 'completed' : 'pending',
          payment_method: 'agency',
          customer_name: customerInfo?.full_name || '',
          customer_email: customerInfo?.email || '',
          customer_phone: customerInfo?.phone || '',
          booking_details: {
            customer: {
              fullName: customerInfo?.full_name || '',
              email: customerInfo?.email || '',
              phone: customerInfo?.phone || ''
            },
            source: 'admin_manual'
          }
        }

        const { error: bookingError } = await supabase
          .from('bookings')
          .insert([bookingData])

        if (bookingError) {
          console.error('Failed to create booking:', bookingError)
          throw new Error('Failed to create booking entry')
        }

        // Also create in reservations table (for internal tracking)
        const method = editingId ? 'PATCH' : 'POST'
        const body = editingId
          ? { id: editingId, ...formData, customer_id: customerId, total_amount: parseFloat(formData.total_amount) }
          : { ...formData, customer_id: customerId, total_amount: parseFloat(formData.total_amount) }

        const res = await fetch(`${API_BASE}/reservations`, {
          method,
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        if (!res.ok) throw new Error('Failed to save reservation')
      }

      setShowForm(false)
      setEditingId(null)
      setNewCustomerMode(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save reservation:', error)
      alert('Failed to save reservation: ' + (error as Error).message)
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
      currency: 'EUR'
    })
    setCarWashData({
      service_name: '',
      appointment_date: '',
      additional_service: '',
      notes: ''
    })
    setNewCustomerData({
      full_name: '',
      email: '',
      phone: '',
      driver_license_number: ''
    })
    setBookingType('rental')
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
            {editingId ? 'Edit Reservation' : 'Nuova Prenotazione'}
          </h3>

          {/* Booking Type Selection */}
          <div className="mb-6 p-4 bg-dr7-darker rounded-lg border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-white font-semibold">Tipo Prenotazione:</label>
              <button
                type="button"
                onClick={() => setBookingType('rental')}
                className={`px-4 py-2 rounded ${bookingType === 'rental' ? 'bg-dr7-gold text-black' : 'bg-gray-700 text-white'}`}
              >
                Noleggio Auto
              </button>
              <button
                type="button"
                onClick={() => setBookingType('carwash')}
                className={`px-4 py-2 rounded ${bookingType === 'carwash' ? 'bg-dr7-gold text-black' : 'bg-gray-700 text-white'}`}
              >
                Autolavaggio
              </button>
            </div>
          </div>

          {/* Customer Selection or New Customer */}
          <div className="mb-6 p-4 bg-dr7-darker rounded-lg border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-white font-semibold">Cliente:</label>
              <button
                type="button"
                onClick={() => setNewCustomerMode(false)}
                className={`px-4 py-2 rounded ${!newCustomerMode ? 'bg-dr7-gold text-black' : 'bg-gray-700 text-white'}`}
              >
                Seleziona Esistente
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerMode(true)}
                className={`px-4 py-2 rounded ${newCustomerMode ? 'bg-dr7-gold text-black' : 'bg-gray-700 text-white'}`}
              >
                Nuovo Cliente
              </button>
            </div>

            {newCustomerMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Completo"
                  required
                  value={newCustomerData.full_name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, full_name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                />
                <Input
                  label="Telefono"
                  required
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                />
                <Input
                  label="Patente"
                  value={newCustomerData.driver_license_number}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, driver_license_number: e.target.value })}
                />
              </div>
            ) : (
              <Select
                label="Seleziona Cliente"
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleziona cliente...' },
                  ...customers.map(c => ({ value: c.id, label: c.full_name }))
                ]}
              />
            )}
          </div>

          {/* Service Details - Different for rental vs car wash */}
          {bookingType === 'rental' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Veicolo"
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleziona veicolo...' },
                  ...vehicles.map(v => ({ value: v.id, label: v.display_name }))
                ]}
              />
              <Input
                label="Data/Ora Inizio"
                type="datetime-local"
                required
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
              />
              <Input
                label="Data/Ora Fine"
                type="datetime-local"
                required
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
              />
              <Select
                label="Stato"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'pending', label: 'In Attesa' },
                  { value: 'confirmed', label: 'Confermata' },
                  { value: 'active', label: 'Attiva' },
                  { value: 'completed', label: 'Completata' },
                  { value: 'cancelled', label: 'Cancellata' }
                ]}
              />
              <Input
                label="Importo Totale (€)"
                type="number"
                step="0.01"
                required
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              />
              <Input
                label="Valuta"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Servizio Autolavaggio"
                required
                value={carWashData.service_name}
                onChange={(e) => {
                  const selectedService = CAR_WASH_SERVICES.find(s => s.name === e.target.value)
                  setCarWashData({ ...carWashData, service_name: e.target.value })
                  if (selectedService) {
                    setFormData({ ...formData, total_amount: selectedService.price.toString() })
                  }
                }}
                options={[
                  { value: '', label: 'Seleziona servizio...' },
                  ...CAR_WASH_SERVICES.map(s => ({ value: s.name, label: `${s.name} - €${s.price}` }))
                ]}
              />
              <Input
                label="Data/Ora Appuntamento"
                type="datetime-local"
                required
                value={carWashData.appointment_date}
                onChange={(e) => setCarWashData({ ...carWashData, appointment_date: e.target.value })}
              />
              <Input
                label="Servizio Aggiuntivo"
                value={carWashData.additional_service}
                onChange={(e) => setCarWashData({ ...carWashData, additional_service: e.target.value })}
                placeholder="Es: Auto di cortesia, Supercar experience..."
              />
              <Select
                label="Stato"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'pending', label: 'In Attesa' },
                  { value: 'confirmed', label: 'Confermata' },
                  { value: 'completed', label: 'Completata' },
                  { value: 'cancelled', label: 'Cancellata' }
                ]}
              />
              <Input
                label="Importo Totale (€)"
                type="number"
                step="0.01"
                required
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">Note</label>
                <textarea
                  value={carWashData.notes}
                  onChange={(e) => setCarWashData({ ...carWashData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:border-dr7-gold transition-colors"
                  rows={3}
                  placeholder="Note aggiuntive sulla prenotazione..."
                />
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button type="submit">Salva</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); setNewCustomerMode(false); resetForm() }}>
              Annulla
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Servizio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Data Inizio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Data Fine</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Stato</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Totale</th>
              </tr>
            </thead>
            <tbody>
              {/* Display bookings from bookings table */}
              {bookings.map((booking) => {
                const isCarWash = booking.service_type === 'car_wash'
                return (
                  <tr key={`booking-${booking.id}`} className="border-t border-gray-800 hover:bg-dr7-darker/50">
                    <td className="px-4 py-3 text-sm text-white">
                      {booking.booking_details?.customer?.fullName || booking.customer_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{booking.customer_email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white">{booking.customer_phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white">
                      {isCarWash ? (
                        <span className="flex items-center gap-2">
                          <span className="text-blue-400">🚿</span>
                          {booking.service_name || 'Autolavaggio'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="text-green-400">🚗</span>
                          {booking.vehicle_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {isCarWash
                        ? (booking.appointment_date ? new Date(booking.appointment_date).toLocaleString('it-IT') : '-')
                        : (booking.pickup_date ? new Date(typeof booking.pickup_date === 'number' ? booking.pickup_date * 1000 : booking.pickup_date).toLocaleString('it-IT') : '-')
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {isCarWash
                        ? '-'
                        : (booking.dropoff_date ? new Date(typeof booking.dropoff_date === 'number' ? booking.dropoff_date * 1000 : booking.dropoff_date).toLocaleString('it-IT') : '-')
                      }
                    </td>
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
                    <td className="px-4 py-3 text-sm text-white">€{(booking.price_total / 100).toFixed(2)}</td>
                  </tr>
                )
              })}

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
