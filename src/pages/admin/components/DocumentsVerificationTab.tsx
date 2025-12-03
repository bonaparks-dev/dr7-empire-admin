import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

interface UserDocument {
  id: string
  user_id: string
  document_type: string
  file_path: string
  upload_date: string
  status: 'pending_verification' | 'verified' | 'rejected'
  verified_at?: string
  verified_by?: string
  rejection_reason?: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export default function DocumentsVerificationTab() {
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_verification' | 'verified' | 'rejected'>('all')
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null)
  const [showDocModal, setShowDocModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadDocuments()

    // Real-time subscription
    const subscription = supabase
      .channel('documents-verification-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_documents' },
        () => loadDocuments()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadDocuments() {
    setLoading(true)
    try {
      // First, get all documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('user_documents')
        .select('*')
        .order('upload_date', { ascending: false })

      if (documentsError) throw documentsError

      // Then fetch user data for each unique user_id
      const uniqueUserIds = [...new Set((documentsData || []).map(doc => doc.user_id))]
      const usersMap = new Map()

      for (const userId of uniqueUserIds) {
        try {
          const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

          if (user) {
            const metadata = user.user_metadata || {}
            const createdAt = new Date(user.created_at)
            const now = new Date()
            const daysSinceRegistration = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

            usersMap.set(userId, {
              id: user.id,
              full_name: metadata.full_name || metadata.name || 'Nome non disponibile',
              email: user.email || 'Email non disponibile',
              is_new: daysSinceRegistration <= 7, // New if registered within last 7 days
              created_at: user.created_at
            })
          }
        } catch (e) {
          console.error('Error fetching user:', userId, e)
        }
      }

      // Combine documents with user data
      const documentsWithUsers = (documentsData || []).map(doc => ({
        ...doc,
        user: usersMap.get(doc.user_id) || {
          id: doc.user_id,
          full_name: 'Nome non disponibile',
          email: 'Email non disponibile'
        }
      }))

      setDocuments(documentsWithUsers)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateDocumentStatus(documentId: string, status: 'verified' | 'rejected', reason?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const updateData: any = {
        status,
        verified_at: new Date().toISOString(),
        verified_by: user?.id
      }

      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason
      }

      const { error } = await supabase
        .from('user_documents')
        .update(updateData)
        .eq('id', documentId)

      if (error) throw error

      alert(`Documento ${status === 'verified' ? 'verificato' : 'rifiutato'} con successo!`)
      setShowDocModal(false)
      setSelectedDoc(null)
      setRejectionReason('')
      loadDocuments()
    } catch (error) {
      console.error('Failed to update document status:', error)
      alert('Errore nell\'aggiornamento dello stato del documento')
    }
  }

  async function viewDocument(doc: UserDocument) {
    try {
      const { data } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(doc.file_path, 3600)

      if (data?.signedUrl) {
        setSelectedDoc(doc)
        setShowDocModal(true)
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Failed to get document URL:', error)
      alert('Errore nel caricamento del documento')
    }
  }

  const getDocumentLabel = (docType: string) => {
    const labels: { [key: string]: string } = {
      cartaIdentitaFront: 'CI Fronte',
      cartaIdentitaBack: 'CI Retro',
      codiceFiscaleFront: 'CF Fronte',
      codiceFiscaleBack: 'CF Retro',
      patenteFront: 'Patente Fronte',
      patenteBack: 'Patente Retro'
    }
    return labels[docType] || docType
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_verification: { text: 'Da Verificare', color: 'bg-yellow-600 text-black' },
      verified: { text: 'Verificato', color: 'bg-green-600 text-white' },
      rejected: { text: 'Rifiutato', color: 'bg-red-600 text-white' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { text: status, color: 'bg-gray-600 text-white' }
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const filteredDocuments = filterStatus === 'all'
    ? documents
    : documents.filter(d => d.status === filterStatus)

  // Group documents by user
  const documentsByUser = filteredDocuments.reduce((acc, doc) => {
    const userId = doc.user_id
    if (!acc[userId]) {
      acc[userId] = []
    }
    acc[userId].push(doc)
    return acc
  }, {} as { [key: string]: UserDocument[] })

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Caricamento documenti...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Verifica Documenti Utenti</h2>
            <p className="text-sm text-gray-400 mt-1">
              Gestisci e verifica i documenti caricati dagli utenti
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Totale Documenti</div>
          <div className="text-2xl font-bold text-white">{documents.length}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Da Verificare</div>
          <div className="text-2xl font-bold text-yellow-400">
            {documents.filter(d => d.status === 'pending_verification').length}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Verificati</div>
          <div className="text-2xl font-bold text-green-400">
            {documents.filter(d => d.status === 'verified').length}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">Rifiutati</div>
          <div className="text-2xl font-bold text-red-400">
            {documents.filter(d => d.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tutti ({documents.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_verification')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending_verification'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Da Verificare ({documents.filter(d => d.status === 'pending_verification').length})
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'verified'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Verificati ({documents.filter(d => d.status === 'verified').length})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-dr7-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Rifiutati ({documents.filter(d => d.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Documents by User */}
      <div className="space-y-4">
        {Object.entries(documentsByUser).map(([userId, userDocs]) => {
          const user = userDocs[0].user
          return (
            <div key={userId} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              {/* User Header */}
              <div className="bg-gray-800 p-4 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{user?.full_name || 'Nome non disponibile'}</h3>
                        {(user as any)?.is_new && (
                          <span className="px-2 py-1 text-xs font-bold bg-green-600 text-white rounded">
                            NUOVO CLIENTE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{user?.email || 'Email non disponibile'}</p>
                      {(user as any)?.created_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Registrato: {new Date((user as any).created_at).toLocaleDateString('it-IT')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Documenti: {userDocs.length}</p>
                    <p className="text-xs text-gray-500">User ID: {userId.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>

              {/* User Documents */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userDocs.map((doc) => (
                    <div key={doc.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{getDocumentLabel(doc.document_type)}</h4>
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Caricato: {new Date(doc.upload_date).toLocaleDateString('it-IT')}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-400 mb-3 bg-red-900/20 p-2 rounded">
                          Motivo: {doc.rejection_reason}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDocument(doc)}
                          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Visualizza
                        </button>
                        {doc.status === 'pending_verification' && (
                          <>
                            <button
                              onClick={() => updateDocumentStatus(doc.id, 'verified')}
                              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors"
                            >
                              Verifica
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDoc(doc)
                                setShowDocModal(true)
                              }}
                              className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
                            >
                              Rifiuta
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {Object.keys(documentsByUser).length === 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-500">
              {filterStatus === 'all'
                ? 'Nessun documento caricato'
                : `Nessun documento ${filterStatus === 'pending_verification' ? 'da verificare' : filterStatus === 'verified' ? 'verificato' : 'rifiutato'}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showDocModal && selectedDoc && selectedDoc.status === 'pending_verification' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Rifiuta Documento</h3>
            <p className="text-gray-400 mb-4">
              Stai rifiutando: <strong className="text-white">{getDocumentLabel(selectedDoc.document_type)}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Motivo del rifiuto</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Inserisci il motivo del rifiuto..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDocModal(false)
                  setSelectedDoc(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => updateDocumentStatus(selectedDoc.id, 'rejected', rejectionReason)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                disabled={!rejectionReason.trim()}
              >
                Rifiuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
