import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Button from './Button'
import Input from './Input'
import Select from './Select'
import NewClientModal from './NewClientModal'

interface GiftCard {
  id: string
  code: string
  initial_value: number
  remaining_value: number
  currency: string
  status: 'active' | 'redeemed' | 'expired' | 'cancelled'
  issued_with_booking_id: string | null
  issued_at: string
  expires_at: string | null
  redeemed_at: string | null
  redeemed_in_booking_id: string | null
  recipient_name: string | null
  recipient_email: string | null
  created_at: string
  updated_at: string
}

interface CommercialTicket {
  id: string
  uuid: string
  ticket_number: number
  user_id: string | null
  email: string
  full_name: string
  payment_intent_id: string
  amount_paid: number
  currency: string
  purchase_date: string
  quantity: number
  created_at: string
  updated_at: string
}

type ViewMode = 'commercial' | 'gift_cards'

export default function TicketsTab() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [commercialTickets, setCommercialTickets] = useState<CommercialTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('commercial')
  const [showTicketNumberModal, setShowTicketNumberModal] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [manualSaleData, setManualSaleData] = useState({
    ticket_number: '',
    customer_id: '',
    customer_name: '',
    customer_email: '',
    payment_method: 'cash',
    amount: '20'
  })

  useEffect(() => {
    loadData()
  }, [viewMode])

  async function loadData() {
    setLoading(true)
    try {
      if (viewMode === 'commercial') {
        await loadCommercialTickets()
      } else {
        await loadGiftCards()
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadCommercialTickets() {
    try {
      const { data, error } = await supabase
        .from('commercial_operation_tickets')
        .select('*')
        .order('purchase_date', { ascending: false })

      if (error) throw error
      setCommercialTickets(data || [])
    } catch (error) {
      console.error('Failed to load commercial tickets:', error)
    }
  }

  async function loadGiftCards() {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGiftCards(data || [])
    } catch (error) {
      console.error('Failed to load gift cards:', error)
    }
  }

  function formatPrice(value: number, currency: string = 'EUR'): string {
    return `${currency} ${value.toFixed(2)}`
  }

  function formatPriceCents(cents: number, currency: string = 'eur'): string {
    const value = cents / 100
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(value)
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Attivo'
      case 'redeemed': return 'Riscattato'
      case 'expired': return 'Scaduto'
      case 'cancelled': return 'Annullato'
      default: return status
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-900 text-green-200'
      case 'redeemed': return 'bg-blue-900 text-blue-200'
      case 'expired': return 'bg-gray-700 text-gray-300'
      case 'cancelled': return 'bg-red-900 text-red-200'
      default: return 'bg-gray-700 text-gray-200'
    }
  }

  // Commercial tickets stats
  const totalCommercialRevenue = commercialTickets.reduce((sum, ticket) => sum + ticket.amount_paid, 0)
  const totalCommercialTickets = commercialTickets.length
  const uniquePurchases = new Set(commercialTickets.map(t => t.payment_intent_id)).size

  // Gift cards stats
  const filteredCards = filterStatus === 'all'
    ? giftCards
    : giftCards.filter(c => c.status === filterStatus)
  const totalValue = filteredCards.reduce((sum, card) => sum + card.initial_value, 0)
  const totalRedeemed = filteredCards.filter(c => c.status === 'redeemed').length
  const totalActive = filteredCards.filter(c => c.status === 'active').length

  async function handleExportCommercial() {
    try {
      const csvData = [
        ['UUID', 'Numero Biglietto', 'Nome', 'Email', 'Importo', 'Valuta', 'Data Acquisto', 'Quantità', 'Payment Intent ID'].join(','),
        ...commercialTickets.map(ticket => [
          ticket.uuid,
          ticket.ticket_number.toString().padStart(6, '0'),
          ticket.full_name,
          ticket.email,
          (ticket.amount_paid / 100).toFixed(2),
          ticket.currency.toUpperCase(),
          new Date(ticket.purchase_date).toLocaleString('it-IT'),
          ticket.quantity,
          ticket.payment_intent_id
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `biglietti-operazione-commerciale-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Impossibile esportare i biglietti')
    }
  }

  async function handleExportGiftCards() {
    try {
      const csvData = [
        ['Codice', 'Valore Iniziale', 'Valore Rimanente', 'Valuta', 'Stato', 'Destinatario', 'Email', 'Emesso', 'Scadenza', 'Riscattato'].join(','),
        ...filteredCards.map(card => [
          card.code,
          card.initial_value.toFixed(2),
          card.remaining_value.toFixed(2),
          card.currency,
          getStatusLabel(card.status),
          card.recipient_name || '',
          card.recipient_email || '',
          new Date(card.issued_at).toLocaleDateString('it-IT'),
          card.expires_at ? new Date(card.expires_at).toLocaleDateString('it-IT') : '',
          card.redeemed_at ? new Date(card.redeemed_at).toLocaleDateString('it-IT') : ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gift-cards-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Impossibile esportare i buoni regalo')
    }
  }

  function resetManualSaleForm() {
    setManualSaleData({
      ticket_number: '',
      customer_id: '',
      customer_name: '',
      customer_email: '',
      payment_method: 'cash',
      amount: '20'
    })
  }

  function openManualSaleModal() {
    resetManualSaleForm()
    setShowTicketNumberModal(true)
  }

  function closeAllModals() {
    setShowTicketNumberModal(false)
    setShowNewClientModal(false)
    setShowPaymentModal(false)
    resetManualSaleForm()
  }

  async function handleClientCreated(clientId: string) {
    // Fetch customer data to display in payment step
    try {
      const { data, error } = await supabase
        .from('customers_extended')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error

      // Get customer name and email
      let customerName = ''
      let customerEmail = data.email || ''

      if (data.tipo_cliente === 'persona_fisica') {
        customerName = `${data.nome || ''} ${data.cognome || ''}`.trim()
      } else if (data.tipo_cliente === 'azienda') {
        customerName = data.denominazione || ''
      } else if (data.tipo_cliente === 'pubblica_amministrazione') {
        customerName = data.ente_ufficio || ''
      }

      setManualSaleData(prev => ({
        ...prev,
        customer_id: clientId,
        customer_name: customerName,
        customer_email: customerEmail
      }))

      setShowNewClientModal(false)
      // Open payment modal
      setShowPaymentModal(true)
    } catch (error) {
      console.error('Failed to fetch customer data:', error)
      alert('Errore nel recupero dati cliente')
    }
  }

  async function handleManualSaleSubmit() {
    try {
      // Validate ticket number
      const ticketNum = parseInt(manualSaleData.ticket_number)
      if (isNaN(ticketNum) || ticketNum < 1 || ticketNum > 350000) {
        alert('Il numero del biglietto deve essere tra 1 e 350,000')
        return
      }

      // Check if ticket number already exists
      const { data: existingTicket } = await supabase
        .from('commercial_operation_tickets')
        .select('ticket_number')
        .eq('ticket_number', ticketNum)
        .single()

      if (existingTicket) {
        alert('Questo numero di biglietto è già stato venduto!')
        return
      }

      // Create the ticket
      const amount = parseFloat(manualSaleData.amount) * 100 // Convert to cents
      const { error } = await supabase
        .from('commercial_operation_tickets')
        .insert([{
          ticket_number: ticketNum,
          email: manualSaleData.customer_email,
          full_name: manualSaleData.customer_name,
          payment_intent_id: `manual_sale_${Date.now()}`,
          amount_paid: amount,
          currency: 'eur',
          purchase_date: new Date().toISOString(),
          quantity: 1
        }])

      if (error) throw error

      alert('Biglietto venduto con successo!')
      closeAllModals()
      loadCommercialTickets()
    } catch (error) {
      console.error('Failed to create manual sale:', error)
      alert('Impossibile creare la vendita manuale')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('commercial')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'commercial'
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Biglietti Operazione Commerciale
        </button>
        <button
          onClick={() => setViewMode('gift_cards')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'gift_cards'
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Buoni Regalo Promozionali
        </button>
      </div>

      {viewMode === 'commercial' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Biglietti Operazione Commerciale</h2>
              <p className="text-sm text-gray-400 mt-1">
                Biglietti venduti per l'operazione "7 MILIONI DI EURO"
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={openManualSaleModal}>
                + Vendita Manuale
              </Button>
              <Button onClick={handleExportCommercial} variant="secondary">
                Esporta CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Totale Biglietti Venduti</div>
              <div className="text-2xl font-bold text-white">{totalCommercialTickets}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Ricavo Totale</div>
              <div className="text-2xl font-bold text-white">{formatPriceCents(totalCommercialRevenue)}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Acquisti Unici</div>
              <div className="text-2xl font-bold text-green-400">{uniquePurchases}</div>
            </div>
          </div>

          {/* Commercial Tickets Table */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Numero Biglietto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Importo Pagato</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Data Acquisto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Quantità</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">UUID</th>
                  </tr>
                </thead>
                <tbody>
                  {commercialTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-white font-bold">
                        #{ticket.ticket_number.toString().padStart(6, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{ticket.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{ticket.email}</td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">
                        {formatPriceCents(ticket.amount_paid, ticket.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(ticket.purchase_date).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{ticket.quantity}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {ticket.uuid.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                  {commercialTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Nessun biglietto venduto ancora
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {commercialTickets.length === 0 && (
            <div className="mt-6 p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                📝 Operazione Commerciale "7 MILIONI DI EURO"
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>I biglietti vengono salvati automaticamente dopo ogni acquisto</li>
                <li>Ogni biglietto ha un numero univoco da 1 a 350,000</li>
                <li>L'estrazione si terrà il 24 Dicembre 2025</li>
                <li>I biglietti appariranno qui dopo il primo acquisto</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {viewMode === 'gift_cards' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Buoni Regalo Promozionali</h2>
              <p className="text-sm text-gray-400 mt-1">
                Buoni da €25 con validità 24 mesi (non cumulabili)
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleExportGiftCards} variant="secondary">
                Esporta CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Totale Buoni</div>
              <div className="text-2xl font-bold text-white">{filteredCards.length}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Valore Totale</div>
              <div className="text-2xl font-bold text-white">{formatPrice(totalValue)}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Attivi</div>
              <div className="text-2xl font-bold text-green-400">{totalActive}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Riscattati</div>
              <div className="text-2xl font-bold text-blue-400">{totalRedeemed}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="redeemed">Riscattati</option>
              <option value="expired">Scaduti</option>
              <option value="cancelled">Annullati</option>
            </select>
          </div>

          {/* Gift Cards Table */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Codice</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Destinatario</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Valore</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Rimanente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Stato</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Emesso</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Scadenza</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <tr key={card.id} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-white">{card.code}</td>
                      <td className="px-4 py-3 text-sm text-white">{card.recipient_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{card.recipient_email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatPrice(card.initial_value, card.currency)}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatPrice(card.remaining_value, card.currency)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(card.status)}`}>
                          {getStatusLabel(card.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(card.issued_at).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {card.expires_at ? new Date(card.expires_at).toLocaleDateString('it-IT') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {filteredCards.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        {giftCards.length === 0
                          ? 'Nessun buono regalo emesso ancora'
                          : 'Nessun buono trovato con i filtri selezionati'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {giftCards.length === 0 && (
            <div className="mt-6 p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                📝 Come funzionano i Buoni Promozionali
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Valore: €25 per buono</li>
                <li>Validità: 24 mesi dalla data di emissione</li>
                <li>Non cumulabili tra loro</li>
                <li>Emessi automaticamente con acquisti operazione commerciale</li>
                <li>I buoni appariranno qui dopo la prima emissione</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Ticket Number Modal */}
      {showTicketNumberModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Vendita Manuale Biglietto</h3>
            <div className="space-y-4">
              <Input
                label="Numero Biglietto (1-350,000)"
                type="number"
                min="1"
                max="350000"
                required
                value={manualSaleData.ticket_number}
                onChange={(e) => setManualSaleData({ ...manualSaleData, ticket_number: e.target.value })}
                placeholder="Es. 12345"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!manualSaleData.ticket_number) {
                      alert('Inserisci un numero di biglietto')
                      return
                    }
                    // Close ticket number modal and open NewClientModal
                    setShowTicketNumberModal(false)
                    setShowNewClientModal(true)
                  }}
                >
                  Avanti
                </Button>
                <Button variant="secondary" onClick={closeAllModals}>
                  Annulla
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: New Client Modal */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => {
          setShowNewClientModal(false)
          setShowTicketNumberModal(true)
        }}
        onClientCreated={handleClientCreated}
      />

      {/* Step 3: Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Pagamento Biglietto</h3>
            <div className="space-y-4">
              <Select
                label="Metodo di Pagamento"
                required
                value={manualSaleData.payment_method}
                onChange={(e) => setManualSaleData({ ...manualSaleData, payment_method: e.target.value })}
                options={[
                  { value: 'cash', label: 'Contanti' },
                  { value: 'card', label: 'Carta' },
                  { value: 'bank_transfer', label: 'Bonifico' },
                  { value: 'satispay', label: 'Satispay' },
                  { value: 'other', label: 'Altro' }
                ]}
              />
              <Input
                label="Importo (€)"
                type="number"
                step="0.01"
                required
                value={manualSaleData.amount}
                onChange={(e) => setManualSaleData({ ...manualSaleData, amount: e.target.value })}
              />

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-2">Riepilogo</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="text-gray-400">Biglietto:</span> #{manualSaleData.ticket_number.padStart(6, '0')}</p>
                  <p><span className="text-gray-400">Cliente:</span> {manualSaleData.customer_name}</p>
                  <p><span className="text-gray-400">Email:</span> {manualSaleData.customer_email}</p>
                  <p><span className="text-gray-400">Pagamento:</span> {
                    manualSaleData.payment_method === 'cash' ? 'Contanti' :
                    manualSaleData.payment_method === 'card' ? 'Carta' :
                    manualSaleData.payment_method === 'bank_transfer' ? 'Bonifico' :
                    manualSaleData.payment_method === 'satispay' ? 'Satispay' : 'Altro'
                  }</p>
                  <p><span className="text-gray-400">Importo:</span> €{parseFloat(manualSaleData.amount).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleManualSaleSubmit}>
                  Conferma Vendita
                </Button>
                <Button variant="secondary" onClick={() => {
                  setShowPaymentModal(false)
                  setShowNewClientModal(true)
                }}>
                  Cambia Cliente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
