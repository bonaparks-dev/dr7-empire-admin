import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import ReservationsTab from './components/ReservationsTab'
import CustomersTab from './components/CustomersTab'
import VehiclesTab from './components/VehiclesTab'
import FatturaTab from './components/FatturaTab'
import CalendarTab from './components/CalendarTab'
import CarWashTab from './components/CarWashTab'
import LotteriaBoard from './components/LotteriaBoard'

type TabType = 'reservations' | 'customers' | 'vehicles' | 'fattura' | 'lotteria' | 'calendar' | 'carwash'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('reservations')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white p-2 hover:bg-gray-800 rounded transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <img src="/DR7logo.png" alt="DR7 Empire" className="h-8 sm:h-10" />
              <h1 className="text-lg sm:text-2xl font-bold text-white">Pannello Admin</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-75" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-gray-900 w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-white font-semibold">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-2">
              {[
                { id: 'reservations', label: 'Prenotazioni', icon: '📋' },
                { id: 'customers', label: 'Clienti', icon: '👥' },
                { id: 'vehicles', label: 'Veicoli', icon: '🚗' },
                { id: 'fattura', label: 'Fatture', icon: '📄' },
                { id: 'lotteria', label: 'Biglietti Lotteria', icon: '🎰' },
                { id: 'calendar', label: 'Calendario', icon: '📅' },
                { id: 'carwash', label: 'Autolavaggio', icon: '🚿' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-dr7-gold text-black font-semibold'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Tabs - Hidden on Mobile */}
        <div className="mb-6 hidden lg:block">
          <div className="border-b border-gray-800">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reservations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reservations'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                📋 Prenotazioni
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'customers'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                👥 Clienti
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'vehicles'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                🚗 Veicoli
              </button>
              <button
                onClick={() => setActiveTab('fattura')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'fattura'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                📄 Fatture
              </button>
              <button
                onClick={() => setActiveTab('lotteria')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'lotteria'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                🎰 Biglietti Lotteria
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'calendar'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                📅 Calendario
              </button>
              <button
                onClick={() => setActiveTab('carwash')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'carwash'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                🚿 Autolavaggio
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Tab Indicator */}
        <div className="mb-4 lg:hidden">
          <h2 className="text-xl font-bold text-white">
            {activeTab === 'reservations' && '📋 Prenotazioni'}
            {activeTab === 'customers' && '👥 Clienti'}
            {activeTab === 'vehicles' && '🚗 Veicoli'}
            {activeTab === 'fattura' && '📄 Fatture'}
            {activeTab === 'lotteria' && '🎰 Biglietti Lotteria'}
            {activeTab === 'calendar' && '📅 Calendario'}
            {activeTab === 'carwash' && '🚿 Autolavaggio'}
          </h2>
        </div>

        <div className="mt-8">
          {activeTab === 'reservations' && <ReservationsTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'vehicles' && <VehiclesTab />}
          {activeTab === 'fattura' && <FatturaTab />}
          {activeTab === 'lotteria' && <LotteriaBoard />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'carwash' && <CarWashTab />}
        </div>
      </main>
    </div>
  )
}
