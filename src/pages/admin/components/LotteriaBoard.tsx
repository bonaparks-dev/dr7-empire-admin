import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAdminRole } from '../../../hooks/useAdminRole';
import NewClientModal from './NewClientModal';

// Generate UUID for ticket
function generateTicketUuid(ticketNumber: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `manual-${ticketNumber}-${timestamp}-${random}`;
}

// Send WhatsApp notification to admin
async function sendWhatsAppNotification(ticketNumbers: number[], fullName: string, email: string, phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ticketList = ticketNumbers.map(n => `#${String(n).padStart(4, '0')}`).join(', ');

    console.log('[WhatsApp] Sending notification for tickets:', ticketList);

    const response = await fetch('/.netlify/functions/send-whatsapp-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'lottery_ticket',
        ticketNumbers,
        customerInfo: { fullName, email, phone }
      })
    });

    console.log('[WhatsApp] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp] Error response:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log('[WhatsApp] Success:', result);

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.message || 'Unknown error' };
    }
  } catch (error: any) {
    console.error('[WhatsApp] Exception:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

interface Ticket {
  ticket_number: number;
  email: string;
  full_name: string;
  customer_phone?: string;
  purchase_date: string;
  payment_intent_id: string;
}

interface ManualSaleModalProps {
  ticketNumber?: number;
  ticketNumbers?: number[];
  onClose: () => void;
  onConfirm: (ticketNumbers: number[], email: string, fullName: string, phone: string, paymentMethod: string) => void;
  onOpenNewClientModal: () => void;
}

const ManualSaleModal: React.FC<ManualSaleModalProps & { prefillData?: { email: string; fullName: string; phone: string } | null }> = ({ ticketNumber, ticketNumbers, onClose, onConfirm, onOpenNewClientModal, prefillData }) => {
  const [email, setEmail] = useState(prefillData?.email || '');
  const [fullName, setFullName] = useState(prefillData?.fullName || '');
  const [phone, setPhone] = useState(prefillData?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('Contanti');

  const tickets = ticketNumbers || (ticketNumber ? [ticketNumber] : []);
  const isBulkSale = tickets.length > 1;

  // Calculate discounted price based on quantity
  const calculateTotalPrice = (qty: number): number => {
    if (qty < 10) {
      return qty * 25;
    } else if (qty >= 10 && qty < 100) {
      return qty * 22;
    } else if (qty === 100) {
      return 1999;
    } else {
      return qty * 20;
    }
  };

  const totalPrice = calculateTotalPrice(tickets.length);
  const originalPrice = tickets.length * 25;
  const discount = originalPrice - totalPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && fullName && phone && paymentMethod) {
      onConfirm(tickets, email, fullName, phone, paymentMethod);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-2">
          {isBulkSale
            ? `Vendita Multipla - ${tickets.length} Biglietti`
            : `Vendita Manuale - Biglietto #${String(tickets[0]).padStart(4, '0')}`
          }
        </h3>
        <div className="mb-4">
          <button
            type="button"
            onClick={onOpenNewClientModal}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            + Crea Cliente Completo (Azienda/PA)
          </button>
        </div>
        {isBulkSale && (
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium mb-2">Biglietti selezionati:</p>
            <div className="flex flex-wrap gap-2">
              {tickets.map(num => (
                <span key={num} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                  #{String(num).padStart(4, '0')}
                </span>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Telefono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              placeholder="+39 123 456 7890"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Metodo di Pagamento</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="Contanti">Contanti</option>
              <option value="Carta di Credito / bancomat">Carta di Credito / bancomat</option>
              <option value="Bonifico">Bonifico</option>
              <option value="Paypal">Paypal</option>
              <option value="Stripe">Stripe</option>
            </select>
          </div>
          {discount > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Sconto applicato!</p>
              <p className="text-xs text-yellow-700">
                Prezzo originale: €{originalPrice.toFixed(2)}
              </p>
              <p className="text-xs text-yellow-700">
                Sconto: -€{discount.toFixed(2)}
              </p>
              <p className="text-sm font-bold text-yellow-900 mt-1">
                Totale: €{totalPrice.toFixed(2)}
              </p>
            </div>
          )}
          {discount === 0 && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-sm font-bold text-gray-900">
                Totale: €{totalPrice.toFixed(2)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Conferma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LotteriaBoard: React.FC = () => {
  const { canViewFinancials } = useAdminRole();
  const [soldTickets, setSoldTickets] = useState<Map<number, Ticket>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hoveredTicket, setHoveredTicket] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hideFinancials, setHideFinancials] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [pendingTicketNumbers, setPendingTicketNumbers] = useState<number[] | null>(null);
  const [isBulkSale, setIsBulkSale] = useState(false);

  const fetchSoldTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commercial_operation_tickets')
        .select('*')
        .order('ticket_number', { ascending: true });

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      const ticketMap = new Map<number, Ticket>();
      data?.forEach((ticket) => {
        ticketMap.set(ticket.ticket_number, ticket);
      });

      setSoldTickets(ticketMap);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Errore nel caricamento dei biglietti. Controlla i permessi del database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoldTickets();
  }, []);

  // Calculate discounted price based on quantity
  const calculateTotalPrice = (qty: number): number => {
    if (qty < 10) {
      return qty * 25;
    } else if (qty >= 10 && qty < 100) {
      return qty * 22;
    } else if (qty === 100) {
      return 1999;
    } else {
      return qty * 20;
    }
  };

  const handleBulkManualSale = async (ticketNumbers: number[], email: string, fullName: string, phone: string, paymentMethod: string = 'Contanti') => {
    try {
      setGeneratingPdf(true);
      let successCount = 0;
      let failedTickets: number[] = [];

      // Calculate total discounted price for all tickets
      const totalPrice = calculateTotalPrice(ticketNumbers.length);
      const pricePerTicket = Math.round((totalPrice / ticketNumbers.length) * 100); // in cents

      for (const ticketNumber of ticketNumbers) {
        try {
          // Check ticket is still available
          const { data: existingTicket } = await supabase
            .from('commercial_operation_tickets')
            .select('ticket_number')
            .eq('ticket_number', ticketNumber)
            .single();

          if (existingTicket) {
            failedTickets.push(ticketNumber);
            continue;
          }

          const uuid = generateTicketUuid(ticketNumber);

          const { error } = await supabase
            .from('commercial_operation_tickets')
            .insert([{
              uuid: uuid,
              ticket_number: ticketNumber,
              email,
              full_name: fullName,
              customer_phone: phone,
              payment_intent_id: `manual_bulk_${paymentMethod}_${Date.now()}_${ticketNumber}`,
              amount_paid: pricePerTicket, // Discounted price per ticket
              currency: 'eur',
              purchase_date: new Date().toISOString(),
              quantity: 1,
              payment_method: paymentMethod
            }]);

          if (error) {
            if (error.code === '23505') {
              failedTickets.push(ticketNumber);
            } else {
              throw error;
            }
          } else {
            successCount++;

            // Generate and send PDF for this ticket
            try {
              await fetch('https://dr7empire.com/.netlify/functions/send-manual-ticket-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ticketNumber,
                  email,
                  fullName,
                  phone
                })
              });
            } catch (pdfError) {
              console.error(`Error sending PDF for ticket ${ticketNumber}:`, pdfError);
            }
          }
        } catch (error) {
          console.error(`Error processing ticket ${ticketNumber}:`, error);
          failedTickets.push(ticketNumber);
        }
      }

      setGeneratingPdf(false);

      // Send WhatsApp notification for successfully sold tickets
      let whatsappResult: { success: boolean; error?: string } = { success: true };
      if (successCount > 0) {
        const soldTicketNumbers = ticketNumbers.filter(n => !failedTickets.includes(n));
        whatsappResult = await sendWhatsAppNotification(soldTicketNumbers, fullName, email, phone);
        if (!whatsappResult.success) {
          console.warn('[WhatsApp] Failed to send notification:', whatsappResult.error);
        }
      }

      // Build alert message
      let message = '';
      if (successCount > 0 && failedTickets.length === 0) {
        message = `${successCount} biglietti venduti con successo!\n\nPDF inviati a: ${email}`;
      } else if (successCount > 0 && failedTickets.length > 0) {
        message = `${successCount} biglietti venduti.\n\n${failedTickets.length} biglietti già venduti:\n${failedTickets.map(n => '#' + String(n).padStart(4, '0')).join(', ')}`;
      } else {
        message = `Nessun biglietto venduto. Tutti i biglietti selezionati sono già stati venduti.`;
      }

      // Add WhatsApp warning if failed
      if (successCount > 0 && !whatsappResult.success) {
        message += `\n\nATTENZIONE: Notifica WhatsApp NON inviata!\nMotivo: ${whatsappResult.error}`;
      }

      alert(message);

      await fetchSoldTickets();
      setSelectedTicket(null);
      setSelectedTickets([]);
      setMultiSelectMode(false);
    } catch (error: any) {
      setGeneratingPdf(false);
      console.error('Error in bulk sale:', error);
      alert(`Errore: ${error.message || 'Errore durante la vendita multipla.'}`);
      await fetchSoldTickets();
    }
  };

  const handleManualSale = async (ticketNumber: number, email: string, fullName: string, phone: string, paymentMethod: string = 'Contanti') => {
    try {
      // Double-check ticket is still available before attempted sale
      const { data: existingTicket } = await supabase
        .from('commercial_operation_tickets')
        .select('ticket_number')
        .eq('ticket_number', ticketNumber)
        .single();

      if (existingTicket) {
        alert(`Biglietto #${String(ticketNumber).padStart(4, '0')} è già stato venduto!`);
        await fetchSoldTickets(); // Refresh to show current state
        setSelectedTicket(null);
        return;
      }

      const uuid = generateTicketUuid(ticketNumber);

      const { error } = await supabase
        .from('commercial_operation_tickets')
        .insert([{
          uuid: uuid,
          ticket_number: ticketNumber,
          email,
          full_name: fullName,
          customer_phone: phone,
          payment_intent_id: `manual_${paymentMethod}_${Date.now()}`,
          amount_paid: 2500, // 25€ for single ticket
          currency: 'eur',
          purchase_date: new Date().toISOString(),
          quantity: 1,
          payment_method: paymentMethod
        }]);

      if (error) {
        // Check if it's a duplicate key error (ticket was just sold)
        if (error.code === '23505') {
          alert(`Biglietto #${String(ticketNumber).padStart(4, '0')} è appena stato venduto da qualcun altro!`);
          await fetchSoldTickets(); // Refresh to show current state
          setSelectedTicket(null);
          return; // Stop execution here
        } else {
          throw error;
        }
      } else {
        // Successfully inserted ticket, now generate and send PDF
        console.log(`[Lottery] Ticket ${ticketNumber} inserted, generating PDF...`);
        setGeneratingPdf(true);

        // Send WhatsApp notification to admin
        const whatsappResult = await sendWhatsAppNotification([ticketNumber], fullName, email, phone);
        if (!whatsappResult.success) {
          console.warn('[WhatsApp] Failed to send notification:', whatsappResult.error);
        }

        try {
          console.log('[Lottery] Calling PDF generation function...');
          const pdfResponse = await fetch('https://dr7empire.com/.netlify/functions/send-manual-ticket-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketNumber,
              email,
              fullName,
              phone
            })
          });

          console.log('[Lottery] PDF function response status:', pdfResponse.status);
          const pdfResult = await pdfResponse.json();
          console.log('[Lottery] PDF function result:', pdfResult);

          setGeneratingPdf(false);

          // Build success message with WhatsApp warning if needed
          let message = `Biglietto #${String(ticketNumber).padStart(4, '0')} venduto!\n\n`;

          if (pdfResult.success) {
            message += `PDF inviato con successo a:\n${email}`;
          } else {
            message += `PDF non inviato automaticamente.\nMotivo: ${pdfResult.error}\n\nEmail: ${email}`;
          }

          if (!whatsappResult.success) {
            message += `\n\nATTENZIONE: Notifica WhatsApp NON inviata!\nMotivo: ${whatsappResult.error}`;
          }

          alert(message);
        } catch (pdfError: any) {
          setGeneratingPdf(false);
          console.error('Error sending PDF:', pdfError);

          let message = `Biglietto #${String(ticketNumber).padStart(4, '0')} salvato nel sistema.\n\nATTENZIONE: Errore nell'invio del PDF.\nErrore: ${pdfError.message || 'Network error'}\n\nEmail: ${email}`;

          if (!whatsappResult.success) {
            message += `\n\nNotifica WhatsApp NON inviata!\nMotivo: ${whatsappResult.error}`;
          }

          alert(message);
        }
      }

      // Always refresh the board after attempt
      await fetchSoldTickets();
      setSelectedTicket(null);
    } catch (error: any) {
      console.error('Error saving manual sale:', error);
      alert(`Errore: ${error.message || 'Errore durante il salvataggio.'}`);
      await fetchSoldTickets(); // Refresh to show current state
      setSelectedTicket(null);
    }
  };

  const handleTicketClick = (ticketNumber: number) => {
    if (soldTickets.has(ticketNumber)) {
      return; // Can't select sold tickets
    }

    if (multiSelectMode) {
      // Toggle selection in multi-select mode
      setSelectedTickets(prev => {
        if (prev.includes(ticketNumber)) {
          return prev.filter(num => num !== ticketNumber);
        } else {
          return [...prev, ticketNumber];
        }
      });
    } else {
      // Single ticket sale - Open NewClientModal first
      setPendingTicketNumbers([ticketNumber]);
      setIsBulkSale(false);
      setShowNewClientModal(true);
    }
  };

  const handleSearchTickets = async () => {
    if (!searchEmail.trim()) {
      alert('Inserisci un email o nome del cliente');
      return;
    }

    try {
      const searchTerm = searchEmail.trim().toLowerCase();

      // Search by email OR name
      const { data, error } = await supabase
        .from('commercial_operation_tickets')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order('ticket_number', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(`Nessun biglietto trovato per: ${searchEmail}`);
        return;
      }

      setSearchResults(data);
      setShowSearchModal(true);
    } catch (error: any) {
      console.error('Error searching tickets:', error);
      alert(`Errore nella ricerca: ${error.message}`);
    }
  };

  const handleCancelTicket = async (ticketNumber: number, email: string, fullName: string) => {
    if (!confirm(`Sei sicuro di voler cancellare il biglietto #${String(ticketNumber).padStart(4, '0')} di ${fullName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('commercial_operation_tickets')
        .delete()
        .eq('ticket_number', ticketNumber)
        .eq('email', email);

      if (error) throw error;

      alert(`Biglietto #${String(ticketNumber).padStart(4, '0')} cancellato con successo!`);

      // Refresh tickets and search results
      await fetchSoldTickets();
      if (searchResults.length > 0) {
        handleSearchTickets();
      }
    } catch (error: any) {
      console.error('Error canceling ticket:', error);
      alert(`Errore nella cancellazione: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  const totalTickets = 2000;
  const soldCount = soldTickets.size;
  const availableCount = totalTickets - soldCount;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Tabellone LOTTERIA</h2>

        {/* Search Bar */}
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔍 Cerca Cliente per Email o Nome
              </label>
              <input
                type="text"
                placeholder="Inserisci email o nome del cliente..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchTickets()}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-dr7-gold transition-colors"
              />
            </div>
            <button
              onClick={handleSearchTickets}
              className="px-6 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              🔍 Cerca Biglietti
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Cerca un cliente per vedere tutti i suoi biglietti e numeri associati
          </p>
        </div>

        {canViewFinancials && !hideFinancials && (
          <div className="grid gap-4 mb-4 grid-cols-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Totale Biglietti</div>
              <div className="text-2xl font-bold">{totalTickets}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Venduti</div>
              <div className="text-2xl font-bold text-red-600">{soldCount}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Disponibili</div>
              <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Fatturato Totale</div>
              <div className="text-2xl font-bold text-yellow-600">
                €{((soldCount * 2500) / 100).toFixed(2)}
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-white font-medium">Disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-sm text-white font-medium">Venduto</span>
          </div>
          {multiSelectMode && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
              <span className="text-sm text-white font-medium">Selezionato</span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {canViewFinancials && (
              <button
                onClick={() => setHideFinancials(!hideFinancials)}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  hideFinancials
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-black hover:bg-yellow-700'
                }`}
              >
                {hideFinancials ? 'MOSTRA' : 'NASCONDI'}
              </button>
            )}
            <button
              onClick={() => {
                setMultiSelectMode(!multiSelectMode)
                setSelectedTickets([])
              }}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                multiSelectMode
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {multiSelectMode ? '✓ Selezione Multipla ON' : 'Selezione Multipla'}
            </button>
            {multiSelectMode && selectedTickets.length > 0 && (
              <>
                <button
                  onClick={() => setSelectedTickets([])}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Pulisci ({selectedTickets.length})
                </button>
                <button
                  onClick={() => {
                    setPendingTicketNumbers(selectedTickets);
                    setIsBulkSale(true);
                    setShowNewClientModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                >
                  Vendi {selectedTickets.length} Biglietti
                </button>
              </>
            )}
            <button
              onClick={fetchSoldTickets}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-grey-700"
            >
               Aggiorna
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 xl:grid-cols-25 gap-1 relative" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))' }}>
        {Array.from({ length: totalTickets }, (_, i) => i + 1).map((ticketNumber) => {
          const isSold = soldTickets.has(ticketNumber);
          const ticket = soldTickets.get(ticketNumber);
          const isHovered = hoveredTicket === ticketNumber;
          const isSelected = selectedTickets.includes(ticketNumber);

          return (
            <div key={ticketNumber} className="relative">
              <div
                className={`
                  aspect-square flex items-center justify-center text-xs font-semibold rounded cursor-pointer
                  transition-all duration-200 border-2
                  ${isSold
                    ? 'bg-red-500 text-white border-red-700 hover:bg-red-600'
                    : isSelected
                    ? 'bg-blue-600 text-white border-blue-800 scale-105'
                    : 'bg-green-500 text-white border-green-700 hover:bg-green-600 hover:scale-110'
                  }
                `}
                onMouseEnter={() => setHoveredTicket(ticketNumber)}
                onMouseLeave={() => setHoveredTicket(null)}
                onClick={() => handleTicketClick(ticketNumber)}
              >
                {String(ticketNumber).padStart(4, '0')}
              </div>

              {isHovered && ticket && (
                <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black text-white p-3 rounded-lg shadow-lg text-xs">
                  <div className="font-bold mb-1">Biglietto #{String(ticketNumber).padStart(4, '0')}</div>
                  <div><strong>Cliente:</strong> {ticket.full_name}</div>
                  <div><strong>Email:</strong> {ticket.email}</div>
                  {ticket.customer_phone && <div><strong>Telefono:</strong> {ticket.customer_phone}</div>}
                  <div><strong>Data:</strong> {new Date(ticket.purchase_date).toLocaleDateString('it-IT')}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-8 border-transparent border-t-black"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTicket && selectedTicket !== -1 && (
        <ManualSaleModal
          ticketNumber={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onConfirm={(tickets, email, fullName, phone, paymentMethod) => handleManualSale(tickets[0], email, fullName, phone, paymentMethod)}
          onOpenNewClientModal={() => {
            setShowNewClientModal(true);
          }}
        />
      )}

      {selectedTicket === -1 && selectedTickets.length > 0 && (
        <ManualSaleModal
          ticketNumbers={selectedTickets}
          onClose={() => {
            setSelectedTicket(null);
            setSelectedTickets([]);
          }}
          onConfirm={handleBulkManualSale}
          onOpenNewClientModal={() => {
            setShowNewClientModal(true);
          }}
        />
      )}

      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => {
          setShowNewClientModal(false);
          setPendingTicketNumbers(null);
        }}
        onClientCreated={async (clientId) => {
          // Fetch the client data
          const { data, error } = await supabase
            .from('customers_extended')
            .select('*')
            .eq('id', clientId)
            .single();

          if (!error && data) {
            // Extract data based on client type
            let fullName = '';
            const email = data.email || '';
            const phone = data.telefono || '';

            if (data.tipo_cliente === 'persona_fisica') {
              fullName = `${data.nome || ''} ${data.cognome || ''}`.trim();
            } else if (data.tipo_cliente === 'azienda') {
              fullName = data.ragione_sociale || '';
            } else if (data.tipo_cliente === 'pubblica_amministrazione') {
              fullName = data.ente_o_ufficio || '';
            }

            setShowNewClientModal(false);

            // Directly complete the sale with the client data
            if (pendingTicketNumbers) {
              if (isBulkSale) {
                await handleBulkManualSale(pendingTicketNumbers, email, fullName, phone, 'Contanti');
              } else {
                await handleManualSale(pendingTicketNumbers[0], email, fullName, phone, 'Contanti');
              }
            }

            // Reset state
            setPendingTicketNumbers(null);
          }
        }}
      />

      {generatingPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-2">Generazione PDF in corso...</h3>
            <p className="text-gray-600">Invio email al cliente</p>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showSearchModal && searchResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Biglietti Trovati ({searchResults.length})
              </h3>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                  setSearchEmail('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {searchResults.map((ticket) => (
                <div key={ticket.ticket_number} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-blue-600">
                          #{String(ticket.ticket_number).padStart(4, '0')}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          VENDUTO
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Cliente:</strong> {ticket.full_name}</div>
                        <div><strong>Email:</strong> {ticket.email}</div>
                        {ticket.customer_phone && (
                          <div><strong>Telefono:</strong> {ticket.customer_phone}</div>
                        )}
                        <div><strong>Data Acquisto:</strong> {new Date(ticket.purchase_date).toLocaleString('it-IT')}</div>
                        <div className="text-xs text-gray-500">
                          <strong>ID Pagamento:</strong> {ticket.payment_intent_id}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelTicket(ticket.ticket_number, ticket.email, ticket.full_name)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                    >
                      Cancella
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                  setSearchEmail('');
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteriaBoard;
