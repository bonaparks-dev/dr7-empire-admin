-- Fix Mercedes V Class image to vito.jpeg
UPDATE vehicles
SET metadata = jsonb_set(
  metadata,
  '{image}',
  '"/vito.jpeg"'
)
WHERE display_name = 'Mercedes V Class VIP DR7';

-- Verify the update
SELECT display_name, metadata->'image' as image FROM vehicles WHERE display_name = 'Mercedes V Class VIP DR7';
