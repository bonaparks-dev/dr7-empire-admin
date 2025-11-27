-- Fix car wash double booking constraint to allow admin to force bookings
-- This allows the admin to override the time slot conflict when they confirm

-- First, drop the existing constraint/trigger if it exists
DROP TRIGGER IF EXISTS check_car_wash_slot_availability ON bookings;
DROP FUNCTION IF EXISTS check_car_wash_slot_conflict();

-- Create a new function that checks for conflicts but allows forced bookings
CREATE OR REPLACE FUNCTION check_car_wash_slot_conflict()
RETURNS TRIGGER AS $$
DECLARE
  existing_booking_id UUID;
  existing_booking_customer TEXT;
  conflict_time TEXT;
BEGIN
  -- Only check for car wash bookings
  IF NEW.service_type = 'car_wash' AND NEW.status != 'cancelled' THEN

    -- Check if this is a forced booking (admin override)
    IF NEW.booking_details IS NOT NULL AND
       (NEW.booking_details->>'forceBooked')::boolean = true THEN
      -- Allow forced bookings, skip the check
      RETURN NEW;
    END IF;

    -- Check for existing non-cancelled bookings at the same time slot
    SELECT id, customer_name, appointment_time
    INTO existing_booking_id, existing_booking_customer, conflict_time
    FROM bookings
    WHERE service_type = 'car_wash'
      AND status != 'cancelled'
      AND DATE(appointment_date) = DATE(NEW.appointment_date)
      AND appointment_time = NEW.appointment_time
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    LIMIT 1;

    -- If a conflict exists, raise an error in Italian
    IF existing_booking_id IS NOT NULL THEN
      RAISE EXCEPTION 'Slot già occupato alle % (Cliente: %, ID: %)',
        conflict_time,
        existing_booking_customer,
        UPPER(SUBSTRING(existing_booking_id::text, 1, 8));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER check_car_wash_slot_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_car_wash_slot_conflict();

-- Test the constraint (optional - comment out in production)
-- SELECT 'Constraint updated successfully - forced bookings are now allowed when booking_details.forceBooked = true' AS status;
