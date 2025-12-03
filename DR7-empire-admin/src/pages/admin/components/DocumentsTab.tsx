import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

interface CustomerDocument {
  id: string
  user_id: string
  bucket: string
  file_name: string
  file_path: string
  uploaded_at: string
  customer_name?: string
  customer_email?: string
}

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<CustomerDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<string>('all')

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    try {
      const allDocs: CustomerDocument[] = []
      const buckets = ['carta-identita', 'codice-fiscale', 'driver-licenses']

      for (const bucket of buckets) {
        // List all files in the bucket
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list('', {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (listError) {
          console.error(`Error listing ${bucket}:`, listError)
          continue
        }

        if (files) {
          // For each file, try to get user info
          for (const file of files) {
            if (file.name === '.emptyFolderPlaceholder') continue

            // Extract user_id from path (format: user_id/filename)
            const pathParts = file.name.split('/')
            const userId = pathParts.length > 1 ? pathParts[0] : null

            let customerName = 'Unknown'
            let customerEmail = 'Unknown'

            if (userId) {
              // Fetch user details from customers_extended table
              const { data: customer } = await supabase
                .from('customers_extended')
                .select('nome, cognome, denominazione, email')
                .eq('user_id', userId)
                .single()

              if (customer) {
                customerName = customer.denominazione || `${customer.nome || ''} ${customer.cognome || ''}`.trim() || 'Unknown'
                customerEmail = customer.email || 'Unknown'
              }
            }

            allDocs.push({
              id: file.id || file.name,
              user_id: userId || 'unknown',
              bucket,
              file_name: file.name,
              file_path: file.name,
              uploaded_at: file.created_at || '',
              customer_name: customerName,
              customer_email: customerEmail,
            })
          }
        }
      }

      setDocuments(allDocs)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function viewDocument(doc: CustomerDocument) {
    try {
      const { data, error } = await supabase.storage
        .from(doc.bucket)
        .createSignedUrl(doc.file_path, 3600)

      if (error) throw error

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      alert('Errore nell\'apertura del documento')
    }
  }

  async function downloadDocument(doc: CustomerDocument) {
    try {
      const { data, error } = await supabase.storage
        .from(doc.bucket)
        .download(doc.file_path)

      if (error) throw error

      if (data) {
        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Errore nel download del documento')
    }
  }

  function getBucketLabel(bucket: string) {
    const labels: { [key: string]: string } = {
      'carta-identita': 'Carta d\'Identità',
      'codice-fiscale': 'Codice Fiscale',
      'driver-licenses': 'Patente'
    }
    return labels[bucket] || bucket
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesBucket = selectedBucket === 'all' || doc.bucket === selectedBucket

    return matchesSearch && matchesBucket
  })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Caricamento documenti...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cerca Cliente
            </label>
            <input
              type="text"
              placeholder="Nome, email o nome file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo Documento
            </label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
            >
              <option value="all">Tutti i documenti</option>
              <option value="carta-identita">Carta d'Identità</option>
              <option value="codice-fiscale">Codice Fiscale</option>
              <option value="driver-licenses">Patente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Totale Documenti</div>
          <div className="text-2xl font-bold text-white">{documents.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Carte d'Identità</div>
          <div className="text-2xl font-bold text-white">
            {documents.filter(d => d.bucket === 'carta-identita').length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Codici Fiscali</div>
          <div className="text-2xl font-bold text-white">
            {documents.filter(d => d.bucket === 'codice-fiscale').length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Patenti</div>
          <div className="text-2xl font-bold text-white">
            {documents.filter(d => d.bucket === 'driver-licenses').length}
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tipo Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nome File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data Caricamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Nessun documento trovato
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{doc.customer_name}</div>
                      <div className="text-sm text-gray-400">{doc.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded-full">
                        {getBucketLabel(doc.bucket)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="max-w-xs truncate">{doc.file_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {doc.uploaded_at
                        ? new Date(doc.uploaded_at).toLocaleString('it-IT')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDocument(doc)}
                          className="px-3 py-1 bg-white text-black text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Visualizza
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                        >
                          Scarica
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
