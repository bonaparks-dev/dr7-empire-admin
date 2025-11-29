# Dynamic Customer Registration Form - Admin Panel Integration

The dynamic customer registration form has been added to the admin panel at:
`src/pages/admin/components/DynamicCustomerForm.tsx`

## Quick Integration

### Option 1: Add to Existing CustomersTab

Add a button to show the form in `CustomersTab.tsx`:

```tsx
import DynamicCustomerForm from './DynamicCustomerForm'

// Add state
const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)

// In the JSX, add button:
<button
  onClick={() => setShowNewCustomerForm(true)}
  className="px-4 py-2 bg-dr7-gold hover:bg-yellow-500 text-black font-semibold rounded"
>
  + Nuovo Cliente (Dinamico)
</button>

// Show the form:
{showNewCustomerForm && (
  <DynamicCustomerForm
    onSuccess={() => {
      setShowNewCustomerForm(false)
      loadCustomers() // Reload customer list
    }}
    onCancel={() => setShowNewCustomerForm(false)}
  />
)}
```

### Option 2: Create Dedicated "Clienti" Tab

Create a new tab in the admin navigation:

```tsx
// In AdminPanel.tsx or wherever tabs are defined
import ClientiTab from './components/ClientiTab'

// Add to tab list
<Tab name="Clienti" />

// Add to tab content
{activeTab === 'Clienti' && <ClientiTab />}
```

## Features

✅ **3 Client Types:**
- Azienda (Company)
- Persona Fisica (Individual)
- Pubblica Amministrazione (Public Administration)

✅ **Dynamic Fields** - Form changes based on selected type
✅ **Search Integration** - Uses `search_customers_extended()` RPC function
✅ **Validation** - Required fields based on client type
✅ **Admin Styling** - Matches dark theme with gold accents

## Database Integration

The form saves to the `customers_extended` table with these fields:

**Common Fields:**
- `tipo_cliente` - Client type (required)
- `nazione` - Country (default: Italia)
- `codice_fiscale` - Tax code
- `indirizzo` - Address

**Azienda Fields:**
- `denominazione` - Company name
- `partita_iva` - VAT number

**Persona Fisica Fields:**
- `nome` - First name
- `cognome` - Last name
- `telefono` - Phone (optional)
- `email` - Email (optional)
- `pec` - PEC email (optional)

**Pubblica Amministrazione Fields:**
- `codice_univoco` - Unique code
- `ente_ufficio` - Office/entity name
- `citta` - City

## Search Functions

The search buttons call the `search_customers_extended` RPC function:

```sql
SELECT * FROM search_customers_extended('search_term', 'search_type');
```

**Search types:**
- `denominazione` - Search by company name
- `partita_iva` - Search by VAT number
- `codice_fiscale` - Search by tax code
- `codice_univoco` - Search by unique code
- `ente_ufficio` - Search by office/entity
- `citta` - Search by city
- `any` - Search all fields

## Example: Full Integration in CustomersTab

```tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import DynamicCustomerForm from './DynamicCustomerForm'
import Button from './Button'

export default function CustomersTab() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)

  async function loadCustomers() {
    setLoading(true)
    try {
      // Load from customers_extended table
      const { data, error } = await supabase
        .from('customers_extended')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Clienti</h2>
        <Button onClick={() => setShowNewCustomerForm(true)}>
          + Nuovo Cliente
        </Button>
      </div>

      {showNewCustomerForm && (
        <DynamicCustomerForm
          onSuccess={() => {
            setShowNewCustomerForm(false)
            loadCustomers()
          }}
          onCancel={() => setShowNewCustomerForm(false)}
        />
      )}

      {/* Customer list table here */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Codice Fiscale</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Data</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-gray-700 hover:bg-gray-800">
                <td className="px-4 py-3 text-sm text-white">
                  {customer.tipo_cliente === 'azienda' && '🏢 Azienda'}
                  {customer.tipo_cliente === 'persona_fisica' && '👤 Persona Fisica'}
                  {customer.tipo_cliente === 'pubblica_amministrazione' && '🏛️ P.A.'}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {customer.tipo_cliente === 'azienda' && customer.denominazione}
                  {customer.tipo_cliente === 'persona_fisica' && `${customer.nome} ${customer.cognome}`}
                  {customer.tipo_cliente === 'pubblica_amministrazione' && customer.ente_ufficio}
                </td>
                <td className="px-4 py-3 text-sm text-white">{customer.codice_fiscale || '-'}</td>
                <td className="px-4 py-3 text-sm text-white">{customer.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-white">
                  {new Date(customer.created_at).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## Styling

The form uses the admin panel's existing color scheme:

- **Background:** Gray-900 (#1a1a1a)
- **Borders:** Gray-700
- **Primary Color:** DR7 Gold (#f4c430)
- **Text:** White/Gray
- **Inputs:** Gray-700 background with gray-600 borders

## Testing

### Test Data

**Azienda:**
```
Tipo Cliente: Azienda
Denominazione: DR7 Empire SRL
Partita IVA: IT12345678901
Codice Fiscale: 12345678901
Indirizzo: Via Roma 123, 09100 Cagliari
```

**Persona Fisica:**
```
Tipo Cliente: Persona Fisica
Nome: Mario
Cognome: Rossi
Codice Fiscale: RSSMRA80A01H501U
Indirizzo: Via Garibaldi 45, 09100 Cagliari
Telefono: +39 123 456 7890
Email: mario.rossi@example.it
```

**Pubblica Amministrazione:**
```
Tipo Cliente: Pubblica Amministrazione
Codice Univoco: UFY9MH
Codice Fiscale: 80016350923
Ente o Ufficio: Comune di Cagliari
Città: Cagliari
```

## Troubleshooting

### Form not submitting
- Check Supabase connection
- Verify `customers_extended` table exists
- Check RLS policies allow admin insert

### Search not working
- Verify `search_customers_extended` RPC function exists
- Check function permissions
- Review Supabase logs for errors

### Styling issues
- Ensure Tailwind classes are available
- Check for conflicting CSS
- Verify DR7 gold color is defined in theme

## Next Steps

1. **Add Edit Functionality** - Allow editing existing customers
2. **Add Delete** - Soft delete with confirmation
3. **Add Filters** - Filter by client type
4. **Add Export** - Export to CSV/PDF
5. **Add Bulk Actions** - Bulk delete, bulk export

## Support

The form component is self-contained and includes:
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Success/error alerts
- ✅ Responsive design

For questions or issues, check the component source code at:
`src/pages/admin/components/DynamicCustomerForm.tsx`
