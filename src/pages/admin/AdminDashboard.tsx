import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import ReservationsTab from './components/ReservationsTab'
import CustomersTab from './components/CustomersTab'
import VehiclesTab from './components/VehiclesTab'
import FatturaTab from './components/FatturaTab'
import TicketsTab from './components/TicketsTab'
import AviationQuotesTab from './components/AviationQuotesTab'

type TabType = 'reservations' | 'customers' | 'vehicles' | 'fattura' | 'tickets' | 'aviation'

const tabs = [
  { id: 'reservations' as TabType, label: 'Prenotazioni', icon: '📅' },
  { id: 'customers' as TabType, label: 'Clienti', icon: '👥' },
  { id: 'vehicles' as TabType, label: 'Veicoli', icon: '🚗' },
  { id: 'fattura' as TabType, label: 'Fatture', icon: '📄' },
  { id: 'tickets' as TabType, label: 'Biglietti', icon: '🎫' },
  { id: 'aviation' as TabType, label: 'Elicotteri/Jet', icon: '🚁' }
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('reservations')
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-black pb-20 lg:pb-0">
      {/* Mobile-optimized header */}
      <header className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/DR7logo1.png" alt="DR7 Empire" className="h-8 sm:h-10" />
              <h1 className="text-lg sm:text-xl font-bold text-white hidden sm:block">Admin Panel</h1>
              <h1 className="text-lg font-bold text-white sm:hidden">DR7</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <span className="hidden sm:inline">Esci</span>
              <span className="sm:hidden">🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden lg:block bg-gray-900 border-b border-gray-800 sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm transition-all relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'reservations' && <ReservationsTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'fattura' && <FatturaTab />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'aviation' && <AviationQuotesTab />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                activeTab === tab.id
                  ? 'text-white bg-gray-800'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
