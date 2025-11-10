-- Import commercial operation tickets from Stripe CSV
-- Each row represents a purchase, and we need to create individual tickets based on quantity

-- Ticket 1: gianluca.andreolli@gmail.com (1 ticket)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'gianluca.andreolli@gmail.com', 'Gianluca Andreolli', 'ch_3SPV8nQcprtTyo8t03inRXAd', 2000, 'eur', '2025-11-03 21:18:51', 1, NOW(), NOW());

-- Ticket 2: cristianosanti@inwind.it (1 ticket)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'cristianosanti@inwind.it', 'Cristiano Santi', 'ch_3SM6PeQcprtTyo8t42NUNQNF', 2000, 'eur', '2025-10-25 12:19:14', 1, NOW(), NOW());

-- Ticket 3-4: fabriliggi@gmail.com (2 tickets)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'fabriliggi@gmail.com', 'Fabri Liggi', 'ch_3SLh82QcprtTyo8t5r5r9E6B', 4000, 'eur', '2025-10-24 09:18:18', 2, NOW(), NOW());

-- Ticket 5-7: cristianosanti@inwind.it (3 tickets)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'cristianosanti@inwind.it', 'Cristiano Santi', 'ch_3SLYRdQcprtTyo8t0s70cTsK', 6000, 'eur', '2025-10-24 00:02:37', 3, NOW(), NOW());

-- Ticket 8: nicola.figus9@gmail.com (1 ticket)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'nicola.figus9@gmail.com', 'Nicola Figus', 'ch_3SChVMQcprtTyo8t2LfexGQJ', 2000, 'eur', '2025-09-29 13:53:03', 1, NOW(), NOW());

-- Ticket 9: dubai.rent7.0srl@gmail.com (1 ticket - from commercial operation)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'dubai.rent7.0srl@gmail.com', 'Dubai Rent 7', 'ch_3SCft5QcprtTyo8t4POGAyOI', 2000, 'eur', '2025-09-29 12:10:11', 1, NOW(), NOW());

-- Ticket 10: dubai.rent7.0srl@gmail.com (1 ticket - from lottery)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'dubai.rent7.0srl@gmail.com', 'Dubai Rent 7', 'ch_3SCb44QcprtTyo8t2hohSiyN', 2000, 'eur', '2025-09-29 07:01:05', 1, NOW(), NOW());

-- Ticket 11: dubai.rent7.0srl@gmail.com (1 ticket)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'dubai.rent7.0srl@gmail.com', 'Dubai Rent 7', 'ch_3SFgiNQcprtTyo8t2oJm9Trj', 2000, 'eur', '2025-10-07 19:39:30', 1, NOW(), NOW());

-- Ticket 12: dubai.rent7.0srl@gmail.com (1 ticket)
INSERT INTO commercial_operation_tickets (uuid, ticket_number, user_id, email, full_name, payment_intent_id, amount_paid, currency, purchase_date, quantity, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM commercial_operation_tickets), NULL, 'dubai.rent7.0srl@gmail.com', 'Dubai Rent 7', 'ch_3SAXLzQcprtTyo8t5tikaBkT', 2000, 'eur', '2025-09-23 14:42:30', 1, NOW(), NOW());

-- Show imported tickets
SELECT email, full_name, ticket_number, amount_paid, currency, purchase_date, quantity
FROM commercial_operation_tickets
ORDER BY purchase_date DESC;
