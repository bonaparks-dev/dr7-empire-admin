-- Add category column to vehicles table if it doesn't exist
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('performance', 'urban'));

-- Delete existing vehicles to start fresh (optional - comment out if you want to keep existing data)
-- DELETE FROM vehicles;

-- Insert Performance/Luxury Cars (Exotic Supercars)
INSERT INTO vehicles (display_name, daily_rate, status, category, metadata) VALUES
('Audi RS3 Verde', 19, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.8s", "maxSpeed": "Max speed: 250km/h", "power": "400Cv", "torque": "500Nm", "engine": "2.5L inline 5-cylinder"}, "color": "Verde", "image": "/audi-rs3.jpeg"}'),
('Audi RS3 Rossa', 39, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.8s", "power": "400Cv", "torque": "500Nm", "engine": "2.5L inline 5-cylinder"}, "color": "Rossa", "image": "/rs3.jpeg"}'),
('Mercedes A45 S AMG', 39, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.9s", "power": "421Cv", "torque": "500Nm", "engine": "2.0L 4-cylinder Turbo"}, "image": "/mercedes_amg.jpeg"}'),
('BMW M3 Competition', 49, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.9s", "maxSpeed": "Max speed: 250km/h", "power": "510Cv", "torque": "650Nm", "engine": "3.0L inline 6-cylinder"}, "image": "/bmw-m3.jpeg"}'),
('BMW M4 Competition', 59, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.8s", "power": "510Cv", "torque": "650Nm", "engine": "3.0L inline 6-cylinder"}, "image": "/bmw-m4.jpeg"}'),
('Porsche Macan GTS', 69, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 4.5s", "power": "440Cv", "torque": "550Nm", "engine": "2.9L Twin-Turbo V6"}, "image": "/macan.jpeg"}'),
('Mercedes GLE 63 AMG', 69, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.8s", "power": "612Cv", "torque": "850Nm", "engine": "4.0L V8 BiTurbo"}, "image": "/mercedes-gle.jpeg"}'),
('Mercedes C63 S AMG', 99, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.9s", "power": "510Cv", "torque": "700Nm", "engine": "4.0L V8 BiTurbo"}, "image": "/c63.jpeg"}'),
('Porsche 992 Carrera 4S', 119, 'available', 'performance', '{"specs": {"acceleration": "0–100 in 3.6s", "maxSpeed": "Max speed: 306km/h", "power": "450Cv", "torque": "530Nm", "engine": "3.0L Twin-Turbo Flat-6"}, "image": "/porsche-911.jpeg"}')
ON CONFLICT (display_name) DO UPDATE SET
  daily_rate = EXCLUDED.daily_rate,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata;

-- Insert Urban Cars
INSERT INTO vehicles (display_name, daily_rate, status, category, metadata) VALUES
('Fiat Panda', 29, 'available', 'urban', '{"specs": {"power": "70Cv", "engine": "1.2L", "seats": "5 posti"}, "image": "/panda.jpeg"}'),
('Citroen C5 Aircross', 29, 'available', 'urban', '{"specs": {"power": "130Cv", "engine": "1.5L BlueHDi", "seats": "5 posti"}, "image": "/c5.jpeg"}'),
('Fiat 500X', 39, 'available', 'urban', '{"specs": {"power": "120Cv", "engine": "1.3L MultiJet", "seats": "5 posti"}, "image": "/500x.jpeg"}'),
('VW T-ROC', 49, 'available', 'urban', '{"specs": {"power": "150Cv", "engine": "1.5L TSI", "seats": "5 posti"}, "image": "/troc.jpeg"}'),
('Cupra Formentor', 49, 'available', 'urban', '{"specs": {"power": "150Cv", "engine": "1.5L TSI", "seats": "5 posti"}, "image": "/cupra.jpeg"}'),
('VW Tiguan', 59, 'available', 'urban', '{"specs": {"power": "150Cv", "engine": "2.0L TDI", "seats": "5 posti"}, "image": "/tiguan.jpeg"}'),
('Mercedes A250', 59, 'available', 'urban', '{"specs": {"power": "224Cv", "engine": "2.0L Turbo", "seats": "5 posti"}, "image": "/a250.jpeg"}'),
('Fiat Ducato Maxi', 79, 'available', 'urban', '{"specs": {"power": "140Cv", "engine": "2.3L MultiJet", "seats": "9 posti"}, "image": "/ducato.jpeg"}')
ON CONFLICT (display_name) DO UPDATE SET
  daily_rate = EXCLUDED.daily_rate,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata;

-- Show all vehicles by category
SELECT
  display_name,
  daily_rate,
  category,
  status,
  metadata->>'image' as image
FROM vehicles
ORDER BY category, daily_rate;
