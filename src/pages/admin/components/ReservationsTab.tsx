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
  appointment_time?: string
}

// Helper function to calculate car wash end time based on actual service durations
function calculateCarWashEndTime(appointmentDate: string, appointmentTime: string, priceTotal: number): string {
  // Map prices to actual durations (in hours) from the main website
  const priceToDuration: Record<number, number> = {
    2500: 0.75,  // 25€ = 30-45 min (use 45 min = 0.75hr)
    4900: 1.25,  // 49€ = 1-1.5 hrs (use 1.5hr)
    7500: 2.5,   // 75€ = 2-3 hrs (use 2.5hr)
    9900: 3.5    // 99€ = 3-4 hrs (use 3.5hr)
  };

  const durationHours = priceToDuration[priceTotal] || 1;

  // Parse the time
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  const endDate = new Date(appointmentDate);

  // Add the duration
  const totalMinutes = (durationHours * 60);
  endDate.setHours(hours);
  endDate.setMinutes(minutes + totalMinutes);

  return endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
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
    pickup_location: 'office',
    dropoff_location: 'office',
    status: 'pending',
    source: 'admin',
    total_amount: '0',
    currency: 'EUR'
  })

  const [carWashData, setCarWashData] = useState({
    service_name: '',
    appointment_date: '',
    appointment_time: '',
    additional_service: '',
    additional_service_hours: '1',
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

  const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ]

  const LOCATIONS = [
    { value: 'office', label: 'Sede DR7 (Ufficio)' },
    { value: 'airport', label: 'Aeroporto' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'home', label: 'Domicilio' },
    { value: 'other', label: 'Altro' }
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

      // Fetch customers from bookings table (same as CustomersTab)
      const { data: bookingsForCustomers, error: bookingsCustomerError } = await supabase
        .from('bookings')
        .select('customer_name, customer_email, customer_phone, user_id, booked_at, booking_details')
        .order('booked_at', { ascending: false })

      if (bookingsCustomerError) {
        console.error('Failed to load customers from bookings:', bookingsCustomerError)
      }

      // Merge customers by email or phone (same logic as CustomersTab)
      const customerMap = new Map<string, Customer>()

      if (bookingsForCustomers) {
        bookingsForCustomers.forEach((booking: any) => {
          const details = booking.booking_details?.customer || {}
          const customerName = booking.customer_name || details.fullName || 'Cliente'
          const customerEmail = booking.customer_email || details.email || null
          const customerPhone = booking.customer_phone || details.phone || null

          const key = customerEmail || customerPhone || booking.user_id

          if (key) {
            const existing = customerMap.get(key)
            if (existing) {
              if (!existing.phone && customerPhone) existing.phone = customerPhone
              if (!existing.email && customerEmail) existing.email = customerEmail
              if (existing.full_name === 'Cliente' && customerName) existing.full_name = customerName
            } else {
              customerMap.set(key, {
                id: booking.user_id || key,
                full_name: customerName,
                email: customerEmail,
                phone: customerPhone,
                driver_license_number: null,
                notes: null,
                created_at: booking.booked_at,
                updated_at: booking.booked_at
              })
            }
          }
        })
      }

      // Also check customers table if it exists
      const { data: customersTableData, error: customersTableError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (!customersTableError && customersTableData) {
        customersTableData.forEach(c => {
          const key = c.email || c.phone || c.id
          if (key && !customerMap.has(key)) {
            customerMap.set(key, c)
          }
        })
      }

      const customersArray = Array.from(customerMap.values())
      console.log('CUSTOMERS LOADED:', customersArray.length, customersArray)
      setCustomers(customersArray)

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('display_name')

      if (vehiclesError) {
        console.error('Failed to load vehicles:', vehiclesError)
      } else {
        console.log('VEHICLES LOADED:', vehiclesData?.length || 0, vehiclesData)
        setVehicles(vehiclesData || [])
      }

      // Fetch reservations from API (if available)
      try {
        const resData = await fetch(`${API_BASE}/reservations`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }).then(async r => {
          if (!r.ok) {
            console.error('Reservations API error:', r.status, await r.text())
            return { data: [] }
          }
          return r.json()
        })

        setReservations(resData.data || [])

        console.log('Loaded data:', {
          reservations: resData.data?.length || 0,
          customers: customersArray.length,
          vehicles: vehiclesData?.length || 0
        })
      } catch (apiError) {
        console.error('API fetch error:', apiError)
        setReservations([])
      }
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
          user_id: customerId,
          service_type: 'car_wash',
          service_name: carWashData.service_name,
          appointment_date: new Date(carWashData.appointment_date).toISOString(),
          appointment_time: carWashData.appointment_time,
          price_total: Math.round(parseFloat(formData.total_amount) * 100), // Convert to cents
          currency: formData.currency.toLowerCase(),
          status: formData.status,
          payment_status: formData.status === 'confirmed' ? 'completed' : 'pending',
          payment_method: 'agency',
          customer_name: customerInfo?.full_name || '',
          customer_email: customerInfo?.email || '',
          customer_phone: customerInfo?.phone || '',
          vehicle_name: null, // Required field, null for car wash
          vehicle_image_url: null,
          pickup_date: null,
          dropoff_date: null,
          pickup_location: null,
          dropoff_location: null,
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

        console.log('Attempting to create car wash booking with data:', carWashBookingData)

        const { error: carWashError, data: insertedData } = await supabase
          .from('bookings')
          .insert([carWashBookingData])
          .select()

        if (carWashError) {
          console.error('Failed to create car wash booking:', carWashError)
          console.error('Error details:', JSON.stringify(carWashError, null, 2))
          alert(`Failed to create car wash booking: ${carWashError.message || JSON.stringify(carWashError)}`)
          throw new Error('Failed to create car wash booking')
        }

        console.log('Car wash booking created successfully:', insertedData)
      } else {
        // Create vehicle rental booking in bookings table (for website availability blocking)
        const vehicle = vehicles.find(v => v.id === formData.vehicle_id)

        // Get location labels
        const pickupLocationLabel = LOCATIONS.find(l => l.value === formData.pickup_location)?.label || formData.pickup_location
        const dropoffLocationLabel = LOCATIONS.find(l => l.value === formData.dropoff_location)?.label || formData.dropoff_location

        const bookingData = {
          user_id: customerId,
          vehicle_name: vehicle?.display_name || '',
          vehicle_image_url: null,
          pickup_date: new Date(formData.start_at).toISOString(),
          dropoff_date: new Date(formData.end_at).toISOString(),
          pickup_location: pickupLocationLabel,
          dropoff_location: dropoffLocationLabel,
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
            pickupLocation: formData.pickup_location,
            dropoffLocation: formData.dropoff_location,
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
      pickup_location: 'office',
      dropoff_location: 'office',
      status: 'pending',
      source: 'admin',
      total_amount: '0',
      currency: 'EUR'
    })
    setCarWashData({
      service_name: '',
      appointment_date: '',
      appointment_time: '',
      additional_service: '',
      additional_service_hours: '1',
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
    <div className="space-y-4">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-dr7-gold">Prenotazioni</h2>
        <div className="flex gap-2 sm:gap-3">
          <Button onClick={handleExport} variant="secondary" className="flex-1 sm:flex-none text-sm sm:text-base">
            <span className="hidden sm:inline">Esporta CSV</span>
            <span className="sm:hidden">📥 CSV</span>
          </Button>
          <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }} className="flex-1 sm:flex-none text-sm sm:text-base">
            <span className="hidden sm:inline">+ Nuova Prenotazione</span>
            <span className="sm:hidden">+ Nuovo</span>
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dr7-dark p-4 sm:p-6 rounded-lg mb-6 border border-gray-800">
          <h3 className="text-lg sm:text-xl font-semibold text-dr7-gold mb-4">
            {editingId ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}
          </h3>

          {/* Booking Type Selection - Mobile Optimized */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-dr7-darker rounded-lg border border-gray-700">
            <label className="block text-white font-semibold mb-3 text-sm sm:text-base">Tipo Prenotazione:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBookingType('rental')}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${bookingType === 'rental' ? 'bg-white text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                🚗 Noleggio
              </button>
              <button
                type="button"
                onClick={() => setBookingType('carwash')}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${bookingType === 'carwash' ? 'bg-white text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                🚿 Lavaggio
              </button>
            </div>
          </div>

          {/* Customer Selection - Mobile Optimized */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-dr7-darker rounded-lg border border-gray-700">
            <label className="block text-white font-semibold mb-3 text-sm sm:text-base">Cliente:</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setNewCustomerMode(false)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${!newCustomerMode ? 'bg-white text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                Esistente
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerMode(true)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${newCustomerMode ? 'bg-white text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                Nuovo
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
              <div>
                <Select
                  label="Seleziona Cliente"
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  options={[
                    { value: '', label: 'Seleziona cliente...' },
                    ...customers
                      .sort((a, b) => a.full_name.localeCompare(b.full_name))
                      .map(c => ({ value: c.id, label: `${c.full_name} (${c.email || c.phone || 'No contact'})` }))
                  ]}
                />
                {customers.length === 0 && (
                  <p className="text-sm text-yellow-400 mt-2">
                    ⚠️ Nessun cliente trovato. Verifica che l'API sia attiva o crea un nuovo cliente.
                  </p>
                )}
              </div>
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
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-dr7-darker rounded-lg border border-gray-700">
                <div>
                  <Input
                    label="📅 Data/Ora Ritiro"
                    type="datetime-local"
                    required
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    step="3600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Orari interi (es: 10:00, 11:00)</p>
                </div>
                <Select
                  label="📍 Luogo Ritiro"
                  required
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  options={LOCATIONS}
                />
                <div>
                  <Input
                    label="📅 Data/Ora Riconsegna"
                    type="datetime-local"
                    required
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                    step="3600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Orari interi (es: 10:00, 11:00)</p>
                </div>
                <Select
                  label="📍 Luogo Riconsegna"
                  required
                  value={formData.dropoff_location}
                  onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                  options={LOCATIONS}
                />
              </div>
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
                label="📅 Data Appuntamento"
                type="date"
                required
                value={carWashData.appointment_date}
                onChange={(e) => setCarWashData({ ...carWashData, appointment_date: e.target.value })}
              />
              <Select
                label="🕐 Ora Appuntamento"
                required
                value={carWashData.appointment_time}
                onChange={(e) => setCarWashData({ ...carWashData, appointment_time: e.target.value })}
                options={[
                  { value: '', label: 'Seleziona orario...' },
                  ...TIME_SLOTS.map(slot => ({ value: slot, label: slot }))
                ]}
              />
              <Select
                label="Servizio Aggiuntivo"
                value={carWashData.additional_service}
                onChange={(e) => {
                  setCarWashData({ ...carWashData, additional_service: e.target.value })
                  // Reset hours when changing service
                  if (!e.target.value) {
                    setCarWashData(prev => ({ ...prev, additional_service_hours: '1' }))
                  }
                }}
                options={[
                  { value: '', label: 'Nessuno' },
                  { value: 'courtesy-car', label: 'Utilitaria di Cortesia (€15/h - €25/2h - €35/3h)' },
                  { value: 'supercar', label: 'Supercar Experience (€59/h - €99/2h - €139/3h)' },
                  { value: 'lambo-ferrari', label: 'Lamborghini & Ferrari Experience (€149/h - €249/2h - €299/3h)' }
                ]}
              />
              {carWashData.additional_service && (
                <Select
                  label="Durata Servizio Aggiuntivo"
                  value={carWashData.additional_service_hours}
                  onChange={(e) => {
                    setCarWashData({ ...carWashData, additional_service_hours: e.target.value })
                    // Update total based on service and hours
                    const servicePrices: Record<string, number[]> = {
                      'courtesy-car': [15, 25, 35],
                      'supercar': [59, 99, 139],
                      'lambo-ferrari': [149, 249, 299]
                    }
                    const hourIndex = parseInt(e.target.value) - 1
                    const additionalPrice = servicePrices[carWashData.additional_service]?.[hourIndex] || 0
                    const basePrice = parseFloat(formData.total_amount) || 0
                    setFormData({ ...formData, total_amount: (basePrice + additionalPrice).toString() })
                  }}
                  options={[
                    { value: '1', label: '1 ora' },
                    { value: '2', label: '2 ore' },
                    { value: '3', label: '3 ore' }
                  ]}
                />
              )}
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {bookings.length === 0 && reservations.length === 0 && (
          <div className="bg-dr7-dark rounded-lg border border-gray-800 p-8 text-center text-gray-500">
            Nessuna prenotazione trovata
          </div>
        )}

        {/* Display bookings as cards on mobile */}
        {bookings.map((booking) => {
          const isCarWash = booking.service_type === 'car_wash'
          return (
            <div key={`booking-card-${booking.id}`} className="bg-dr7-dark rounded-lg border border-gray-800 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">
                    {booking.booking_details?.customer?.fullName || booking.customer_name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">{booking.customer_email || '-'}</div>
                  <div className="text-sm text-gray-400">{booking.customer_phone || '-'}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  booking.status === 'confirmed' ? 'bg-green-900 text-green-300' :
                  booking.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                  booking.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {booking.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2 text-white">
                {isCarWash ? (
                  <>
                    <span className="text-blue-400">🚿</span>
                    <span className="text-sm">{booking.service_name || 'Autolavaggio'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-green-400">🚗</span>
                    <span className="text-sm">{booking.vehicle_name}</span>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-400 mb-2">
                {isCarWash
                  ? `📅 ${booking.appointment_date ? new Date(booking.appointment_date).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-'}`
                  : `📅 ${booking.pickup_date ? new Date(typeof booking.pickup_date === 'number' ? booking.pickup_date * 1000 : booking.pickup_date).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-'} → ${booking.dropoff_date ? new Date(typeof booking.dropoff_date === 'number' ? booking.dropoff_date * 1000 : booking.dropoff_date).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-'}`
                }
              </div>

              <div className="text-right text-lg font-bold text-white">
                €{(booking.price_total / 100).toFixed(2)}
              </div>
            </div>
          )
        })}

        {/* Display reservations as cards */}
        {reservations.map((res) => (
          <div key={`reservation-card-${res.id}`} className="bg-dr7-dark rounded-lg border border-gray-800 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="font-semibold text-white mb-1">{res.customers?.full_name || 'N/A'}</div>
                <div className="text-sm text-gray-400">{res.customers?.email || '-'}</div>
                <div className="text-sm text-gray-400">{res.customers?.phone || '-'}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                res.status === 'active' ? 'bg-green-900 text-green-300' :
                res.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                res.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {res.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2 text-white">
              <span className="text-green-400">🚗</span>
              <span className="text-sm">{res.vehicles?.display_name || 'N/A'}</span>
            </div>

            <div className="text-xs text-gray-400 mb-2">
              📅 {new Date(res.start_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })} → {new Date(res.end_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
            </div>

            <div className="text-right text-lg font-bold text-white">
              {res.currency} {res.total_amount}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-dr7-dark rounded-lg border border-gray-800 overflow-hidden">
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
                        ? (booking.appointment_date && booking.appointment_time
                            ? `${new Date(booking.appointment_date).toLocaleDateString('it-IT')} ${calculateCarWashEndTime(booking.appointment_date, booking.appointment_time, booking.price_total)}`
                            : '-')
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
