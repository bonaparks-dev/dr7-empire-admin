import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'

type ClientType = 'persona_fisica' | 'azienda' | 'pubblica_amministrazione'

interface NewClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientCreated?: (clientId: string) => void
}

interface FormData {
  tipo_cliente: ClientType
  nazione: string
  telefono: string
  email: string
  // Persona Fisica
  nome: string
  cognome: string
  codice_fiscale: string
  indirizzo: string
  pec_pf: string
  // Azienda
  denominazione: string
  partita_iva: string
  indirizzo_azienda: string
  codice_fiscale_azienda: string
  codice_destinatario: string
  pec_azienda: string
  indirizzo_ddt: string
  // Pubblica Amministrazione
  codice_univoco: string
  codice_fiscale_pa: string
  ente_ufficio: string
  citta: string
  partita_iva_pa: string
  pec_pa: string
}

const INITIAL_FORM_DATA: FormData = {
  tipo_cliente: 'persona_fisica',
  nazione: 'Italia',
  telefono: '',
  email: '',
  nome: '',
  cognome: '',
  codice_fiscale: '',
  indirizzo: '',
  pec_pf: '',
  denominazione: '',
  partita_iva: '',
  indirizzo_azienda: '',
  codice_fiscale_azienda: '',
  codice_destinatario: '',
  pec_azienda: '',
  indirizzo_ddt: '',
  codice_univoco: '',
  codice_fiscale_pa: '',
  ente_ufficio: '',
  citta: '',
  partita_iva_pa: '',
  pec_pa: ''
}

