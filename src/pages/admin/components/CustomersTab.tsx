import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Input from './Input'
import TextArea from './TextArea'
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
  verification?: {
    idStatus: 'unverified' | 'pending' | 'verified'
    stripeVerificationSessionId?: string
    verifiedAt?: string
  }
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingDocuments, setViewingDocuments] = useState<Customer | null>(null)
  const [documentsUrls, setDocumentsUrls] = useState<{ license: string | null; id: string | null }>({ license: null, id: null })
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    driver_license_number: '',
    notes: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      // Get unique customers from bookings table (primary source of customer data)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('customer_name, customer_email, customer_phone, user_id, booked_at, booking_details')
        .order('booked_at', { ascending: false })

      if (bookingsError) {
        console.error('Could not load customers from bookings:', bookingsError)
      }

      // Merge customers by email or phone
      const customerMap = new Map<string, Customer>()

      // Process bookings data to create unique customer entries
      if (bookingsData) {
        console.log('Total bookings:', bookingsData.length)
        bookingsData.forEach((booking: any) => {
          // Extract customer data from booking_details if available
          const details = booking.booking_details?.customer || {}

          // Get customer info from direct columns or booking_details
          const customerName = booking.customer_name || details.fullName || 'Cliente'
          const customerEmail = booking.customer_email || details.email || null
          const customerPhone = booking.customer_phone || details.phone || null

          // Debug log
          if (!customerPhone) {
            console.log('Missing phone for:', {
              customerName,
              customerEmail,
              booking_details: booking.booking_details,
              direct_phone: booking.customer_phone
            })
          }

          // Use email as primary key, fallback to phone or user_id
          const key = customerEmail || customerPhone || booking.user_id

          if (key) {
            // If customer already exists, update phone and email if missing
            const existing = customerMap.get(key)
            if (existing) {
              if (!existing.phone && customerPhone) {
                existing.phone = customerPhone
              }
              if (!existing.email && customerEmail) {
                existing.email = customerEmail
              }
              if (existing.full_name === 'Cliente' && customerName) {
                existing.full_name = customerName
              }
            } else {
              // Create new customer entry
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
        console.log('Unique customers:', customerMap.size)
      }

      // Also get customers from customers table if it exists
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (!customersError && customersData) {
        customersData.forEach(c => {
          const key = c.email || c.phone || c.id
          if (key && !customerMap.has(key)) {
            customerMap.set(key, c)
          }
        })
      }

      // Get users who have uploaded documents to storage
      const usersWithDocuments = new Set<string>()

      // Check driver-licenses bucket
      try {
        const { data: licenseFiles, error: licenseError } = await supabase.storage
          .from('driver-licenses')
          .list()

        if (!licenseError && licenseFiles) {
          licenseFiles.forEach(folder => {
            if (folder.name && folder.name.length > 10) { // Folders are user IDs
              usersWithDocuments.add(folder.name)
            }
          })
        }
      } catch (e) {
        console.error('Error listing driver-licenses:', e)
      }

      // Check driver-ids bucket
      try {
        const { data: idFiles, error: idError } = await supabase.storage
          .from('driver-ids')
          .list()

        if (!idError && idFiles) {
          idFiles.forEach(folder => {
            if (folder.name && folder.name.length > 10) { // Folders are user IDs
              usersWithDocuments.add(folder.name)
            }
          })
        }
      } catch (e) {
        console.error('Error listing driver-ids:', e)
      }

      // Fetch user data for users with documents who aren't already in customerMap
      for (const userId of usersWithDocuments) {
        if (!customerMap.has(userId)) {
          try {
            const { data, error } = await supabase.auth.admin.getUserById(userId)
            if (!error && data?.user) {
              const metadata = data.user.user_metadata || {}
              customerMap.set(userId, {
                id: userId,
                full_name: metadata.full_name || metadata.fullName || data.user.email?.split('@')[0] || 'Cliente',
                email: data.user.email || metadata.email || null,
                phone: metadata.phone || null,
                driver_license_number: null,
                notes: null,
                created_at: data.user.created_at || new Date().toISOString(),
                updated_at: data.user.updated_at || new Date().toISOString(),
                verification: metadata.verification
              })
            }
          } catch (e) {
            console.error('Error fetching user with documents:', userId, e)
          }
        }
      }

      console.log('Users with uploaded documents:', usersWithDocuments.size)

      // Get verification status, phone, and documents from auth.users metadata
      const customersArray = Array.from(customerMap.values())
      const enrichedCustomers = await Promise.all(
        customersArray.map(async (customer) => {
          if (customer.id && customer.id.length > 10) { // Valid UUID
            try {
              const { data, error } = await supabase.auth.admin.getUserById(customer.id)
              if (!error && data?.user) {
                const metadata = data.user.user_metadata || {}
                return {
                  ...customer,
                  // Use phone from user_metadata if customer doesn't have one
                  phone: customer.phone || metadata.phone || null,
                  verification: metadata.verification
                }
              }
            } catch (e) {
              console.error('Error fetching verification for user:', customer.id, e)
            }
          }
          return customer
        })
      )

      setCustomers(enrichedCustomers)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadCustomers()
    } catch (error) {
      console.error('Failed to save customer:', error)
      alert('Failed to save customer')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo cliente?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadCustomers()
    } catch (error) {
      console.error('Failed to delete customer:', error)
      alert('Impossibile eliminare il cliente')
    }
  }

  function resetForm() {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      driver_license_number: '',
      notes: ''
    })
  }

  function handleEdit(customer: Customer) {
    setFormData({
      full_name: customer.full_name,
      email: customer.email || '',
      phone: customer.phone || '',
      driver_license_number: customer.driver_license_number || '',
      notes: customer.notes || ''
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  async function fetchCustomerDocuments(userId: string) {
    setLoadingDocuments(true)
    setDocumentsUrls({ license: null, id: null })

    try {
      // List files in driver-licenses bucket for this user
      const { data: licenseFiles } = await supabase.storage
        .from('driver-licenses')
        .list(userId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      // List files in driver-ids bucket for this user
      const { data: idFiles } = await supabase.storage
        .from('driver-ids')
        .list(userId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      let licenseUrl = null
      let idUrl = null

      // Get signed URL for the latest driver license
      if (licenseFiles && licenseFiles.length > 0) {
        const latestLicense = licenseFiles[0]
        const { data: signedLicense } = await supabase.storage
          .from('driver-licenses')
          .createSignedUrl(`${userId}/${latestLicense.name}`, 3600) // 1 hour expiry
        if (signedLicense) licenseUrl = signedLicense.signedUrl
      }

      // Get signed URL for the latest ID
      if (idFiles && idFiles.length > 0) {
        const latestId = idFiles[0]
        const { data: signedId } = await supabase.storage
          .from('driver-ids')
          .createSignedUrl(`${userId}/${latestId.name}`, 3600) // 1 hour expiry
        if (signedId) idUrl = signedId.signedUrl
      }

      setDocumentsUrls({ license: licenseUrl, id: idUrl })
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  async function handleViewDocuments(customer: Customer) {
    setViewingDocuments(customer)
    if (customer.id && customer.id.length > 10) {
      await fetchCustomerDocuments(customer.id)
    }
  }

  async function handleUploadLicense(file: File, userId: string) {
    if (!file) return

    setUploadingLicense(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('driver-licenses')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      alert('Patente caricata con successo!')
      await fetchCustomerDocuments(userId)
    } catch (error: any) {
      console.error('Error uploading license:', error)
      alert('Errore nel caricamento della patente: ' + (error.message || JSON.stringify(error)))
    } finally {
      setUploadingLicense(false)
    }
  }

  async function handleUploadId(file: File, userId: string) {
    if (!file) return

    setUploadingId(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('driver-ids')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      alert('Documento d\'identità caricato con successo!')
      await fetchCustomerDocuments(userId)
    } catch (error: any) {
      console.error('Error uploading ID:', error)
      alert('Errore nel caricamento del documento: ' + (error.message || JSON.stringify(error)))
    } finally {
      setUploadingId(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
      {/* Documents Modal */}
      {viewingDocuments && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Documenti - {viewingDocuments.full_name}
              </h3>
              <button
                onClick={() => setViewingDocuments(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Verification Status */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Stato Verifica Identità</h4>
                {viewingDocuments.verification ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Stato:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewingDocuments.verification.idStatus === 'verified'
                          ? 'bg-green-500/20 text-green-400'
                          : viewingDocuments.verification.idStatus === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {viewingDocuments.verification.idStatus === 'verified' && '✓ Verificato'}
                        {viewingDocuments.verification.idStatus === 'pending' && '⏳ In Attesa'}
                        {viewingDocuments.verification.idStatus === 'unverified' && '✗ Non Verificato'}
                      </span>
                    </div>
                    {viewingDocuments.verification.verifiedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Data Verifica:</span>
                        <span className="text-sm text-white">
                          {new Date(viewingDocuments.verification.verifiedAt).toLocaleString('it-IT')}
                        </span>
                      </div>
                    )}
                    {viewingDocuments.verification.stripeVerificationSessionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Stripe Session ID:</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {viewingDocuments.verification.stripeVerificationSessionId}
                        </span>
                      </div>
                    )}
                    {viewingDocuments.verification.idStatus === 'verified' && (
                      <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
                        <p className="text-sm text-green-400">
                          ✓ Identità verificata tramite Stripe Identity. I documenti sono conservati in modo sicuro da Stripe.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Nessuna verifica effettuata</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Il cliente non ha ancora completato la verifica dell'identità
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Informazioni Cliente</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Email:</span>
                    <span className="text-sm text-white">{viewingDocuments.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Telefono:</span>
                    <span className="text-sm text-white">{viewingDocuments.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Numero Patente:</span>
                    <span className="text-sm text-white">{viewingDocuments.driver_license_number || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Documenti Caricati</h4>
                {loadingDocuments ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Caricamento documenti...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Driver's License */}
                    <div className="border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">📄 Patente di Guida</span>
                        {documentsUrls.license && (
                          <a
                            href={documentsUrls.license}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Apri in nuova scheda →
                          </a>
                        )}
                      </div>
                      {documentsUrls.license ? (
                        <img
                          src={documentsUrls.license}
                          alt="Patente di guida"
                          className="w-full rounded border border-gray-600 mb-3"
                        />
                      ) : (
                        <p className="text-sm text-gray-500 italic mb-3">Nessun documento caricato</p>
                      )}
                      {/* Upload Section */}
                      {viewingDocuments.id && viewingDocuments.id.length > 10 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && viewingDocuments.id) {
                                  handleUploadLicense(file, viewingDocuments.id)
                                }
                              }}
                              className="hidden"
                              disabled={uploadingLicense}
                              id="license-upload"
                            />
                            <span className={`inline-block px-4 py-2 rounded text-sm font-medium text-center w-full cursor-pointer ${
                              uploadingLicense
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-dr7-gold text-black hover:bg-dr7-gold/90'
                            }`}>
                              {uploadingLicense ? 'Caricamento...' : '📤 Carica Nuova Patente'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* ID Card / Passport */}
                    <div className="border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">🆔 Carta d'Identità / Passaporto</span>
                        {documentsUrls.id && (
                          <a
                            href={documentsUrls.id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Apri in nuova scheda →
                          </a>
                        )}
                      </div>
                      {documentsUrls.id ? (
                        <img
                          src={documentsUrls.id}
                          alt="Carta d'identità"
                          className="w-full rounded border border-gray-600 mb-3"
                        />
                      ) : (
                        <p className="text-sm text-gray-500 italic mb-3">Nessun documento caricato</p>
                      )}
                      {/* Upload Section */}
                      {viewingDocuments.id && viewingDocuments.id.length > 10 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && viewingDocuments.id) {
                                  handleUploadId(file, viewingDocuments.id)
                                }
                              }}
                              className="hidden"
                              disabled={uploadingId}
                              id="id-upload"
                            />
                            <span className={`inline-block px-4 py-2 rounded text-sm font-medium text-center w-full cursor-pointer ${
                              uploadingId
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-dr7-gold text-black hover:bg-dr7-gold/90'
                            }`}>
                              {uploadingId ? 'Caricamento...' : '📤 Carica Nuovo Documento'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              {viewingDocuments.notes && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Note</h4>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingDocuments.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stats Card */}
      <div className="mb-6 bg-gradient-to-r from-dr7-gold/20 to-dr7-gold/5 border border-dr7-gold/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Totale Clienti</p>
            <p className="text-4xl font-bold text-dr7-gold">{customers.length}</p>
          </div>
          <div className="text-dr7-gold">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Clienti</h2>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}>
          + Nuovo Cliente
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h3>
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Telefono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Numero Patente"
              value={formData.driver_license_number}
              onChange={(e) => setFormData({ ...formData, driver_license_number: e.target.value })}
            />
            <TextArea
              label="Note"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit">Salva</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}>
              Annulla
            </Button>
          </div>
        </form>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Telefono</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-white">{customer.full_name}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewDocuments(customer)}
                        variant="secondary"
                        className="text-xs py-1 px-3 bg-blue-900 hover:bg-blue-800"
                      >
                        Documenti
                      </Button>
                      <Button
                        onClick={() => handleEdit(customer)}
                        variant="secondary"
                        className="text-xs py-1 px-3"
                      >
                        Modifica
                      </Button>
                      <Button
                        onClick={() => handleDelete(customer.id)}
                        variant="secondary"
                        className="text-xs py-1 px-3 bg-red-900 hover:bg-red-800"
                      >
                        Elimina
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nessun cliente trovato
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
