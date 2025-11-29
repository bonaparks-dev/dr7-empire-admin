import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import { useAdminRole } from '../../../hooks/useAdminRole'
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
  vehicle_plate?: string | null
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
    7500: 3,     // 75€ VIP = 3 hours
    9900: 4      // 99€ DR7 LUXURY = 4 hours
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
  const { canViewFinancials } = useAdminRole()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Add custom scrollbar styles
  const scrollbarStyle = `
    .custom-scrollbar::-webkit-scrollbar {
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #1a1a1a;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #6a6a6a;
    }
  `

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    start_at: '',
    end_at: '',
    pickup_date: '',
    pickup_time: '',
    return_date: '',
    return_time: '',
    pickup_location: 'dr7_office',
    dropoff_location: 'dr7_office',
    status: 'confirmed',
    source: 'admin',
    total_amount: '0',
    amount_paid: '0',
    payment_status: 'paid',
    payment_method: 'Contanti',
    currency: 'EUR'
  })

  const [newCustomerMode, setNewCustomerMode] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [newCustomerData, setNewCustomerData] = useState({
    full_name: '',
    email: '',
    phone: '',
    driver_license_number: ''
  })

  // Auto-calculate return time (pickup time - 1h30 like main website)
  const calculateReturnTime = (pickupTime: string): string => {
    if (!pickupTime) return ''
    const [hours, minutes] = pickupTime.split(':').map(Number)
    const tempDate = new Date()
    tempDate.setHours(hours, minutes, 0)
    tempDate.setMinutes(tempDate.getMinutes() - 90) // Subtract 1h30
    const returnHours = String(tempDate.getHours()).padStart(2, '0')
    const returnMinutes = String(tempDate.getMinutes()).padStart(2, '0')
    return `${returnHours}:${returnMinutes}`
  }

  const LOCATIONS = [
    { value: 'dr7_office', label: 'Ufficio DR7 Cagliari' },
    { value: 'cagliari_airport', label: 'Aeroporto di Cagliari Elmas (+€50)' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Fetch bookings directly from Supabase (only car rentals, not car wash)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or('service_type.is.null,service_type.eq.car_rental')
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
        .neq('status', 'retired')
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

  async function handleCancelBooking(bookingId: string, bookingType: 'booking' | 'reservation') {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      return
    }

    try {
      // Get booking details before cancelling
      let customerName = ''
      let vehicleName = ''

      if (bookingType === 'booking') {
        const booking = bookings.find(b => b.id === bookingId)
        customerName = booking?.customer_name || ''
        vehicleName = booking?.vehicle_name || ''

        // Cancel booking in bookings table
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)

        if (error) {
          console.error('Failed to cancel booking:', error)
          throw new Error('Failed to cancel booking')
        }
      } else {
        const reservation = reservations.find(r => r.id === bookingId)
        customerName = reservation?.customers?.full_name || ''
        vehicleName = reservation?.vehicles?.display_name || ''

        // Cancel reservation via API
        const res = await fetch(`${API_BASE}/reservations`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: bookingId, status: 'cancelled' })
        })

        if (!res.ok) throw new Error('Failed to cancel reservation')
      }

      // Delete Google Calendar event
      try {
        await fetch('/.netlify/functions/delete-calendar-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            customerName,
            vehicleName
          })
        })
        console.log('✅ Calendar event deleted successfully')
      } catch (calendarError) {
        console.error('⚠️ Failed to delete calendar event:', calendarError)
        // Don't fail the whole cancellation if calendar delete fails
      }

      alert('Prenotazione cancellata con successo')
      loadData()
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      alert('Errore durante la cancellazione: ' + (error as Error).message)
    }
  }

  async function handleDeleteBooking(bookingId: string, bookingType: 'booking' | 'reservation') {
    if (!confirm('⚠️ ATTENZIONE: Vuoi eliminare definitivamente questa prenotazione dal database?\n\nQuesta azione NON può essere annullata!\n\nSe vuoi solo annullare la prenotazione, usa il pulsante "Cancella" invece.')) {
      return
    }

    try {
      // Get booking details before deleting
      let customerName = ''
      let vehicleName = ''

      if (bookingType === 'booking') {
        const booking = bookings.find(b => b.id === bookingId)
        customerName = booking?.customer_name || ''
        vehicleName = booking?.vehicle_name || ''

        // Delete booking from bookings table
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId)

        if (error) {
          console.error('Failed to delete booking:', error)
          throw new Error('Failed to delete booking')
        }
      } else {
        const reservation = reservations.find(r => r.id === bookingId)
        customerName = reservation?.customers?.full_name || ''
        vehicleName = reservation?.vehicles?.display_name || ''

        // Delete reservation via API
        const res = await fetch(`${API_BASE}/reservations`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: bookingId })
        })

        if (!res.ok) throw new Error('Failed to delete reservation')
      }

      // Delete Google Calendar event
      try {
        await fetch('/.netlify/functions/delete-calendar-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            customerName,
            vehicleName
          })
        })
        console.log('✅ Calendar event deleted successfully')
      } catch (calendarError) {
        console.error('⚠️ Failed to delete calendar event:', calendarError)
        // Don't fail the whole deletion if calendar delete fails
      }

      alert('✅ Prenotazione eliminata definitivamente')
      loadData()
    } catch (error) {
      console.error('Failed to delete booking:', error)
      alert('Errore durante l\'eliminazione: ' + (error as Error).message)
    }
  }

  function handleEditBooking(booking: Booking) {
    // Only handle car rental bookings - car wash bookings are in CarWashBookingsTab
    if (booking.service_type === 'car_wash') {
      alert('Le prenotazioni lavaggio devono essere modificate nella tab "Prenotazioni Lavaggio"')
      return
    }

    // Set customer data
    const customerId = booking.booking_details?.customer?.customerId || booking.user_id || ''

    // Populate rental data
    const pickupDate = booking.pickup_date ? new Date(typeof booking.pickup_date === 'number' ? booking.pickup_date * 1000 : booking.pickup_date) : null
    const dropoffDate = booking.dropoff_date ? new Date(typeof booking.dropoff_date === 'number' ? booking.dropoff_date * 1000 : booking.dropoff_date) : null

    // Find vehicle by name
    const vehicle = vehicles.find(v => v.display_name === booking.vehicle_name)

    // Extract location codes from booking_details
    const pickupLoc = booking.booking_details?.pickupLocation || 'dr7_office'
    const dropoffLoc = booking.booking_details?.dropoffLocation || 'dr7_office'

    setFormData({
      ...formData,
      customer_id: customerId,
      vehicle_id: vehicle?.id || '',
      pickup_date: pickupDate ? pickupDate.toISOString().split('T')[0] : '',
      pickup_time: pickupDate ? pickupDate.toTimeString().substring(0, 5) : '',
      return_date: dropoffDate ? dropoffDate.toISOString().split('T')[0] : '',
      return_time: dropoffDate ? dropoffDate.toTimeString().substring(0, 5) : '',
      pickup_location: pickupLoc,
      dropoff_location: dropoffLoc,
      status: booking.status,
      total_amount: (booking.price_total / 100).toString(),
      currency: booking.currency.toUpperCase(),
      source: 'admin'
    })

    setEditingId(booking.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Check for existing bookings on the same vehicle and dates (only for new bookings, not edits)
      if (!editingId) {
        const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
        const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}:00`)
        const returnDateTime = new Date(`${formData.return_date}T${formData.return_time}:00`)

        // Check for overlapping bookings
        const { data: existingBookings, error: checkError } = await supabase
          .from('bookings')
          .select('id, customer_name, vehicle_name, pickup_date, dropoff_date, status')
          .eq('vehicle_name', vehicle?.display_name)
          .neq('status', 'cancelled')
          .or(`and(pickup_date.lte.${returnDateTime.toISOString()},dropoff_date.gte.${pickupDateTime.toISOString()})`)

        if (checkError) {
          console.error('Error checking existing bookings:', checkError)
        }

        // If there's a conflict, show warning
        if (existingBookings && existingBookings.length > 0) {
          const conflictingBooking = existingBookings[0]
          const bookingId = conflictingBooking.id.substring(0, 8).toUpperCase()

          const pickupDate = new Date(conflictingBooking.pickup_date)
          const dropoffDate = new Date(conflictingBooking.dropoff_date)

          const confirmed = confirm(
            `ℹ️ INFO: Esiste già una prenotazione per questo veicolo\n\n` +
            `Cliente esistente: ${conflictingBooking.customer_name}\n` +
            `Veicolo: ${conflictingBooking.vehicle_name}\n` +
            `Periodo: ${pickupDate.toLocaleDateString('it-IT')} ${pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${dropoffDate.toLocaleDateString('it-IT')} ${dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
            `ID Prenotazione: DR7-${bookingId}\n\n` +
            `Stai per creare una doppia prenotazione.\n\n` +
            `• Clicca OK per procedere comunque\n` +
            `• Clicca ANNULLA per scegliere altre date`
          )

          if (!confirmed) {
            return // User cancelled
          }
        }
      }

      let customerId = formData.customer_id

      // If creating new customer, create them first in the customers table
      if (newCustomerMode) {
        try {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([{
              full_name: newCustomerData.full_name,
              email: newCustomerData.email || null,
              phone: newCustomerData.phone || null,
              driver_license_number: newCustomerData.driver_license_number || null,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single()

          if (customerError) {
            console.error('Failed to create customer:', customerError)
            throw new Error(`Failed to create customer: ${customerError.message}`)
          }

          customerId = newCustomer.id
          console.log('✅ New customer created in customers table:', newCustomer)
        } catch (error) {
          console.error('Error creating customer:', error)
          throw new Error('Failed to create customer: ' + (error as Error).message)
        }
      }

      const customerInfo = newCustomerMode ? { ...newCustomerData, id: customerId } : customers.find(c => c.id === customerId)

      // Create or update vehicle rental booking in bookings table (for website availability blocking)
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id)

      // Get location labels
      const pickupLocationLabel = LOCATIONS.find(l => l.value === formData.pickup_location)?.label || formData.pickup_location
      const dropoffLocationLabel = LOCATIONS.find(l => l.value === formData.dropoff_location)?.label || formData.dropoff_location

      // Combine date and time
      const pickupDateTime = `${formData.pickup_date}T${formData.pickup_time}:00`
      const returnDateTime = `${formData.return_date}T${formData.return_time}:00`

      const bookingData = {
          user_id: null, // Set to null for admin-created bookings
          guest_name: customerInfo?.full_name || 'N/A', // Required for guest bookings
          guest_email: customerInfo?.email || null,
          guest_phone: customerInfo?.phone || null,
          vehicle_type: 'car',
          vehicle_name: vehicle?.display_name || 'N/A',
          vehicle_plate: vehicle?.plate || null,
          vehicle_image_url: null,
          pickup_date: new Date(pickupDateTime).toISOString(),
          dropoff_date: new Date(returnDateTime).toISOString(),
          pickup_location: pickupLocationLabel,
          dropoff_location: dropoffLocationLabel,
          price_total: Math.round(parseFloat(formData.total_amount) * 100), // Convert to cents
          currency: formData.currency.toUpperCase(),
          status: formData.status,
          payment_status: formData.payment_status,
          payment_method: formData.payment_method,
          customer_name: customerInfo?.full_name || 'N/A',
          customer_email: customerInfo?.email || null,
          customer_phone: customerInfo?.phone || null,
          booked_at: editingId ? undefined : new Date().toISOString(), // Don't update booked_at on edit
          booking_source: 'admin', // Mark as admin booking
          booking_details: {
            customer: {
              fullName: customerInfo?.full_name || '',
              email: customerInfo?.email || '',
              phone: customerInfo?.phone || '',
              customerId: customerId
            },
            pickupLocation: formData.pickup_location,
            dropoffLocation: formData.dropoff_location,
            amountPaid: Math.round(parseFloat(formData.amount_paid) * 100), // Store amount paid in cents
            source: 'admin_manual'
          }
        }

        console.log(editingId ? 'Updating rental booking' : 'Creating rental booking', 'with data:', bookingData)

        let insertedBooking
        if (editingId) {
          // Update existing booking
          const { data, error: bookingError } = await supabase
            .from('bookings')
            .update(bookingData)
            .eq('id', editingId)
            .select()
            .single()

          if (bookingError) {
            console.error('Failed to update booking:', bookingError)
            console.error('Booking data that failed:', bookingData)
            throw new Error(`Failed to update booking entry: ${bookingError.message || JSON.stringify(bookingError)}`)
          }
          insertedBooking = data
          console.log('Booking updated successfully:', insertedBooking)
        } else {
          // Create new booking
          const { data, error: bookingError } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single()

          if (bookingError) {
            console.error('Failed to create booking:', bookingError)
            console.error('Booking data that failed:', bookingData)
            throw new Error(`Failed to create booking entry: ${bookingError.message || JSON.stringify(bookingError)}`)
          }
          insertedBooking = data
          console.log('Booking created successfully:', insertedBooking)
        }

        // Create Google Calendar event
        try {
          await fetch('/.netlify/functions/create-calendar-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleName: vehicle?.display_name || '',
              customerName: customerInfo?.full_name || '',
              customerEmail: customerInfo?.email || '',
              customerPhone: customerInfo?.phone || '',
              pickupDate: formData.pickup_date,
              pickupTime: formData.pickup_time,
              returnDate: formData.return_date,
              returnTime: formData.return_time,
              pickupLocation: pickupLocationLabel,
              returnLocation: dropoffLocationLabel,
              totalPrice: parseFloat(formData.total_amount),
              bookingId: insertedBooking?.id?.substring(0, 8)
            })
          })
          console.log('✅ Calendar event created successfully')
        } catch (calendarError) {
          console.error('⚠️ Failed to create calendar event:', calendarError)
          // Don't fail the whole booking if calendar fails
        }

        // Generate PDF invoice for car rental
        if (!editingId) { // Only for new bookings
          try {
            await fetch('/.netlify/functions/generate-invoice-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: insertedBooking?.id || '',
                bookingType: 'car_rental',
                customerName: customerInfo?.full_name || '',
                customerEmail: customerInfo?.email || '',
                customerPhone: customerInfo?.phone || '',
                items: [{
                  description: `Noleggio ${vehicle?.display_name || 'Veicolo'}`,
                  quantity: 1,
                  unitPrice: Math.round(parseFloat(formData.total_amount) * 100),
                  total: Math.round(parseFloat(formData.total_amount) * 100)
                }],
                subtotal: Math.round(parseFloat(formData.total_amount) * 100),
                tax: 0,
                total: Math.round(parseFloat(formData.total_amount) * 100),
                paymentStatus: formData.payment_status || 'pending',
                bookingDate: new Date().toISOString(),
                serviceDate: `${formData.pickup_date}T${formData.pickup_time}:00`,
                notes: `Ritiro: ${pickupLocationLabel}\nRiconsegna: ${dropoffLocationLabel}`
              })
            })
            console.log('✅ Invoice generated successfully')
          } catch (invoiceError) {
            console.error('⚠️ Failed to generate invoice:', invoiceError)
            // Don't fail the whole booking if invoice generation fails
          }
        }

        // Send WhatsApp notification for car rental
        if (!editingId) { // Only for new bookings
          try {
            await fetch('/.netlify/functions/send-whatsapp-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                booking: {
                  id: insertedBooking?.id || '',
                  service_type: 'car_rental',
                  customer_name: customerInfo?.full_name || '',
                  customer_email: customerInfo?.email || '',
                  customer_phone: customerInfo?.phone || '',
                  vehicle_name: vehicle?.display_name || '',
                  pickup_date: `${formData.pickup_date}T${formData.pickup_time}:00`,
                  dropoff_date: `${formData.return_date}T${formData.return_time}:00`,
                  pickup_location: pickupLocationLabel,
                  price_total: parseFloat(formData.total_amount) * 100, // Convert to cents
                  payment_status: formData.payment_status || 'pending'
                }
              })
            })
            console.log('✅ WhatsApp notification sent')
          } catch (whatsappError) {
            console.error('⚠️ Failed to send WhatsApp notification:', whatsappError)
            // Don't fail the whole booking if WhatsApp fails
          }
        }

        // Note: Removed duplicate reservation creation - bookings table is the single source of truth


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
      pickup_date: '',
      pickup_time: '',
      return_date: '',
      return_time: '',
      pickup_location: 'dr7_office',
      dropoff_location: 'dr7_office',
      status: 'pending',
      source: 'admin',
      total_amount: '0',
      amount_paid: '0',
      payment_status: 'pending',
      payment_method: 'Contanti',
      currency: 'EUR'
    })
    setCustomerSearchQuery('')
    setNewCustomerData({
      full_name: '',
      email: '',
      phone: '',
      driver_license_number: ''
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
    <>
      <style>{scrollbarStyle}</style>
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
          {/* Customer Selection - Mobile Optimized */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-dr7-darker rounded-lg border border-gray-700">
            <label className="block text-white font-semibold mb-3 text-sm sm:text-base">Cliente:</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setNewCustomerMode(false)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${!newCustomerMode ? 'bg-dr7-gold text-dr7-darker' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                Esistente
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerMode(true)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${newCustomerMode ? 'bg-dr7-gold text-dr7-darker' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
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
              <div className="space-y-3">
                {/* Search Input for Mobile */}
                <Input
                  label="🔍 Cerca Cliente (nome, email, telefono)"
                  placeholder="Inizia a scrivere per cercare..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                />

                <Select
                  label="Seleziona Cliente"
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  options={[
                    { value: '', label: 'Seleziona cliente...' },
                    ...customers
                      .filter(c => {
                        if (!customerSearchQuery) return true
                        const query = customerSearchQuery.toLowerCase()
                        return (
                          c.full_name.toLowerCase().includes(query) ||
                          c.email?.toLowerCase().includes(query) ||
                          c.phone?.toLowerCase().includes(query)
                        )
                      })
                      .sort((a, b) => a.full_name.localeCompare(b.full_name))
                      .map(c => ({ value: c.id, label: `${c.full_name} (${c.email || c.phone || 'No contact'})` }))
                  ]}
                />

                {customerSearchQuery && customers.filter(c => {
                  const query = customerSearchQuery.toLowerCase()
                  return (
                    c.full_name.toLowerCase().includes(query) ||
                    c.email?.toLowerCase().includes(query) ||
                    c.phone?.toLowerCase().includes(query)
                  )
                }).length === 0 && (
                  <p className="text-sm text-yellow-400 mt-2">
                    ⚠️ Nessun cliente trovato con "{customerSearchQuery}"
                  </p>
                )}

                {customers.length === 0 && (
                  <p className="text-sm text-yellow-400 mt-2">
                    ⚠️ Nessun cliente trovato. Verifica che l'API sia attiva o crea un nuovo cliente.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Veicolo"
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleziona veicolo...' },
                  ...vehicles.map(v => ({
                    value: v.id,
                    label: v.plate ? `${v.display_name} - Targa: ${v.plate}` : v.display_name
                  }))
                ]}
              />
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-dr7-darker rounded-lg border border-gray-700">
                <div className="space-y-3">
                  <Input
                    label="📅 Data Ritiro"
                    type="date"
                    required
                    value={formData.pickup_date}
                    onChange={(e) => {
                      setFormData({ ...formData, pickup_date: e.target.value })
                    }}
                  />
                  <Input
                    label="🕐 Ora Ritiro"
                    type="time"
                    required
                    value={formData.pickup_time}
                    onChange={(e) => {
                      const pickupTime = e.target.value
                      const returnTime = calculateReturnTime(pickupTime)
                      setFormData({ ...formData, pickup_time: pickupTime, return_time: returnTime })
                    }}
                  />
                  <p className="text-xs text-green-400 mt-1">✅ Admin: Qualsiasi orario disponibile</p>
                </div>
                <Select
                  label="📍 Luogo Ritiro"
                  required
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  options={LOCATIONS}
                />
                <div className="space-y-3">
                  <Input
                    label="📅 Data Riconsegna"
                    type="date"
                    required
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  />
                  <Input
                    label="🕐 Ora Riconsegna"
                    type="time"
                    required
                    value={formData.return_time}
                    onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                  />
                  <p className="text-xs text-blue-400 mt-1">💡 Suggerito: Ritiro - 1h30</p>
                  <p className="text-xs text-green-400">✅ Admin: Qualsiasi orario disponibile</p>
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
                label="Stato Pagamento"
                required
                value={formData.payment_status}
                onChange={(e) => {
                  const newStatus = e.target.value
                  setFormData({
                    ...formData,
                    payment_status: newStatus,
                    status: newStatus === 'paid' ? 'confirmed' : 'pending',
                    payment_method: newStatus === 'unpaid' ? '' : formData.payment_method
                  })
                }}
                options={[
                  { value: 'paid', label: 'Pagato' },
                  { value: 'pending', label: 'Da Saldare' },
                  { value: 'unpaid', label: 'Non Pagato' }
                ]}
              />
              {formData.payment_status !== 'unpaid' && (
                <Select
                  label="Metodo di Pagamento"
                  required
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  options={[
                  { value: 'Bonifico', label: 'Bonifico' },
                  { value: 'Contanti', label: 'Contanti' },
                  { value: 'Carta di Credito / bancomat', label: 'Carta di Credito / bancomat' },
                  { value: 'Paypal', label: 'Paypal' },
                  { value: 'RIBA', label: 'RIBA' },
                  { value: 'RID', label: 'RID' },
                  { value: 'Bollettino postale', label: 'Bollettino postale' },
                  { value: 'Assegno', label: 'Assegno' },
                  { value: 'Assegno circolare', label: 'Assegno circolare' },
                  { value: 'PagoPA', label: 'PagoPA' },
                  { value: 'RID utenze', label: 'RID utenze' },
                  { value: 'RIB veloce', label: 'RIB veloce' },
                  { value: 'SEPA Direct Debit', label: 'SEPA Direct Debit' },
                  { value: 'SEPA Direct Debit CORE', label: 'SEPA Direct Debit CORE' },
                  { value: 'SEPA Direct Debit B2B', label: 'SEPA Direct Debit B2B' },
                  { value: 'Domiciliazione bancaria', label: 'Domiciliazione bancaria' },
                  { value: 'Domiciliazione postale', label: 'Domiciliazione postale' },
                  { value: 'Trattenuta su somme già riscosse', label: 'Trattenuta su somme già riscosse' },
                  { value: 'Bollettino bancario', label: 'Bollettino bancario' },
                  { value: 'Contanti presso tesoreria', label: 'Contanti presso tesoreria' },
                  { value: 'Vaglia cambiario', label: 'Vaglia cambiario' },
                  { value: 'Quietanza erario', label: 'Quietanza erario' },
                  { value: 'Giroconto su conti di contabilità', label: 'Giroconto su conti di contabilità' }
                ]}
              />
              )}
              <Input
                label="Importo Totale (€)"
                type="number"
                step="0.01"
                required
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              />
              <Input
                label="Importo Pagato (€)"
                type="number"
                step="0.01"
                required
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
              />
              <Input
                label="Valuta"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit">
              Salva
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); setNewCustomerMode(false); resetForm() }}>
              Annulla
            </Button>
          </div>
        </form>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {bookings.length === 0 && (
          <div className="bg-dr7-dark rounded-lg border border-gray-800 p-8 text-center text-gray-500">
            Nessuna prenotazione trovata
          </div>
        )}

        {/* Display bookings as cards on mobile */}
        {bookings.map((booking) => {
          const isCarWash = booking.service_type === 'car_wash'
          return (
            <div
              key={`booking-card-${booking.id}`}
              className="bg-dr7-dark rounded-lg p-4 cursor-pointer hover:bg-dr7-darker transition-colors"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">
                    {booking.booking_details?.customer?.fullName || booking.customer_name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">{booking.customer_phone || '-'}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  booking.payment_status === 'completed' || booking.payment_status === 'paid' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {booking.payment_status === 'completed' || booking.payment_status === 'paid' ? 'Pagato' : 'Non Pagato'}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-2 text-white">
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
                {!isCarWash && booking.vehicle_plate && (
                  <div className="text-xs text-gray-400 ml-6 mt-1">Targa: {booking.vehicle_plate}</div>
                )}
              </div>

              <div className="text-xs text-gray-400 mb-2">
                {isCarWash
                  ? `📅 ${booking.appointment_date ? new Date(booking.appointment_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }) : '-'}${booking.appointment_time ? ` alle ${booking.appointment_time}` : ''}`
                  : `📅 ${booking.pickup_date ? new Date(typeof booking.pickup_date === 'number' ? booking.pickup_date * 1000 : booking.pickup_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome', hour12: false }) : '-'} → ${booking.dropoff_date ? new Date(typeof booking.dropoff_date === 'number' ? booking.dropoff_date * 1000 : booking.dropoff_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome', hour12: false }) : '-'}`
                }
              </div>

              <div className="flex justify-between items-start mt-3 gap-2">
                <div className="text-lg font-bold text-white">
                  {canViewFinancials ? `€${(booking.price_total / 100).toFixed(2)}` : '***'}
                </div>
                <div className="flex flex-col gap-2">
                  {booking.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditBooking(booking)
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors whitespace-nowrap"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelBooking(booking.id, 'booking')
                        }}
                        className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors whitespace-nowrap"
                      >
                        Cancella
                      </button>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteBooking(booking.id, 'booking')
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors whitespace-nowrap w-full"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-dr7-dark rounded-lg overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible custom-scrollbar">
          <table className="w-full min-w-max">
            <thead className="bg-dr7-darker sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Nome</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Telefono</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Servizio</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Data Inizio</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Data Fine</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Pagamento</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Totale</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-300 whitespace-nowrap">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {/* Display bookings from bookings table (single source of truth) */}
              {bookings.map((booking) => {
                const isCarWash = booking.service_type === 'car_wash'
                return (
                  <tr key={`booking-${booking.id}`} className="border-t border-gray-800 hover:bg-dr7-darker/50 cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                    <td className="px-3 py-3 text-sm text-white whitespace-nowrap">
                      {booking.booking_details?.customer?.fullName || booking.customer_name || 'N/A'}
                    </td>
                    <td className="px-3 py-3 text-sm text-white whitespace-nowrap">
                      {booking.customer_phone || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-white whitespace-nowrap">
                      {isCarWash ? (
                        <span className="flex items-center gap-2">
                          <span className="text-blue-400">🚿</span>
                          <span>{booking.service_name || 'Autolavaggio'}</span>
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            <span className="text-green-400">🚗</span>
                            <span>{booking.vehicle_name}</span>
                          </span>
                          {booking.vehicle_plate && (
                            <span className="text-xs text-gray-400 ml-6">Targa: {booking.vehicle_plate}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-white whitespace-nowrap">
                      {isCarWash
                        ? (booking.appointment_date ? `${new Date(booking.appointment_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' })} ${booking.appointment_time || ''}` : '-')
                        : (booking.pickup_date ? new Date(typeof booking.pickup_date === 'number' ? booking.pickup_date * 1000 : booking.pickup_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome', hour12: false }) : '-')
                      }
                    </td>
                    <td className="px-3 py-3 text-sm text-white whitespace-nowrap">
                      {isCarWash
                        ? (booking.appointment_date && booking.appointment_time
                            ? `${new Date(booking.appointment_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' })} ${calculateCarWashEndTime(booking.appointment_date, booking.appointment_time, booking.price_total)}`
                            : '-')
                        : (booking.dropoff_date ? new Date(typeof booking.dropoff_date === 'number' ? booking.dropoff_date * 1000 : booking.dropoff_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome', hour12: false }) : '-')
                      }
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        booking.payment_status === 'completed' || booking.payment_status === 'paid' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {booking.payment_status === 'completed' || booking.payment_status === 'paid' ? 'Pagato' : 'Non Pagato'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-white whitespace-nowrap">
                      {canViewFinancials ? `€${(booking.price_total / 100).toFixed(2)}` : '***'}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <div className="flex gap-2 items-center">
                        {booking.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditBooking(booking) }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                            >
                              Modifica
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id, 'booking') }}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                            >
                              Cancella
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id, 'booking') }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {bookings.length === 0 && (
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

      {/* Detail Modal - Mobile Optimized */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-dr7-dark w-full sm:max-w-2xl sm:rounded-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-dr7-darker p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-dr7-gold">Dettagli Prenotazione</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-dr7-darker p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>👤</span> Cliente
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">Nome:</span> <span className="text-white">{selectedBooking.booking_details?.customer?.fullName || selectedBooking.customer_name || 'N/A'}</span></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400">Telefono:</span> <span className="text-white">{selectedBooking.customer_phone || '-'}</span>
                    </div>
                    {selectedBooking.customer_phone && (
                      <a
                        href={`tel:${selectedBooking.customer_phone}`}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        📞 Chiama
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-dr7-darker p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  {selectedBooking.service_type === 'car_wash' ? <span>🚿</span> : <span>🚗</span>}
                  Servizio
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedBooking.service_type === 'car_wash' ? (
                    <>
                      <div><span className="text-gray-400">Tipo:</span> <span className="text-white">{selectedBooking.service_name || 'Autolavaggio'}</span></div>
                      <div><span className="text-gray-400">Data:</span> <span className="text-white">{selectedBooking.appointment_date ? new Date(selectedBooking.appointment_date).toLocaleDateString('it-IT', { dateStyle: 'full' }) : '-'}</span></div>
                      <div><span className="text-gray-400">Ora:</span> <span className="text-white">{selectedBooking.appointment_time || '-'}</span></div>
                      {selectedBooking.booking_details?.additionalService && (
                        <div><span className="text-gray-400">Servizio Aggiuntivo:</span> <span className="text-white">{selectedBooking.booking_details.additionalService}</span></div>
                      )}
                    </>
                  ) : (
                    <>
                      <div><span className="text-gray-400">Veicolo:</span> <span className="text-white">{selectedBooking.vehicle_name || '-'}</span></div>
                      {selectedBooking.vehicle_plate && (
                        <div><span className="text-gray-400">Targa:</span> <span className="text-white">{selectedBooking.vehicle_plate}</span></div>
                      )}
                      <div><span className="text-gray-400">Ritiro:</span> <span className="text-white">{selectedBooking.pickup_date ? new Date(typeof selectedBooking.pickup_date === 'number' ? selectedBooking.pickup_date * 1000 : selectedBooking.pickup_date).toLocaleString('it-IT') : '-'}</span></div>
                      <div><span className="text-gray-400">Luogo Ritiro:</span> <span className="text-white">{selectedBooking.pickup_location || '-'}</span></div>
                      <div><span className="text-gray-400">Riconsegna:</span> <span className="text-white">{selectedBooking.dropoff_date ? new Date(typeof selectedBooking.dropoff_date === 'number' ? selectedBooking.dropoff_date * 1000 : selectedBooking.dropoff_date).toLocaleString('it-IT') : '-'}</span></div>
                      <div><span className="text-gray-400">Luogo Riconsegna:</span> <span className="text-white">{selectedBooking.dropoff_location || '-'}</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-dr7-darker p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>💳</span> Pagamento
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Importo:</span>
                    <span className="text-white font-bold text-xl">
                      {canViewFinancials ? `€${(selectedBooking.price_total / 100).toFixed(2)}` : '***'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Stato:</span>
                    <span className={`px-3 py-1.5 rounded text-sm font-medium ${
                      selectedBooking.payment_status === 'completed' || selectedBooking.payment_status === 'paid'
                        ? 'bg-green-900 text-green-300'
                        : selectedBooking.payment_status === 'pending'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {selectedBooking.payment_status === 'completed' || selectedBooking.payment_status === 'paid'
                        ? 'Pagato'
                        : selectedBooking.payment_status === 'pending'
                        ? 'Da Saldare'
                        : 'Non Pagato'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.booking_details?.notes && (
                <div className="bg-dr7-darker p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📝</span> Note
                  </h4>
                  <p className="text-sm text-gray-300">{selectedBooking.booking_details.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      handleCancelBooking(selectedBooking.id, 'booking')
                      setSelectedBooking(null)
                    }}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    🗑️ Cancella Prenotazione
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
