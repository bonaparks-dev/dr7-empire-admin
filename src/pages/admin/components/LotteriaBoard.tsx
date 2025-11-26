import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

interface Ticket {
  ticket_number: number;
  email: string;
  full_name: string;
  purchase_date: string;
  payment_intent_id: string;
}

interface ManualSaleModalProps {
  ticketNumber: number;
  onClose: () => void;
  onConfirm: (ticketNumber: number, email: string, fullName: string) => void;
}

const ManualSaleModal: React.FC<ManualSaleModalProps> = ({ ticketNumber, onClose, onConfirm }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && fullName) {
      onConfirm(ticketNumber, email, fullName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-4">Vendita Manuale - Biglietto #{String(ticketNumber).padStart(4, '0')}</h3>
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
  const [soldTickets, setSoldTickets] = useState<Map<number, Ticket>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hoveredTicket, setHoveredTicket] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);

  const fetchSoldTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commercial_operation_tickets')
        .select('ticket_number, email, full_name, purchase_date, payment_intent_id')
        .order('ticket_number', { ascending: true });

      if (error) throw error;

      const ticketMap = new Map<number, Ticket>();
      data?.forEach((ticket) => {
        ticketMap.set(ticket.ticket_number, ticket);
      });

      setSoldTickets(ticketMap);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoldTickets();
  }, []);

  const handleManualSale = async (ticketNumber: number, email: string, fullName: string) => {
    try {
      const { error } = await supabase
        .from('commercial_operation_tickets')
        .insert([{
          ticket_number: ticketNumber,
          email,
          full_name: fullName,
          payment_intent_id: `manual_${Date.now()}`,
          amount_paid: 2500, // 25€
          currency: 'eur',
          purchase_date: new Date().toISOString(),
          quantity: 1
        }]);

      if (error) throw error;

      // Refresh the board
      await fetchSoldTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error saving manual sale:', error);
      alert('Errore durante il salvataggio. Il biglietto potrebbe essere già venduto.');
    }
  };

  const handleTicketClick = (ticketNumber: number) => {
    if (!soldTickets.has(ticketNumber)) {
      setSelectedTicket(ticketNumber);
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
        <div className="grid grid-cols-3 gap-4 mb-4">
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
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm">Disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-sm">Venduto</span>
          </div>
          <button
            onClick={fetchSoldTickets}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>

      <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 xl:grid-cols-25 gap-1 relative" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))' }}>
        {Array.from({ length: totalTickets }, (_, i) => i + 1).map((ticketNumber) => {
          const isSold = soldTickets.has(ticketNumber);
          const ticket = soldTickets.get(ticketNumber);
          const isHovered = hoveredTicket === ticketNumber;

          return (
            <div key={ticketNumber} className="relative">
              <div
                className={`
                  aspect-square flex items-center justify-center text-xs font-semibold rounded cursor-pointer
                  transition-all duration-200 border-2
                  ${isSold
                    ? 'bg-red-500 text-white border-red-700 hover:bg-red-600'
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

      {selectedTicket && (
        <ManualSaleModal
          ticketNumber={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onConfirm={handleManualSale}
        />
      )}
    </div>
  );
};

export default LotteriaBoard;
