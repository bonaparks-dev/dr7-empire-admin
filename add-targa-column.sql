-- Add targa column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS targa TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_targa ON vehicles(targa);

-- ============================================
-- ✅ Column added successfully!
-- Now you can store vehicle license plates (targa)
-- ============================================
