-- Fix car wash double booking constraint to allow admin to force bookings
-- This allows the admin to override the time slot conflict when they confirm

-- First, drop the existing constraint/trigger if it exists
DROP TRIGGER IF EXISTS check_car_wash_slot_availability ON bookings;
DROP FUNCTION IF EXISTS check_car_wash_slot_conflict();

-- Create a new function that checks for conflicts but allows forced bookings
-- Now checks for duration overlaps, not just exact time matches
CREATE OR REPLACE FUNCTION check_car_wash_slot_conflict()
RETURNS TRIGGER AS $$
DECLARE
  existing_booking_id UUID;
  existing_booking_customer TEXT;
  existing_service_name TEXT;
  conflict_time TEXT;
  new_duration_minutes INTEGER;
  existing_duration_minutes INTEGER;
  new_start_minutes INTEGER;
  new_end_minutes INTEGER;
  existing_start_minutes INTEGER;
  existing_end_minutes INTEGER;
  booking_record RECORD;
BEGIN
  -- Only check for car wash bookings
  IF NEW.service_type = 'car_wash' AND NEW.status != 'cancelled' THEN

    -- Check if this is a forced booking (admin override)
    IF NEW.booking_details IS NOT NULL AND
       (NEW.booking_details->>'forceBooked')::boolean = true THEN
      -- Allow forced bookings, skip the check
      RETURN NEW;
    END IF;

    -- Get duration for the new booking based on service name
    new_duration_minutes := CASE NEW.service_name
      WHEN 'Lavaggio Completo' THEN 60
      WHEN 'Lavaggio Top' THEN 120
      WHEN 'Lavaggio VIP' THEN 180
      WHEN 'Lavaggio DR7 Luxury' THEN 240
      ELSE 60 -- Default to 1 hour
    END;

    -- Convert new appointment time to minutes
    new_start_minutes := EXTRACT(HOUR FROM NEW.appointment_date::time) * 60 +
                         EXTRACT(MINUTE FROM NEW.appointment_date::time);
    new_end_minutes := new_start_minutes + new_duration_minutes;

    -- Check for existing non-cancelled bookings that might overlap
    FOR booking_record IN
      SELECT id, customer_name, appointment_time, service_name, appointment_date
      FROM bookings
      WHERE service_type = 'car_wash'
        AND status != 'cancelled'
        AND DATE(appointment_date) = DATE(NEW.appointment_date)
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      -- Get duration for existing booking
      existing_duration_minutes := CASE booking_record.service_name
        WHEN 'Lavaggio Completo' THEN 60
        WHEN 'Lavaggio Top' THEN 120
        WHEN 'Lavaggio VIP' THEN 180
        WHEN 'Lavaggio DR7 Luxury' THEN 240
        ELSE 60 -- Default to 1 hour
      END;

      -- Convert existing appointment time to minutes
      existing_start_minutes := EXTRACT(HOUR FROM booking_record.appointment_date::time) * 60 +
                               EXTRACT(MINUTE FROM booking_record.appointment_date::time);
      existing_end_minutes := existing_start_minutes + existing_duration_minutes;

      -- Check if time ranges overlap
      IF new_start_minutes < existing_end_minutes AND new_end_minutes > existing_start_minutes THEN
        -- Conflict found
        existing_booking_id := booking_record.id;
        existing_booking_customer := booking_record.customer_name;
        existing_service_name := booking_record.service_name;
        conflict_time := booking_record.appointment_time;

        RAISE EXCEPTION 'Slot già occupato alle % (Cliente: %, Servizio: %, ID: %)',
          conflict_time,
          existing_booking_customer,
          existing_service_name,
          UPPER(SUBSTRING(existing_booking_id::text, 1, 8));
      END IF;
    END LOOP;
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
