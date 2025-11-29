import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Button from './Button'

interface CustomerDocumentsProps {
  customerId: string
  customerName: string
  onClose: () => void
}

interface Document {
  name: string
  created_at: string
  size: number
  url: string | null
}

// Configure your storage bucket here
const DOCUMENTS_BUCKET = 'customer-documents' // Change this to your bucket name

export default function CustomerDocuments({ customerId, customerName, onClose }: CustomerDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [customerId])

  async function loadDocuments() {
    setLoading(true)
    try {
      // List all documents for this customer
      const { data: files, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .list(customerId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Error listing documents:', error)
        throw error
      }

      // Get signed URLs for each document
      const documentsWithUrls = await Promise.all(
        (files || []).map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from(DOCUMENTS_BUCKET)
            .createSignedUrl(`${customerId}/${file.name}`, 3600) // 1 hour expiry

          return {
            name: file.name,
            created_at: file.created_at || new Date().toISOString(),
            size: file.metadata?.size || 0,
            url: urlData?.signedUrl || null
          }
        })
      )

      setDocuments(documentsWithUrls)
    } catch (error: any) {
      console.error('Failed to load documents:', error)
      alert(`Errore nel caricamento documenti: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert('Seleziona un file da caricare')
      return
    }

    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${customerId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      alert('✅ Documento caricato con successo!')
      setSelectedFile(null)
      await loadDocuments()
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`❌ Errore nel caricamento: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`Sei sicuro di voler eliminare "${fileName}"?`)) {
      return
    }

    try {
      const { error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .remove([`${customerId}/${fileName}`])

      if (error) throw error

      alert('✅ Documento eliminato')
      await loadDocuments()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      alert(`❌ Errore nell'eliminazione: ${error.message}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'zip':
      case 'rar':
        return '📦'
      default:
        return '📎'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Documenti Cliente</h3>
            <p className="text-sm text-gray-400 mt-1">{customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-dr7-gold mb-4">📤 Carica Nuovo Documento</h4>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seleziona File
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm
                    file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                    file:text-sm file:font-semibold file:bg-dr7-gold file:text-black
                    hover:file:bg-yellow-500 file:cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  disabled={uploading}
                />
                {selectedFile && (
                  <p className="text-xs text-gray-400 mt-2">
                    File selezionato: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Caricamento...' : 'Carica'}
              </Button>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-dr7-gold mb-4">
              📁 Documenti Caricati ({documents.length})
            </h4>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Caricamento...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>📭 Nessun documento caricato</p>
                <p className="text-sm mt-2">Carica il primo documento usando il form sopra</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFileIcon(doc.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {doc.url && (
                        <>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            👁️ Visualizza
                          </a>
                          <a
                            href={doc.url}
                            download={doc.name}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            ⬇️ Scarica
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(doc.name)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        🗑️ Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400">
              💾 <strong>Bucket Storage:</strong> {DOCUMENTS_BUCKET}/{customerId}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              📌 <strong>Formati supportati:</strong> PDF, Immagini (JPG, PNG, GIF), Word, Excel, ZIP
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
