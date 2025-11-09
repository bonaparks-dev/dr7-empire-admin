import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Input from './Input'
import Select from './Select'
import Button from './Button'

interface Vehicle {
  id: string
  display_name: string
  plate: string | null
  status: 'available' | 'rented' | 'maintenance' | 'retired'
  daily_rate: number
  category: 'exotic' | 'urban' | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export default function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  // const [selectedCategory, setSelectedCategory] = useState<'all' | 'exotic' | 'urban'>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<string>('10')
  const [isAdjusting, setIsAdjusting] = useState(false)

  const [formData, setFormData] = useState({
    display_name: '',
    plate: '',
    status: 'available',
    daily_rate: '0',
    category: 'exotic'
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .neq('status', 'retired')
        .order('display_name')

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const dataToSave = {
        ...formData,
        daily_rate: parseFloat(formData.daily_rate)
      }

      if (editingId) {
        const { error } = await supabase
          .from('vehicles')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([dataToSave])

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadVehicles()
    } catch (error) {
      console.error('Failed to save vehicle:', error)
      alert('Impossibile salvare il veicolo')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo veicolo?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadVehicles()
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
      alert('Impossibile eliminare il veicolo')
    }
  }

  function resetForm() {
    setFormData({
      display_name: '',
      plate: '',
      status: 'available',
      daily_rate: '0',
      category: 'exotic'
    })
  }

  function handleEdit(vehicle: Vehicle) {
    setFormData({
      display_name: vehicle.display_name,
      plate: vehicle.plate || '',
      status: vehicle.status,
      daily_rate: vehicle.daily_rate.toString(),
      category: vehicle.category || 'exotic'
    })
    setEditingId(vehicle.id)
    setShowForm(true)
  }

  async function handlePriceAdjustment(increase: boolean) {
    const percentage = parseFloat(adjustmentPercentage)
    if (isNaN(percentage) || percentage <= 0) {
      alert('Inserisci una percentuale valida')
      return
    }

    const vehicleName = selectedVehicle === 'all' ? 'tutti i veicoli' : vehicles.find(v => v.id === selectedVehicle)?.display_name
    if (!confirm(`Sei sicuro di voler ${increase ? 'aumentare' : 'diminuire'} i prezzi del ${percentage}% per ${vehicleName}?`)) {
      return
    }

    setIsAdjusting(true)
    try {
      // Determine which vehicles to update
      let vehiclesToUpdate: Vehicle[] = []
      if (selectedVehicle === 'all') {
        vehiclesToUpdate = vehicles
      } else {
        const vehicle = vehicles.find(v => v.id === selectedVehicle)
        if (vehicle) vehiclesToUpdate = [vehicle]
      }

      // Update each vehicle's price
      const updates = vehiclesToUpdate.map(async (vehicle) => {
        const adjustment = increase ? (1 + percentage / 100) : (1 - percentage / 100)
        const newRate = Math.round(vehicle.daily_rate * adjustment)

        const { error } = await supabase
          .from('vehicles')
          .update({ daily_rate: newRate })
          .eq('id', vehicle.id)

        if (error) throw error
        return { id: vehicle.id, newRate }
      })

      await Promise.all(updates)

      // Reload vehicles
      await loadVehicles()

      alert(`Prezzi ${increase ? 'aumentati' : 'diminuiti'} con successo!`)
    } catch (error) {
      console.error('Failed to adjust prices:', error)
      alert('Errore nell\'aggiornamento dei prezzi')
    } finally {
      setIsAdjusting(false)
    }
  }

  // Separate vehicles by category
  const exoticVehicles = vehicles.filter(v => v.category === 'exotic')
  const urbanVehicles = vehicles.filter(v => v.category === 'urban')

  const exoticCount = exoticVehicles.length
  const urbanCount = urbanVehicles.length

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Caricamento...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Veicoli</h2>
          <p className="text-sm text-gray-400 mt-1">
            Exotic Supercars: {exoticCount} | Urban: {urbanCount} | Totale: {vehicles.length}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}>
          + Nuovo Veicolo
        </Button>
      </div>

