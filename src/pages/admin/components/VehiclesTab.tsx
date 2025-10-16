import { useState, useEffect } from 'react'
import Input from './Input'
import Select from './Select'
import Button from './Button'

interface Vehicle {
  id: string
  display_name: string
  plate: string | null
  status: 'available' | 'rented' | 'maintenance' | 'retired'
  daily_rate: number
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

const API_BASE = '/.netlify/functions/admin'
const API_TOKEN = import.meta.env.VITE_ADMIN_UI_TOKEN

export default function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: '',
    plate: '',
    status: 'available',
    daily_rate: '0'
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/vehicles`, {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      })
      const data = await res.json()
      setVehicles(data.data || [])
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId
        ? { id: editingId, ...formData, daily_rate: parseFloat(formData.daily_rate) }
        : { ...formData, daily_rate: parseFloat(formData.daily_rate) }

      const res = await fetch(`${API_BASE}/vehicles`, {
        method,
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save vehicle')

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadVehicles()
    } catch (error) {
      console.error('Failed to save vehicle:', error)
      alert('Failed to save vehicle')
    }
  }

  function resetForm() {
    setFormData({
      display_name: '',
      plate: '',
      status: 'available',
      daily_rate: '0'
    })
  }

  function handleEdit(vehicle: Vehicle) {
    setFormData({
      display_name: vehicle.display_name,
      plate: vehicle.plate || '',
      status: vehicle.status,
      daily_rate: vehicle.daily_rate.toString()
    })
    setEditingId(vehicle.id)
    setShowForm(true)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-dr7-gold">Vehicles</h2>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}>
          + New Vehicle
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dr7-dark p-6 rounded-lg mb-6 border border-gray-800">
          <h3 className="text-xl font-semibold text-dr7-gold mb-4">
            {editingId ? 'Edit Vehicle' : 'New Vehicle'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              required
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
            <Input
              label="Plate"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
            />
            <Select
              label="Status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'available', label: 'Available' },
                { value: 'rented', label: 'Rented' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'retired', label: 'Retired' }
              ]}
            />
            <Input
              label="Daily Rate"
              type="number"
              step="0.01"
              required
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="bg-dr7-dark rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dr7-darker">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Plate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Daily Rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-gray-800 hover:bg-dr7-darker/50">
                  <td className="px-4 py-3 text-sm">{vehicle.display_name}</td>
                  <td className="px-4 py-3 text-sm">{vehicle.plate || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vehicle.status === 'available' ? 'bg-green-900 text-green-300' :
                      vehicle.status === 'rented' ? 'bg-blue-900 text-blue-300' :
                      vehicle.status === 'maintenance' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">${vehicle.daily_rate}</td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      onClick={() => handleEdit(vehicle)}
                      variant="secondary"
                      className="text-xs py-1 px-3"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No vehicles found
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
