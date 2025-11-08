-- Check if vehicles table exists and has data
SELECT * FROM public.vehicles ORDER BY created_at DESC LIMIT 10;

-- If empty, here's how to populate it with DR7's vehicle fleet:
-- Run this if the table is empty:

/*
INSERT INTO public.vehicles (display_name, plate, status, daily_rate) VALUES
('Lamborghini Huracán Evo', 'DR7-001', 'available', 800),
('Ferrari F8 Tributo', 'DR7-002', 'available', 850),
('Porsche 911 Turbo S', 'DR7-003', 'available', 650),
('McLaren 720S', 'DR7-004', 'available', 900),
('Audi R8 V10', 'DR7-005', 'available', 700),
('Mercedes-AMG GT', 'DR7-006', 'available', 600),
('BMW M8 Competition', 'DR7-007', 'available', 550),
('Range Rover Sport', 'DR7-008', 'available', 400),
('Mercedes GLE Coupé', 'DR7-009', 'available', 350),
('BMW X6 M', 'DR7-010', 'available', 500)
ON CONFLICT DO NOTHING;
*/
