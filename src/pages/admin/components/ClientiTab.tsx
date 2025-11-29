import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import DynamicCustomerForm from './DynamicCustomerForm'
import Button from './Button'

interface Customer {
  id: string
  tipo_cliente: 'azienda' | 'persona_fisica' | 'pubblica_amministrazione'
  nazione: string
  created_at: string
  // Azienda
  denominazione?: string
  partita_iva?: string
  // Persona Fisica
  nome?: string
  cognome?: string
  telefono?: string
  email?: string
  pec?: string
  // Common
  codice_fiscale?: string
  indirizzo?: string
  // Pubblica Amministrazione
  codice_univoco?: string
  ente_ufficio?: string
  citta?: string
  // Meta
  source?: string
}

export default function ClientiTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'azienda' | 'persona_fisica' | 'pubblica_amministrazione'>('all')

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

  const getDisplayName = (customer: Customer) => {
    if (customer.tipo_cliente === 'azienda') {
      return customer.denominazione || 'N/A'
    } else if (customer.tipo_cliente === 'persona_fisica') {
      return `${customer.nome || ''} ${customer.cognome || ''}`.trim() || 'N/A'
    } else if (customer.tipo_cliente === 'pubblica_amministrazione') {
      return customer.ente_ufficio || 'N/A'
    }
    return 'N/A'
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'azienda':
        return '🏢 Azienda'
      case 'persona_fisica':
        return '👤 Persona Fisica'
      case 'pubblica_amministrazione':
        return '🏛️ Pubblica Amministrazione'
      default:
        return tipo
    }
  }

  const filteredCustomers = filter === 'all'
    ? customers
    : customers.filter(c => c.tipo_cliente === filter)

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Caricamento clienti...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
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

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestione Clienti</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all'
                  ? 'bg-dr7-gold text-black font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tutti ({customers.length})
            </button>
            <button
              onClick={() => setFilter('azienda')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'azienda'
                  ? 'bg-dr7-gold text-black font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🏢 Aziende ({customers.filter(c => c.tipo_cliente === 'azienda').length})
            </button>
            <button
              onClick={() => setFilter('persona_fisica')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'persona_fisica'
                  ? 'bg-dr7-gold text-black font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              👤 Persone ({customers.filter(c => c.tipo_cliente === 'persona_fisica').length})
            </button>
            <button
              onClick={() => setFilter('pubblica_amministrazione')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'pubblica_amministrazione'
                  ? 'bg-dr7-gold text-black font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🏛️ P.A. ({customers.filter(c => c.tipo_cliente === 'pubblica_amministrazione').length})
            </button>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Chiudi Form' : '+ Nuovo Cliente'}
        </Button>
      </div>

      {/* Dynamic Form */}
      {showForm && (
        <DynamicCustomerForm
          onSuccess={() => {
            setShowForm(false)
            loadCustomers()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-dr7-dark rounded-lg border border-gray-800 p-8 text-center text-gray-500">
          Nessun cliente trovato
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Nome/Denominazione</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Codice Fiscale</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Contatto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Indirizzo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Origine</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-white">
                      <span className="inline-block px-2 py-1 rounded bg-dr7-gold/20 text-dr7-gold text-xs font-medium">
                        {getTipoLabel(customer.tipo_cliente)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {getDisplayName(customer)}
                      {customer.tipo_cliente === 'azienda' && customer.partita_iva && (
                        <div className="text-xs text-gray-400 mt-1">P.IVA: {customer.partita_iva}</div>
                      )}
                      {customer.tipo_cliente === 'pubblica_amministrazione' && customer.codice_univoco && (
                        <div className="text-xs text-gray-400 mt-1">Cod. Univoco: {customer.codice_univoco}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {customer.codice_fiscale || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {customer.email && <div>{customer.email}</div>}
                      {customer.telefono && <div className="text-xs text-gray-400">{customer.telefono}</div>}
                      {!customer.email && !customer.telefono && '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                      {customer.indirizzo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                      {new Date(customer.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.source === 'admin'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {customer.source === 'admin' ? 'Admin' : 'Website'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
