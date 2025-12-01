-- ============================================================================
-- Create customer_documents table for tracking client identity documents
-- ============================================================================
-- This table tracks specific document types (driver's license, ID/passport)
-- uploaded for each customer in the admin panel.
-- ============================================================================

-- Create enum for document types
CREATE TYPE document_type AS ENUM ('drivers_license', 'identity_document');

-- Create the customer_documents table
CREATE TABLE IF NOT EXISTS customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    bucket_id TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Add foreign key constraint to customers_extended table
    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers_extended(id)
        ON DELETE CASCADE,

    -- Ensure only one document per type per customer
    CONSTRAINT unique_customer_document_type
        UNIQUE (customer_id, document_type)
);

-- Create index for faster queries
CREATE INDEX idx_customer_documents_customer_id ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_type ON customer_documents(document_type);

-- Enable RLS
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "customer_documents_select"
ON customer_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "customer_documents_insert"
ON customer_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "customer_documents_update"
ON customer_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "customer_documents_delete"
ON customer_documents
FOR DELETE
TO authenticated
USING (true);

-- Add comments for documentation
COMMENT ON TABLE customer_documents IS 'Stores metadata for customer identity documents uploaded through admin panel';
COMMENT ON COLUMN customer_documents.document_type IS 'Type of document: drivers_license or identity_document (ID/passport)';
COMMENT ON COLUMN customer_documents.file_path IS 'Storage path in Supabase storage bucket';
COMMENT ON COLUMN customer_documents.customer_id IS 'References customer in customers_extended table';

-- Verify table was created
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_documents'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'customer_documents'
ORDER BY cmd;
