import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Input from './Input'
import Select from './Select'
import TextArea from './TextArea'
import Button from './Button'

interface Fattura {
  id: string
  numero_fattura: string
  cliente_id: string
  data_emissione: string
  importo_totale: number
  stato: 'bozza' | 'emessa' | 'pagata' | 'annullata'
  note: string | null
  created_at: string
  updated_at: string
  customers?: {
    full_name: string
    email: string | null
  }
}

interface Customer {
  id: string
  full_name: string
  email: string | null
}

export default function FatturaTab() {
  const [fatture, setFatture] = useState<Fattura[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numero_fattura: '',
    cliente_id: '',
    data_emissione: '',
    importo_totale: '',
    stato: 'bozza',
    note: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [fattureRes, customersRes] = await Promise.all([
        supabase
          .from('fatture')
          .select('*, customers(full_name, email)')
          .order('data_emissione', { ascending: false }),
        supabase
          .from('customers')
          .select('id, full_name, email')
          .order('full_name')
      ])

      if (fattureRes.error) throw fattureRes.error
      if (customersRes.error) throw customersRes.error

      setFatture(fattureRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const dataToSave = {
        ...formData,
        importo_totale: parseFloat(formData.importo_totale)
      }

      if (editingId) {
        const { error } = await supabase
          .from('fatture')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('fatture')
          .insert([dataToSave])

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save fattura:', error)
      alert('Impossibile salvare la fattura')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa fattura?')) return

    try {
      const { error } = await supabase
        .from('fatture')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Failed to delete fattura:', error)
      alert('Impossibile eliminare la fattura')
    }
  }

  function resetForm() {
    setFormData({
      numero_fattura: '',
      cliente_id: '',
      data_emissione: '',
      importo_totale: '',
      stato: 'bozza',
      note: ''
    })
  }

  function handleEdit(fattura: Fattura) {
    setFormData({
      numero_fattura: fattura.numero_fattura,
      cliente_id: fattura.cliente_id,
      data_emissione: fattura.data_emissione,
      importo_totale: fattura.importo_totale.toString(),
      stato: fattura.stato,
      note: fattura.note || ''
    })
    setEditingId(fattura.id)
    setShowForm(true)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Fatture</h2>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}>
          + Nuova Fattura
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingId ? 'Modifica Fattura' : 'Nuova Fattura'}
          </h3>
          <div className="space-y-4">
            <Input
              label="Numero Fattura"
              required
              value={formData.numero_fattura}
              onChange={(e) => setFormData({ ...formData, numero_fattura: e.target.value })}
            />
            <Select
              label="Cliente"
              required
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              options={[
                { value: '', label: 'Seleziona un cliente' },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: `${customer.full_name}${customer.email ? ` (${customer.email})` : ''}`
                }))
              ]}
            />
            <Input
              label="Data Emissione"
              type="date"
              required
              value={formData.data_emissione}
              onChange={(e) => setFormData({ ...formData, data_emissione: e.target.value })}
            />
            <Input
              label="Importo Totale (€)"
              type="number"
              step="0.01"
              required
              value={formData.importo_totale}
              onChange={(e) => setFormData({ ...formData, importo_totale: e.target.value })}
            />
            <Select
              label="Stato"
              required
              value={formData.stato}
              onChange={(e) => setFormData({ ...formData, stato: e.target.value })}
              options={[
                { value: 'bozza', label: 'Bozza' },
                { value: 'emessa', label: 'Emessa' },
                { value: 'pagata', label: 'Pagata' },
                { value: 'annullata', label: 'Annullata' }
              ]}
            />
            <TextArea
              label="Note"
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Numero</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Importo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Stato</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {fatture.map((fattura) => (
                <tr key={fattura.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-white">{fattura.numero_fattura}</td>
                  <td className="px-4 py-3 text-sm text-white">
                    {fattura.customers?.full_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {new Date(fattura.data_emissione).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    €{fattura.importo_totale.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      fattura.stato === 'pagata' ? 'bg-green-900 text-green-200' :
                      fattura.stato === 'emessa' ? 'bg-blue-900 text-blue-200' :
                      fattura.stato === 'annullata' ? 'bg-red-900 text-red-200' :
                      'bg-gray-700 text-gray-200'
                    }`}>
                      {fattura.stato.charAt(0).toUpperCase() + fattura.stato.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(fattura)}
                        variant="secondary"
                        className="text-xs py-1 px-3"
                      >
                        Modifica
                      </Button>
                      <Button
                        onClick={() => handleDelete(fattura.id)}
                        variant="secondary"
                        className="text-xs py-1 px-3 bg-red-900 hover:bg-red-800"
                      >
                        Elimina
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {fatture.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nessuna fattura trovata
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