export default function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA)
      setErrors({})
    }
  }, [isOpen])

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validateItalianPhone = (phone: string): boolean => {
    // Italian phone: +39 followed by 9-10 digits, or just 9-10 digits
    const re = /^(\+39)?[\s]?[0-9]{9,10}$/
    return re.test(phone.replace(/\s/g, ''))
  }

  const validateCodiceFiscale = (cf: string): boolean => {
    // Basic Italian Codice Fiscale: 16 alphanumeric characters
    const re = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i
    return re.test(cf)
  }

  const validatePartitaIVA = (piva: string): boolean => {
    // Italian Partita IVA: 11 digits
    const re = /^[0-9]{11}$/
    return re.test(piva)
  }

  const validateCodiceUnivoco = (code: string): boolean => {
    // Codice Univoco: 6 or 7 alphanumeric characters
    const re = /^[A-Z0-9]{6,7}$/i
    return re.test(code)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Global validations
    if (!formData.nazione) newErrors.nazione = 'Nazione è obbligatoria'
    if (!formData.telefono) {
      newErrors.telefono = 'Telefono è obbligatorio'
    } else if (!validateItalianPhone(formData.telefono)) {
      newErrors.telefono = 'Formato telefono non valido'
    }
    if (!formData.email) {
      newErrors.email = 'Email è obbligatoria'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Formato email non valido'
    }

    // Type-specific validations
    if (formData.tipo_cliente === 'persona_fisica') {
      if (!formData.nome) newErrors.nome = 'Nome è obbligatorio'
      if (!formData.cognome) newErrors.cognome = 'Cognome è obbligatorio'
      if (!formData.codice_fiscale) {
        newErrors.codice_fiscale = 'Codice Fiscale è obbligatorio'
      } else if (!validateCodiceFiscale(formData.codice_fiscale)) {
        newErrors.codice_fiscale = 'Formato Codice Fiscale non valido'
      }
      if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio'
    } else if (formData.tipo_cliente === 'azienda') {
      if (!formData.denominazione) newErrors.denominazione = 'Denominazione è obbligatoria'
      if (!formData.partita_iva) {
        newErrors.partita_iva = 'Partita IVA è obbligatoria'
      } else if (!validatePartitaIVA(formData.partita_iva)) {
        newErrors.partita_iva = 'Formato Partita IVA non valido (11 cifre)'
      }
      if (!formData.indirizzo_azienda) newErrors.indirizzo_azienda = 'Indirizzo è obbligatorio'
      if (formData.codice_fiscale_azienda && !validateCodiceFiscale(formData.codice_fiscale_azienda)) {
        newErrors.codice_fiscale_azienda = 'Formato Codice Fiscale non valido'
      }
    } else if (formData.tipo_cliente === 'pubblica_amministrazione') {
      if (!formData.codice_univoco) {
        newErrors.codice_univoco = 'Codice Univoco è obbligatorio'
      } else if (!validateCodiceUnivoco(formData.codice_univoco)) {
        newErrors.codice_univoco = 'Formato Codice Univoco non valido (6-7 caratteri)'
      }
      if (!formData.codice_fiscale_pa) {
        newErrors.codice_fiscale_pa = 'Codice Fiscale è obbligatorio'
      } else if (!validateCodiceFiscale(formData.codice_fiscale_pa)) {
        newErrors.codice_fiscale_pa = 'Formato Codice Fiscale non valido'
      }
      if (!formData.ente_ufficio) newErrors.ente_ufficio = 'Ente o Ufficio è obbligatorio'
      if (!formData.citta) newErrors.citta = 'Città è obbligatoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Prepare data for customers_extended table
      const customerData: any = {
        tipo_cliente: formData.tipo_cliente,
        nazione: formData.nazione,
        telefono: formData.telefono,
        email: formData.email,
        source: 'admin',
        created_at: new Date().toISOString()
      }

      // Add type-specific fields
      if (formData.tipo_cliente === 'persona_fisica') {
        customerData.nome = formData.nome
        customerData.cognome = formData.cognome
        customerData.codice_fiscale = formData.codice_fiscale.toUpperCase()
        customerData.indirizzo = formData.indirizzo
        if (formData.pec_pf) customerData.pec = formData.pec_pf
      } else if (formData.tipo_cliente === 'azienda') {
        customerData.denominazione = formData.denominazione
        customerData.partita_iva = formData.partita_iva
        customerData.indirizzo = formData.indirizzo_azienda
        if (formData.codice_fiscale_azienda) customerData.codice_fiscale = formData.codice_fiscale_azienda.toUpperCase()
        if (formData.codice_destinatario) customerData.codice_destinatario = formData.codice_destinatario
        if (formData.pec_azienda) customerData.pec = formData.pec_azienda
        if (formData.indirizzo_ddt) customerData.indirizzo_ddt = formData.indirizzo_ddt
      } else if (formData.tipo_cliente === 'pubblica_amministrazione') {
        customerData.codice_univoco = formData.codice_univoco.toUpperCase()
        customerData.codice_fiscale = formData.codice_fiscale_pa.toUpperCase()
        customerData.ente_ufficio = formData.ente_ufficio
        customerData.citta = formData.citta
        if (formData.partita_iva_pa) customerData.partita_iva = formData.partita_iva_pa
        if (formData.pec_pa) customerData.pec = formData.pec_pa
      }

      const { data: newClient, error } = await supabase
        .from('customers_extended')
        .insert([customerData])
        .select()
        .single()

      if (error) throw error

      alert('✅ Cliente creato con successo!')

      if (onClientCreated && newClient) {
        onClientCreated(newClient.id)
      }

      onClose()
    } catch (error: any) {
      console.error('Failed to create client:', error)
      alert(`❌ Errore: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = (): boolean => {
    // Global fields
    if (!formData.nazione || !formData.telefono || !formData.email) return false
    if (!validateEmail(formData.email) || !validateItalianPhone(formData.telefono)) return false

    // Type-specific fields
    if (formData.tipo_cliente === 'persona_fisica') {
      return !!(
        formData.nome &&
        formData.cognome &&
        formData.codice_fiscale &&
        validateCodiceFiscale(formData.codice_fiscale) &&
        formData.indirizzo
      )
    } else if (formData.tipo_cliente === 'azienda') {
      return !!(
        formData.denominazione &&
        formData.partita_iva &&
        validatePartitaIVA(formData.partita_iva) &&
        formData.indirizzo_azienda
      )
    } else if (formData.tipo_cliente === 'pubblica_amministrazione') {
      return !!(
        formData.codice_univoco &&
        validateCodiceUnivoco(formData.codice_univoco) &&
        formData.codice_fiscale_pa &&
        validateCodiceFiscale(formData.codice_fiscale_pa) &&
        formData.ente_ufficio &&
        formData.citta
      )
    }

    return false
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Nuovo Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Client Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo Cliente <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tipo_cliente"
                  value="persona_fisica"
                  checked={formData.tipo_cliente === 'persona_fisica'}
                  onChange={(e) => setFormData({ ...INITIAL_FORM_DATA, tipo_cliente: e.target.value as ClientType, nazione: 'Italia', telefono: formData.telefono, email: formData.email })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">Persona Fisica</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tipo_cliente"
                  value="azienda"
                  checked={formData.tipo_cliente === 'azienda'}
                  onChange={(e) => setFormData({ ...INITIAL_FORM_DATA, tipo_cliente: e.target.value as ClientType, nazione: 'Italia', telefono: formData.telefono, email: formData.email })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">Azienda</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tipo_cliente"
                  value="pubblica_amministrazione"
                  checked={formData.tipo_cliente === 'pubblica_amministrazione'}
                  onChange={(e) => setFormData({ ...INITIAL_FORM_DATA, tipo_cliente: e.target.value as ClientType, nazione: 'Italia', telefono: formData.telefono, email: formData.email })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">Pubblica Amministrazione</span>
              </label>
            </div>
          </div>

          {/* Global Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazione <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.nazione}
                onChange={(e) => setFormData({ ...formData, nazione: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Italia">Italia</option>
                <option value="Francia">Francia</option>
                <option value="Germania">Germania</option>
                <option value="Spagna">Spagna</option>
                <option value="Regno Unito">Regno Unito</option>
                <option value="Altro">Altro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+39 123 456 7890"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.telefono ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@example.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* PERSONA FISICA Fields */}
          {formData.tipo_cliente === 'persona_fisica' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.nome ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.cognome ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.cognome && <p className="text-red-500 text-xs mt-1">{errors.cognome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codice_fiscale}
                  onChange={(e) => setFormData({ ...formData, codice_fiscale: e.target.value.toUpperCase() })}
                  maxLength={16}
                  placeholder="RSSMRA80A01H501U"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.codice_fiscale ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.codice_fiscale && <p className="text-red-500 text-xs mt-1">{errors.codice_fiscale}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PEC (opzionale)
                </label>
                <input
                  type="email"
                  value={formData.pec_pf}
                  onChange={(e) => setFormData({ ...formData, pec_pf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  placeholder="Via Roma 123, 00100 Roma"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.indirizzo ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.indirizzo && <p className="text-red-500 text-xs mt-1">{errors.indirizzo}</p>}
              </div>
            </div>
          )}

          {/* AZIENDA Fields */}
          {formData.tipo_cliente === 'azienda' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Denominazione <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.denominazione}
                  onChange={(e) => setFormData({ ...formData, denominazione: e.target.value })}
                  placeholder="Nome azienda S.r.l."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.denominazione ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.denominazione && <p className="text-red-500 text-xs mt-1">{errors.denominazione}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partita IVA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.partita_iva}
                  onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
                  maxLength={11}
                  placeholder="12345678901"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.partita_iva ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.partita_iva && <p className="text-red-500 text-xs mt-1">{errors.partita_iva}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.codice_fiscale_azienda}
                  onChange={(e) => setFormData({ ...formData, codice_fiscale_azienda: e.target.value.toUpperCase() })}
                  maxLength={16}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.codice_fiscale_azienda ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.codice_fiscale_azienda && <p className="text-red-500 text-xs mt-1">{errors.codice_fiscale_azienda}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Destinatario (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.codice_destinatario}
                  onChange={(e) => setFormData({ ...formData, codice_destinatario: e.target.value.toUpperCase() })}
                  maxLength={7}
                  placeholder="XXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PEC (opzionale)
                </label>
                <input
                  type="email"
                  value={formData.pec_azienda}
                  onChange={(e) => setFormData({ ...formData, pec_azienda: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.indirizzo_azienda}
                  onChange={(e) => setFormData({ ...formData, indirizzo_azienda: e.target.value })}
                  placeholder="Via Esempio 123, 00100 Roma"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.indirizzo_azienda ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.indirizzo_azienda && <p className="text-red-500 text-xs mt-1">{errors.indirizzo_azienda}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo per DDT (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.indirizzo_ddt}
                  onChange={(e) => setFormData({ ...formData, indirizzo_ddt: e.target.value })}
                  placeholder="Via Diversa 456, 00200 Roma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* PUBBLICA AMMINISTRAZIONE Fields */}
          {formData.tipo_cliente === 'pubblica_amministrazione' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Univoco <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codice_univoco}
                  onChange={(e) => setFormData({ ...formData, codice_univoco: e.target.value.toUpperCase() })}
                  maxLength={7}
                  placeholder="ABC123"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.codice_univoco ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.codice_univoco && <p className="text-red-500 text-xs mt-1">{errors.codice_univoco}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codice_fiscale_pa}
                  onChange={(e) => setFormData({ ...formData, codice_fiscale_pa: e.target.value.toUpperCase() })}
                  maxLength={16}
                  placeholder="12345678901"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.codice_fiscale_pa ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.codice_fiscale_pa && <p className="text-red-500 text-xs mt-1">{errors.codice_fiscale_pa}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ente o Ufficio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ente_ufficio}
                  onChange={(e) => setFormData({ ...formData, ente_ufficio: e.target.value })}
                  placeholder="Comune di Roma"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.ente_ufficio ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.ente_ufficio && <p className="text-red-500 text-xs mt-1">{errors.ente_ufficio}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Città <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  placeholder="Roma"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.citta ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.citta && <p className="text-red-500 text-xs mt-1">{errors.citta}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partita IVA (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.partita_iva_pa}
                  onChange={(e) => setFormData({ ...formData, partita_iva_pa: e.target.value })}
                  maxLength={11}
                  placeholder="12345678901"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PEC (opzionale)
                </label>
                <input
                  type="email"
                  value={formData.pec_pa}
                  onChange={(e) => setFormData({ ...formData, pec_pa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isFormValid() && !submitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Salvataggio...' : 'Salva Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
