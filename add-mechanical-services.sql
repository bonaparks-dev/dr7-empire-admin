-- Add mechanical service bookings support to the bookings table
-- This allows the same bookings table to handle car rentals, car washes, and mechanical services

-- The bookings table should already exist with these columns:
-- service_type: can be 'car_rental', 'car_wash', or 'mechanical_service'
-- service_name: name of the service (e.g., "CAMBIO PASTIGLIE FRENI", "TAGLIANDO RAPIDO")
-- appointment_date: date of the appointment
-- appointment_time: time of the appointment
-- vehicle_name: for mechanical services, this will be the customer's vehicle info
-- price_total: total price in cents
-- booking_details: JSON field for additional service-specific data

-- Add a comment to document the mechanical service usage
COMMENT ON COLUMN bookings.service_type IS 'Type of service: car_rental, car_wash, or mechanical_service';
COMMENT ON COLUMN bookings.vehicle_name IS 'For rentals: our vehicle name. For car wash/mechanical: customer vehicle info';

-- Create an index on service_type for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);

-- Verify the structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('service_type', 'service_name', 'appointment_date', 'appointment_time', 'vehicle_name', 'price_total', 'booking_details')
ORDER BY ordinal_position;