      {/* Price Adjustment Section - Compact */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Veicolo</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">Tutti i veicoli ({vehicles.length})</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.display_name} (€{vehicle.daily_rate})
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block text-xs text-gray-400 mb-1">Percentuale</label>
            <input
              type="number"
              value={adjustmentPercentage}
              onChange={(e) => setAdjustmentPercentage(e.target.value)}
              min="1"
              max="100"
              className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-2 text-white text-sm"
              placeholder="10"
            />
          </div>

          <button
            onClick={() => handlePriceAdjustment(true)}
            disabled={isAdjusting}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Aumenta
          </button>

          <button
            onClick={() => handlePriceAdjustment(false)}
            disabled={isAdjusting}
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            - Diminuisci
          </button>
        </div>

        {isAdjusting && (
          <div className="mt-3 text-center text-sm text-gray-400">
            <p>Aggiornamento prezzi in corso...</p>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingId ? 'Modifica Veicolo' : 'Nuovo Veicolo'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              required
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
            <Input
              label="Targa"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
            />
            <Select
              label="Categoria"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'exotic', label: 'Exotic Supercars' },
                { value: 'urban', label: 'Urban' }
              ]}
            />
            <Select
              label="Stato"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'available', label: 'Disponibile' },
                { value: 'rented', label: 'Noleggiato' },
                { value: 'maintenance', label: 'Manutenzione' }
              ]}
            />
            <Input
              label="Tariffa Giornaliera (€)"
              type="number"
              step="0.01"
              required
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
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

      {/* Two Column Layout: Urban and Exotic */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Urban Vehicles Column */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-cyan-900/30 px-4 py-3 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="px-3 py-1 bg-cyan-900 text-cyan-200 rounded text-sm">Urban</span>
              <span className="text-sm text-gray-400">({urbanCount} veicoli)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Targa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Stato</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Tariffa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {urbanVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-white font-semibold">{vehicle.display_name}</td>
                    <td className="px-4 py-3 text-sm text-white">{vehicle.plate || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.status === 'available' ? 'bg-green-900 text-green-200' :
                        vehicle.status === 'rented' ? 'bg-blue-900 text-blue-200' :
                        vehicle.status === 'maintenance' ? 'bg-yellow-900 text-yellow-200' :
                        'bg-gray-700 text-gray-200'
                      }`}>
                        {vehicle.status === 'available' ? 'Disponibile' :
                         vehicle.status === 'rented' ? 'Noleggiato' :
                         vehicle.status === 'maintenance' ? 'Manutenzione' : 'Ritirato'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">€{vehicle.daily_rate}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(vehicle)}
                          variant="secondary"
                          className="text-xs py-1 px-3"
                        >
                          Modifica
                        </Button>
                        <Button
                          onClick={() => handleDelete(vehicle.id)}
                          variant="secondary"
                          className="text-xs py-1 px-3 bg-red-900 hover:bg-red-800"
                        >
                          Elimina
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {urbanVehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nessun veicolo Urban trovato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exotic Vehicles Column */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-purple-900/30 px-4 py-3 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded text-sm">Exotic Supercars</span>
              <span className="text-sm text-gray-400">({exoticCount} veicoli)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Targa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Stato</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Tariffa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {exoticVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-white font-semibold">{vehicle.display_name}</td>
                    <td className="px-4 py-3 text-sm text-white">{vehicle.plate || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.status === 'available' ? 'bg-green-900 text-green-200' :
                        vehicle.status === 'rented' ? 'bg-blue-900 text-blue-200' :
                        vehicle.status === 'maintenance' ? 'bg-yellow-900 text-yellow-200' :
                        'bg-gray-700 text-gray-200'
                      }`}>
                        {vehicle.status === 'available' ? 'Disponibile' :
                         vehicle.status === 'rented' ? 'Noleggiato' :
                         vehicle.status === 'maintenance' ? 'Manutenzione' : 'Ritirato'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">€{vehicle.daily_rate}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(vehicle)}
                          variant="secondary"
                          className="text-xs py-1 px-3"
                        >
                          Modifica
                        </Button>
                        <Button
                          onClick={() => handleDelete(vehicle.id)}
                          variant="secondary"
                          className="text-xs py-1 px-3 bg-red-900 hover:bg-red-800"
                        >
                          Elimina
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exoticVehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nessun veicolo Exotic trovato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
