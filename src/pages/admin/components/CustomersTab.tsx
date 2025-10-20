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
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
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

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Patente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-white">{customer.full_name}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.driver_license_number || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
