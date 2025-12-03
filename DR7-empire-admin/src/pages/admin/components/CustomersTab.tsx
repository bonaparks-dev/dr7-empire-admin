import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Button from './Button'

interface Customer {
  id: string
  user_id: string | null
  tipo_cliente: 'azienda' | 'persona_fisica' | 'pubblica_amministrazione' | null
  nazione: string | null
  nome: string | null
  cognome: string | null
  denominazione: string | null
  email: string | null
  telefono: string | null
  codice_fiscale: string | null
  partita_iva: string | null
  indirizzo: string | null
  citta_residenza: string | null
  provincia_residenza: string | null
  created_at: string
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers_extended')
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

  function getCustomerName(customer: Customer): string {
    if (customer.tipo_cliente === 'azienda') {
      return customer.denominazione || 'N/A'
    } else if (customer.tipo_cliente === 'persona_fisica') {
      return `${customer.nome || ''} ${customer.cognome || ''}`.trim() || 'N/A'
    } else if (customer.tipo_cliente === 'pubblica_amministrazione') {
      return customer.denominazione || 'N/A'
    }
    return 'N/A'
  }

  function getTypeLabel(type: string | null): string {
    const labels: { [key: string]: string } = {
      'azienda': 'Azienda',
      'persona_fisica': 'Persona Fisica',
      'pubblica_amministrazione': 'P.A.'
    }
    return labels[type || ''] || 'N/A'
  }

  function getTypeBadgeColor(type: string | null): string {
    const colors: { [key: string]: string } = {
      'azienda': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'persona_fisica': 'bg-green-500/20 text-green-400 border-green-500/50',
      'pubblica_amministrazione': 'bg-purple-500/20 text-purple-400 border-purple-500/50'
    }
    return colors[type || ''] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      getCustomerName(customer).toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.telefono?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.codice_fiscale?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === 'all' || customer.tipo_cliente === filterType

    return matchesSearch && matchesType
  })

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Totale Clienti</div>
          <div className="text-2xl font-bold text-white">{customers.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Aziende</div>
          <div className="text-2xl font-bold text-blue-400">
            {customers.filter(c => c.tipo_cliente === 'azienda').length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Persone Fisiche</div>
          <div className="text-2xl font-bold text-green-400">
            {customers.filter(c => c.tipo_cliente === 'persona_fisica').length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">P.A.</div>
          <div className="text-2xl font-bold text-purple-400">
            {customers.filter(c => c.tipo_cliente === 'pubblica_amministrazione').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cerca Cliente
            </label>
            <input
              type="text"
              placeholder="Nome, email, telefono, codice fiscale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo Cliente
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
            >
              <option value="all">Tutti</option>
              <option value="azienda">Aziende</option>
              <option value="persona_fisica">Persone Fisiche</option>
              <option value="pubblica_amministrazione">Pubblica Amministrazione</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Clienti Registrati</h2>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Nome/Denominazione</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Telefono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">CF/P.IVA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getTypeBadgeColor(customer.tipo_cliente)}`}>
                      {getTypeLabel(customer.tipo_cliente)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {getCustomerName(customer)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {customer.email || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {customer.telefono || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {customer.tipo_cliente === 'azienda' && customer.partita_iva
                      ? `P.IVA: ${customer.partita_iva}`
                      : customer.codice_fiscale
                        ? `CF: ${customer.codice_fiscale}`
                        : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(customer.created_at).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
