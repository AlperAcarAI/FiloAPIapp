-- 1. Assets (use Turkish enum values: 'Forklift','Kamyon','Binek')
INSERT INTO varliklar(varlik_id, tur, marka, model, plaka, sahiplik, edinim_tarihi, kullanim_sayaci)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Forklift', 'Toyota',  'FB18',  '34ABC01','Sirket',  '2025-01-10', 120),
  ('22222222-2222-2222-2222-222222222222', 'Kamyon',   'Mercedes','Actros','06DEF02','Kiralik', '2025-02-05', 300),
  ('33333333-3333-3333-3333-333333333333', 'Binek',     'Renault', 'Clio',  '35GHI03','Sirket',  '2025-03-01',  75);

-- 2. Insurances
INSERT INTO sigortalar(varlik_id, sirket, sigorta_turu, police_no, prim_tutari, baslangic_tarihi, bitis_tarihi)
VALUES
  ('11111111-1111-1111-1111-111111111111','Allianz',   'Sorumluluk','ALL-001',12000.00,'2025-01-01','2025-12-31'),
  ('22222222-2222-2222-2222-222222222222','AXA',       'Kasko',     'AXA-002',15000.00,'2025-03-15','2026-03-14'),
  ('33333333-3333-3333-3333-333333333333','Zurich',    'Sorumluluk','ZUR-003',10000.00,'2025-02-01','2026-01-31');

-- 3. Contracts
INSERT INTO sozlesmeler(varlik_id, sozlesme_turu, saglayici, sozlesme_no,
                        baslangic_tarihi, bitis_tarihi, tutar, faiz_orani, vade_ay, aylik_odeme)
VALUES
  ('11111111-1111-1111-1111-111111111111','Kiralama','RentMaster','RM-1001',
   '2025-04-01','2025-09-30',5000.00,0.00, 6,  833.33),
  ('22222222-2222-2222-2222-222222222222','Kredi',   'IsBankasi','IB-2002',
   '2025-02-01','2027-01-31',80000.00,1.25,24,3760.00),
  ('33333333-3333-3333-3333-333333333333','Kredi',   'GarantiBBVA','GB-3003',
   '2025-03-01','2026-02-28',60000.00,1.15,12,5050.00);

-- 4. Maintenance
INSERT INTO bakimlar(varlik_id, bakim_turu, yapilan_tarih, sonraki_tarih, saglayici, maliyet, fatura_no)
VALUES
  ('11111111-1111-1111-1111-111111111111','Periyodik','2025-05-10','2025-11-10','ServisX',1500.00,'FAT-5001'),
  ('22222222-2222-2222-2222-222222222222','Ariza',    '2025-06-15',NULL,        'ServisY',3200.00,'FAT-5002');

-- 5. Tires
INSERT INTO lastikler(varlik_id, pozisyon, model, uretim_tarihi, degisim_tarihi)
VALUES
  ('11111111-1111-1111-1111-111111111111','On-Left','MichelinX','2024-01-15','2025-01-15'),
  ('22222222-2222-2222-2222-222222222222','Rear-Right','BridgestoneB','2023-06-20','2024-06-20');

-- 6. Failures
INSERT INTO arizalar(varlik_id, olusum_tarihi, aciklama, onarim_baslangic, onarim_bitis, parca_maliyeti, iscilik_maliyeti)
VALUES
  ('22222222-2222-2222-2222-222222222222','2025-06-15','Engine oil leak','2025-06-16','2025-06-18',800.00,1200.00);

-- 7. Fuel Records
INSERT INTO yakit_kayitlari(varlik_id, tarih, hacim, birim_fiyat, toplam_tutar)
VALUES
  ('33333333-3333-3333-3333-333333333333','2025-07-01',50.00,20.00,1000.00);

-- 8. Material Requests
INSERT INTO malzeme_talepleri(varlik_id, malzeme_adi, talep_eden, talep_tarihi, durum, onay_eden, onay_tarihi, miktar)
VALUES
  ('11111111-1111-1111-1111-111111111111','Engine Oil',1,'2025-05-09','Beklemede',2,'2025-05-09',5);

-- 9. Expenses
INSERT INTO giderler(varlik_id, gider_turu, aciklama, tutar, gider_tarihi)
VALUES
  ('22222222-2222-2222-2222-222222222222','Cleaning','Interior cleaning',200.00,'2025-04-20');

-- 10. Sites
INSERT INTO santiyeler(santiye_id, adi, adres) VALUES
  (1,'Site A','Istanbul, Tuzla'),
  (2,'Site B','Ankara, Etimesgut');

-- 11. Site Assignments
INSERT INTO santiye_atamalari(varlik_id, santiye_id, atama_tarihi)
VALUES
  ('11111111-1111-1111-1111-111111111111',1,'2025-04-01'),
  ('22222222-2222-2222-2222-222222222222',2,'2025-02-01'),
  ('33333333-3333-3333-3333-333333333333',1,'2025-03-01');
