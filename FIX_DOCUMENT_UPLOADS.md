# Fix Document Uploads - Patente di Guida & Carta d'Identità/Passaporto

## Problem Fixed
- ✅ **Patente di Guida** now supports uploading **2 documents** (front + back)
- ✅ **Carta d'Identità/Passaporto** now supports uploading **2 documents** (front + back)
- ✅ Both upload buttons now work correctly
- ✅ All uploaded documents are displayed (not just the latest one)

## What Changed

### Code Changes (CustomersTab.tsx)
1. **Changed document storage from single URLs to arrays**
   - Before: `{ license: string | null; id: string | null }`
   - After: `{ licenses: string[]; ids: string[] }`

2. **Updated document fetching to get ALL documents**
   - Now retrieves all uploaded files for each document type
   - Displays them in a grid layout (front and back side by side)

3. **Improved UI with document counters**
   - Shows "📄 Patente di Guida (1/2)" to indicate progress
   - Shows "🆔 Carta d'Identità / Passaporto (2/2)" when complete
   - Dynamic button text: "Carica Fronte", "Carica Retro", etc.
   - Warning messages when less than 2 documents uploaded

4. **Fixed file input reset**
   - Added `e.target.value = ''` to allow uploading new files

## Setup Required

### Step 1: Setup Storage Buckets in Supabase

You need to run the SQL setup script to ensure both storage buckets exist with proper permissions:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup-driver-documents-storage.sql`
4. Click **Run** to execute the script

This will:
- ✅ Create `driver-licenses` bucket (if not exists)
- ✅ Create `driver-ids` bucket (if not exists)
- ✅ Set up proper permissions for authenticated users
- ✅ Allow upload, read, update, and delete operations

### Step 2: Deploy the Updated Code

```bash
# Build the project
npm run build

# Deploy to your hosting platform (Netlify, Vercel, etc.)
# Or if using Netlify CLI:
netlify deploy --prod
```

### Step 3: Test the Changes

1. **Login to Admin Panel**
   - Go to your admin dashboard
   - Navigate to "Clienti" tab

2. **Select a Customer**
   - Click "Documenti" button for any customer

3. **Test Patente di Guida Upload**
   - Click "📤 Carica Fronte Patente"
   - Upload the front side image
   - Wait for success message
   - Click "📤 Carica Retro Patente"
   - Upload the back side image
   - Verify both images appear side by side

4. **Test Carta d'Identità/Passaporto Upload**
   - Click "📤 Carica Fronte Documento"
   - Upload the front side image
   - Wait for success message
   - Click "📤 Carica Retro Documento"
   - Upload the back side image
   - Verify both images appear side by side

## Expected Behavior

### Before Fix
- ❌ Only 1 document could be uploaded per document type
- ❌ Carta d'Identità/Passaporto upload not working
- ❌ Only the latest document was displayed

### After Fix
- ✅ 2 documents can be uploaded per document type (front + back)
- ✅ Both upload buttons work correctly
- ✅ All uploaded documents are displayed in a grid
- ✅ Clear labels: "Fronte" and "Retro"
- ✅ Document counter shows progress (e.g., "1/2", "2/2")
- ✅ Warning message when documents are incomplete
- ✅ Dynamic button text guides the user

## Troubleshooting

### If Carta d'Identità/Passaporto Upload Still Fails

1. **Check Supabase Storage Bucket Permissions**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM storage.buckets WHERE id = 'driver-ids';
   ```
   If the bucket doesn't exist, run `setup-driver-documents-storage.sql`

2. **Check Browser Console for Errors**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages when uploading
   - Common errors:
     - "Bucket not found" → Run setup SQL script
     - "Permission denied" → Check RLS policies
     - "Storage quota exceeded" → Check storage limits

3. **Verify Authentication**
   - Make sure you're logged in as admin
   - Check that session is valid
   - Try logging out and back in

### If Documents Don't Display

1. **Check Storage Configuration**
   ```sql
   -- Verify buckets exist
   SELECT id, name, public FROM storage.buckets;

   -- Check for uploaded files
   SELECT * FROM storage.objects
   WHERE bucket_id IN ('driver-licenses', 'driver-ids')
   LIMIT 10;
   ```

2. **Check RLS Policies**
   ```sql
   -- View all storage policies
   SELECT * FROM pg_policies
   WHERE tablename = 'objects';
   ```

## Files Changed
- `src/pages/admin/components/CustomersTab.tsx` - Main document upload component
- `setup-driver-documents-storage.sql` - Storage bucket setup script (NEW)
- `FIX_DOCUMENT_UPLOADS.md` - This documentation file (NEW)

## Need Help?
If you encounter issues:
1. Check the browser console for error messages
2. Verify Supabase storage buckets are set up correctly
3. Ensure you're logged in as an authenticated admin user
4. Check that storage policies allow authenticated access
