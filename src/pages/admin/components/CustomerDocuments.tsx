import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import Button from './Button'

interface CustomerDocumentsProps {
  customerId: string
  customerName: string
  onClose: () => void
}

interface CustomerDocument {
  id: string
  customer_id: string
  document_type: 'drivers_license' | 'identity_document'
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  bucket_id: string
  uploaded_at: string
}

const DRIVERS_LICENSE_BUCKET = 'driver-licenses'
const IDENTITY_DOCS_BUCKET = 'customer-documents'

export default function CustomerDocuments({ customerId, customerName, onClose }: CustomerDocumentsProps) {
  const [documents, setDocuments] = useState<CustomerDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({
    drivers_license: null,
    identity_document: null
  })
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string | null }>({})

  useEffect(() => {
    loadDocuments()
  }, [customerId])

  async function loadDocuments() {
    setLoading(true)
    try {
      // Load document metadata from database
      const { data, error } = await supabase
        .from('customer_documents')
        .select('*')
        .eq('customer_id', customerId)

      if (error) throw error

      setDocuments(data || [])

      // Load preview URLs for existing documents
      if (data && data.length > 0) {
        const urls: { [key: string]: string | null } = {}
        for (const doc of data) {
          const { data: urlData } = await supabase.storage
            .from(doc.bucket_id)
            .createSignedUrl(doc.file_path, 3600)

          urls[doc.document_type] = urlData?.signedUrl || null
        }
        setPreviewUrls(urls)
      }
    } catch (error: any) {
      console.error('Error loading documents:', error)
      alert(`Errore nel caricamento documenti: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(documentType: 'drivers_license' | 'identity_document') {
    const file = selectedFiles[documentType]
    if (!file) {
      alert('Seleziona un file da caricare')
      return
    }

    setUploading({ ...uploading, [documentType]: true })
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user || authError) {
        alert('ERRORE: Non sei autenticato. Effettua il login e riprova.')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${documentType}_${Date.now()}.${fileExt}`
      const filePath = `${customerId}/${fileName}`

      // Select correct bucket based on document type
      const bucket = documentType === 'drivers_license' ? DRIVERS_LICENSE_BUCKET : IDENTITY_DOCS_BUCKET

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Check if document already exists for this type
      const existingDoc = documents.find(d => d.document_type === documentType)

      if (existingDoc) {
        // Update existing document
        const { error: updateError } = await supabase
          .from('customer_documents')
          .update({
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            bucket_id: bucket,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDoc.id)

        if (updateError) throw updateError

        // Delete old file from storage
        if (existingDoc.file_path !== filePath) {
          await supabase.storage
            .from(existingDoc.bucket_id)
            .remove([existingDoc.file_path])
        }
      } else {
        // Insert new document record
        const { error: insertError } = await supabase
          .from('customer_documents')
          .insert({
            customer_id: customerId,
            document_type: documentType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            bucket_id: bucket,
            uploaded_by: user.id
          })

        if (insertError) throw insertError
      }

      alert('Documento caricato con successo!')
      setSelectedFiles({ ...selectedFiles, [documentType]: null })
      await loadDocuments()
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`ERRORE nel caricamento: ${error.message}`)
    } finally {
      setUploading({ ...uploading, [documentType]: false })
    }
  }

  async function handleDelete(documentId: string, filePath: string, bucketId: string) {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) {
      return
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketId)
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('customer_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      alert('Documento eliminato')
      await loadDocuments()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      alert(`ERRORE nell'eliminazione: ${error.message}`)
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'drivers_license':
        return 'Patente di Guida'
      case 'identity_document':
        return 'Documento di Identità'
      default:
        return type
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  const getDocument = (type: 'drivers_license' | 'identity_document') => {
    return documents.find(d => d.document_type === type)
  }

  const renderDocumentSection = (
    type: 'drivers_license' | 'identity_document',
    label: string,
    description: string
  ) => {
    const doc = getDocument(type)
    const previewUrl = previewUrls[type]
    const isUploading = uploading[type]
    const selectedFile = selectedFiles[type]

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-dr7-gold">{label}</h4>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          {doc && (
            <span className="px-3 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded">
              Caricato
            </span>
          )}
        </div>

        {/* Existing Document Preview */}
        {doc && previewUrl && (
          <div className="mb-4 bg-gray-900 border border-gray-600 rounded-lg p-4">
            <div className="flex gap-4">
              {/* Preview */}
              {isImage(doc.mime_type) ? (
                <div className="w-32 h-32 flex-shrink-0 bg-gray-950 rounded overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 flex-shrink-0 bg-gray-950 rounded flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">{doc.mime_type.split('/')[1].toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate mb-1">{doc.file_name}</p>
                <p className="text-xs text-gray-400 mb-2">
                  {formatFileSize(doc.file_size)} • Caricato il{' '}
                  {new Date(doc.uploaded_at).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Visualizza
                  </a>
                  <a
                    href={previewUrl}
                    download={doc.file_name}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Scarica
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_path, doc.bucket_id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload New/Replace Document */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {doc ? 'Sostituisci Documento' : 'Carica Documento'}
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFiles({ ...selectedFiles, [type]: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm
                file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                file:text-sm file:font-semibold file:bg-dr7-gold file:text-black
                hover:file:bg-yellow-500 file:cursor-pointer"
              accept="image/*,.pdf"
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-xs text-gray-400 mt-2">
                File selezionato: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
          <Button
            onClick={() => handleUpload(type)}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Caricamento...' : doc ? 'Sostituisci' : 'Carica'}
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-white">Caricamento documenti...</p>
        </div>
      </div>
    )
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
          {/* Info Box */}
          <div className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 text-2xl">ℹ️</div>
              <div className="flex-1">
                <h4 className="text-blue-300 font-semibold mb-2">Carica i Documenti del Cliente</h4>
                <div className="space-y-1 text-sm text-blue-200">
                  <p>Carica la patente di guida e il documento di identità (carta d'identità o passaporto) del cliente.</p>
                  <p className="text-xs mt-2 text-blue-300">Formati supportati: JPG, PNG, PDF • Massimo 50MB per file</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver's License Section */}
          {renderDocumentSection(
            'drivers_license',
            'Patente di Guida',
            'Carica la patente di guida del cliente'
          )}

          {/* Identity Document Section */}
          {renderDocumentSection(
            'identity_document',
            'Documento di Identità',
            'Carica carta d\'identità o passaporto del cliente'
          )}

          {/* Storage Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-white mb-2">Informazioni Storage</h5>
            <div className="space-y-1">
              <p className="text-xs text-gray-400">
                <strong>Buckets:</strong> <code className="bg-gray-700 px-2 py-0.5 rounded mr-1">{DRIVERS_LICENSE_BUCKET}</code>
                <code className="bg-gray-700 px-2 py-0.5 rounded">{IDENTITY_DOCS_BUCKET}</code>
              </p>
              <p className="text-xs text-gray-400">
                <strong>Path:</strong> <code className="bg-gray-700 px-2 py-0.5 rounded">{customerId}/</code>
              </p>
              <p className="text-xs text-gray-400">
                <strong>Formati supportati:</strong> Immagini (JPG, PNG), PDF
              </p>
              <p className="text-xs text-gray-400">
                <strong>Documenti caricati:</strong> {documents.length}/2
              </p>
            </div>
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
