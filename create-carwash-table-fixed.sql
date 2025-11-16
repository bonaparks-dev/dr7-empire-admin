-- Create car_wash_services table
CREATE TABLE IF NOT EXISTS car_wash_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration TEXT NOT NULL,
  description TEXT NOT NULL,
  description_en TEXT NOT NULL,
  features JSONB NOT NULL,
  features_en JSONB NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial car wash services
INSERT INTO car_wash_services (id, name, name_en, price, duration, description, description_en, features, features_en, display_order)
VALUES
('full-clean', 'LAVAGGIO COMPLETO', 'FULL CLEAN', 25, '30-45 min', 'Rapido e completo, per un auto pulita ogni giorno.', 'Quick and complete, for a clean car every day.', '["Esterni + interni completi", "Schiuma colorata profumata", "Pulizia cerchi, passaruota, vetri", "Aspirazione interni"]'::jsonb, '["Complete exterior + interior", "Scented colored foam", "Wheel, wheel arch, glass cleaning", "Interior vacuuming"]'::jsonb, 1),
('top-shine', 'LAVAGGIO TOP', 'TOP SHINE', 49, '1-1.5 ore', 'Piu brillantezza e protezione, con cura extra dei dettagli.', 'More shine and protection, with extra detail care.', '["Tutto quello del Full Clean", "Trattamento lucidante veloce (crema protettiva carrozzeria)", "Dettaglio extra di plastiche interne e bocchette", "Acqua DR7 luxury inclusa"]'::jsonb, '["Everything from Full Clean", "Fast polish treatment (protective cream)", "Extra detail on interior plastics", "DR7 luxury water included"]'::jsonb, 2),
('vip', 'LAVAGGIO VIP', 'VIP EXPERIENCE', 75, '2-3 ore', 'Il pacchetto che ti fa ritirare l auto come nuova.', 'The package that makes your car look like new.', '["Tutto quello del Top Shine", "Decontaminazione carrozzeria (sporco ostinato, catrame, ferro)", "Pulizia e igienizzazione sedili (pelle)", "Sanificazione abitacolo all azoto", "Sigillante premium su carrozzeria", "Profumo premium + omaggio esclusivo", "Acqua DR7 luxury inclusa"]'::jsonb, '["Everything from Top Shine", "Body decontamination (tar, iron)", "Seat cleaning & sanitization", "Nitrogen cabin sanitization", "Premium sealant on body", "Premium perfume + exclusive gift", "DR7 luxury water included"]'::jsonb, 3),
('dr7-luxury', 'LAVAGGIO DR7 LUXURY', 'DR7 LUXURY', 99, '3-4 ore', 'L auto esce meglio di quando e uscita dalla concessionaria.', 'Your car comes out better than when it left the dealership.', '["Tutto quello del VIP Experience", "Igienizzazione totale di ogni singolo dettaglio", "Pulizia e igienizzazione sedili (tessuto o pelle)", "Lavaggio completo moquette e tappetini", "Pulizia e trattamento del cielo (soffitto interno)", "Lavaggio accurato del motore con prodotti specifici", "Profumo premium in omaggio", "Acqua DR7 luxury inclusa"]'::jsonb, '["Everything from VIP Experience", "Total sanitization of every detail", "Complete seat cleaning (fabric/leather)", "Full carpet and mat washing", "Ceiling treatment", "Engine bay cleaning", "Premium perfume gift", "DR7 luxury water included"]'::jsonb, 4);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_car_wash_services_display_order ON car_wash_services(display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_car_wash_services_updated_at BEFORE UPDATE ON car_wash_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
