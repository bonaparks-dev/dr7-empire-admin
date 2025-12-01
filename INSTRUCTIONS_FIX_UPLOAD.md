# Fix Document Upload Issue - Step by Step Instructions

## Problem
Documents upload but don't appear in the Clienti tab, OR you get the error:
> "new row violates row-level security policy"

## Solution Steps

### Step 1: Run SQL Script in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `FINAL_FIX_STORAGE_RLS.sql` from this repository
4. Copy and paste the entire SQL script into the Supabase SQL Editor
5. Click **Run**
6. Review the output messages - it will tell you what was fixed

**What this does:**
- Drops all old conflicting storage policies
- Creates 4 new clean policies (INSERT, SELECT, UPDATE, DELETE)
- Verifies the `customer-documents` bucket exists
- Grants proper permissions to authenticated users

### Step 2: Verify Bucket Name in Supabase

1. In Supabase dashboard, go to **Storage**
2. Check that you have a bucket named **exactly**: `customer-documents`
3. If the bucket name is different, you have 2 options:
   - **Option A (Recommended):** Rename your bucket to `customer-documents` in Supabase
   - **Option B:** Update line 19 in `src/pages/admin/components/CustomerDocuments.tsx` to match your bucket name

### Step 3: Clear Browser Cache and Refresh Admin Panel

1. Open your admin panel
2. Press **CTRL + SHIFT + R** (Windows/Linux) or **CMD + SHIFT + R** (Mac) to hard refresh
3. Or clear your browser cache manually

### Step 4: Test Upload with Debug Console Open

1. Open the admin panel
2. Press **F12** to open the browser console
3. Go to **Clienti** tab
4. Click **Documenti** button for any customer
5. You will now see a **blue information box** at the top showing:
   - Bucket attivo (active bucket name)
   - Customer ID
6. Try to upload a test document
7. Watch the console for detailed logs

**Console logs you should see:**
```
[AUTH] Current user: {id: "...", email: "..."}
[BUCKET] Available buckets: [{id: "customer-documents", ...}, ...]
[UPLOAD] Uploading document...
[UPLOAD] Authenticated user ID: ...
[UPLOAD] Bucket: customer-documents
[UPLOAD] Path: {customerId}/{filename}
[UPLOAD] Upload result - data: {...}
```

### Step 5: Use Debug Button if Upload Fails

If upload still doesn't work:

1. In the document modal, scroll to the bottom
2. Click the purple **"DEBUG: Mostra tutti i file nel bucket"** button
3. Check the console output - it will show:
   - Your authentication status (user ID and email)
   - All available buckets
   - Whether the configured bucket exists
   - Files in the customer folder
   - Files in the database

4. Check the debug info box that appears on screen - it shows:
   ```
   === AUTHENTICATION ===
   User ID: ...
   Email: ...

   === STORAGE CONFIGURATION ===
   Configured Bucket: customer-documents
   Available Buckets: customer-documents, driver-licences
   Bucket Exists: YES

   === FILE COUNTS ===
   Files in customer folder: 0
   Files in database: 0
   ```

### Step 6: Common Issues and Solutions

#### Issue: "Not authenticated" in debug info
**Solution:** You're not logged in. Log out and log back into the admin panel.

#### Issue: Bucket doesn't exist
**Solution:**
- Check Supabase Storage dashboard
- Ensure bucket named `customer-documents` exists
- Run Step 1 SQL script again (it creates the bucket if missing)

#### Issue: Bucket name mismatch
**Solution:**
- Check the blue info box in the modal - it shows "Bucket attivo"
- Check the debug output - it shows "Available Buckets"
- If names don't match, either:
  - Rename bucket in Supabase to `customer-documents`
  - Change line 19 in `CustomerDocuments.tsx` to match your bucket name

#### Issue: Upload succeeds but files don't appear
**Solution:**
- Click the **"Ricarica"** (reload) button in the documents list
- Check the debug output to see if files exist in database but not showing
- Verify the Customer ID is correct (shown in blue info box)

#### Issue: "new row violates row-level security policy"
**Solution:**
- Run the SQL script in Step 1 again
- Make sure you're logged in as an authenticated user
- Check Supabase Auth logs to verify your user exists
- In Supabase dashboard, go to **Authentication > Policies** and verify policies exist

## What Changed in the Code

### Enhanced Authentication Checks
- Before upload, checks if user is authenticated
- Shows user ID and email in console
- Prevents upload if not authenticated

### Enhanced Bucket Verification
- Lists all available buckets before upload
- Verifies the configured bucket exists
- Shows available buckets if configured bucket is missing

### Better Error Messages
- Clear Italian error messages
- Shows which bucket is configured
- Shows available buckets when bucket doesn't exist

### Comprehensive Debug Tools
- Blue info box showing current configuration
- Debug button that checks 3 data sources:
  1. Storage API (list files in folder)
  2. Storage API (list all folders in bucket)
  3. Database query (storage.objects table)
- Detailed console logging with prefixes: [AUTH], [BUCKET], [UPLOAD], [DEBUG], [ERROR]

## Support

If you still have issues after following these steps:

1. Take a screenshot of the debug info box
2. Copy the console logs (F12 > Console tab > right-click > "Save as...")
3. Share the error message and screenshots

## Files Modified

- `src/pages/admin/components/CustomerDocuments.tsx` - Enhanced with auth checks, bucket verification, and debug tools
- `FINAL_FIX_STORAGE_RLS.sql` - Comprehensive SQL script to fix storage policies
- `INSTRUCTIONS_FIX_UPLOAD.md` - This file

## Summary

The main issue was **Row-Level Security (RLS) policies** on the storage bucket. The SQL script fixes this by:
1. Removing old conflicting policies
2. Creating simple, permissive policies for authenticated users
3. Ensuring the bucket exists and is configured correctly

The enhanced code helps diagnose issues by showing:
- If you're authenticated
- Which bucket is configured
- What buckets are available
- Detailed upload logs
