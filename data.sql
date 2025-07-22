--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.countries VALUES (2, 'United States', '+1');
INSERT INTO public.countries VALUES (3, 'Germany', '+49');
INSERT INTO public.countries VALUES (4, 'Türkiye', '+90');
INSERT INTO public.countries VALUES (5, 'Canada', '+1');
INSERT INTO public.countries VALUES (6, 'Russia', '+7');
INSERT INTO public.countries VALUES (7, 'Egypt', '+20');
INSERT INTO public.countries VALUES (8, 'South Africa', '+27');
INSERT INTO public.countries VALUES (9, 'Greece', '+30');
INSERT INTO public.countries VALUES (10, 'Netherlands', '+31');
INSERT INTO public.countries VALUES (11, 'Belgium', '+32');
INSERT INTO public.countries VALUES (12, 'France', '+33');
INSERT INTO public.countries VALUES (13, 'Spain', '+34');
INSERT INTO public.countries VALUES (14, 'Hungary', '+36');
INSERT INTO public.countries VALUES (15, 'Italy', '+39');
INSERT INTO public.countries VALUES (16, 'Romania', '+40');
INSERT INTO public.countries VALUES (17, 'Switzerland', '+41');
INSERT INTO public.countries VALUES (18, 'Austria', '+43');
INSERT INTO public.countries VALUES (19, 'United Kingdom', '+44');
INSERT INTO public.countries VALUES (20, 'Denmark', '+45');
INSERT INTO public.countries VALUES (21, 'Sweden', '+46');
INSERT INTO public.countries VALUES (22, 'Norway', '+47');
INSERT INTO public.countries VALUES (23, 'Poland', '+48');
INSERT INTO public.countries VALUES (24, 'Peru', '+51');
INSERT INTO public.countries VALUES (25, 'Mexico', '+52');
INSERT INTO public.countries VALUES (26, 'Cuba', '+53');
INSERT INTO public.countries VALUES (27, 'Argentina', '+54');
INSERT INTO public.countries VALUES (28, 'Brazil', '+55');
INSERT INTO public.countries VALUES (29, 'Chile', '+56');
INSERT INTO public.countries VALUES (30, 'Colombia', '+57');
INSERT INTO public.countries VALUES (31, 'Venezuela', '+58');
INSERT INTO public.countries VALUES (32, 'Malaysia', '+60');
INSERT INTO public.countries VALUES (33, 'Australia', '+61');
INSERT INTO public.countries VALUES (34, 'Indonesia', '+62');
INSERT INTO public.countries VALUES (35, 'Philippines', '+63');
INSERT INTO public.countries VALUES (36, 'New Zealand', '+64');
INSERT INTO public.countries VALUES (37, 'Singapore', '+65');
INSERT INTO public.countries VALUES (38, 'Thailand', '+66');
INSERT INTO public.countries VALUES (39, 'Japan', '+81');
INSERT INTO public.countries VALUES (40, 'South Korea', '+82');
INSERT INTO public.countries VALUES (41, 'Vietnam', '+84');
INSERT INTO public.countries VALUES (42, 'China', '+86');
INSERT INTO public.countries VALUES (43, 'India', '+91');
INSERT INTO public.countries VALUES (44, 'Pakistan', '+92');
INSERT INTO public.countries VALUES (45, 'Afghanistan', '+93');
INSERT INTO public.countries VALUES (46, 'Sri Lanka', '+94');
INSERT INTO public.countries VALUES (47, 'Myanmar', '+95');
INSERT INTO public.countries VALUES (48, 'Iran', '+98');
INSERT INTO public.countries VALUES (49, 'South Sudan', '+211');
INSERT INTO public.countries VALUES (50, 'Morocco', '+212');
INSERT INTO public.countries VALUES (51, 'Algeria', '+213');
INSERT INTO public.countries VALUES (52, 'Tunisia', '+216');
INSERT INTO public.countries VALUES (53, 'Libya', '+218');
INSERT INTO public.countries VALUES (54, 'Gambia', '+220');
INSERT INTO public.countries VALUES (55, 'Senegal', '+221');
INSERT INTO public.countries VALUES (56, 'Mauritania', '+222');
INSERT INTO public.countries VALUES (57, 'Mali', '+223');
INSERT INTO public.countries VALUES (58, 'Guinea', '+224');
INSERT INTO public.countries VALUES (59, 'Ivory Coast', '+225');
INSERT INTO public.countries VALUES (60, 'Burkina Faso', '+226');
INSERT INTO public.countries VALUES (61, 'Niger', '+227');
INSERT INTO public.countries VALUES (62, 'Togo', '+228');
INSERT INTO public.countries VALUES (63, 'Benin', '+229');
INSERT INTO public.countries VALUES (64, 'Mauritius', '+230');
INSERT INTO public.countries VALUES (65, 'Liberia', '+231');
INSERT INTO public.countries VALUES (66, 'Sierra Leone', '+232');
INSERT INTO public.countries VALUES (67, 'Ghana', '+233');
INSERT INTO public.countries VALUES (68, 'Nigeria', '+234');
INSERT INTO public.countries VALUES (69, 'Chad', '+235');
INSERT INTO public.countries VALUES (70, 'Central African Republic', '+236');
INSERT INTO public.countries VALUES (71, 'Cameroon', '+237');
INSERT INTO public.countries VALUES (72, 'Cape Verde', '+238');
INSERT INTO public.countries VALUES (73, 'Sao Tome and Principe', '+239');
INSERT INTO public.countries VALUES (74, 'Equatorial Guinea', '+240');
INSERT INTO public.countries VALUES (75, 'Gabon', '+241');
INSERT INTO public.countries VALUES (76, 'Congo', '+242');
INSERT INTO public.countries VALUES (77, 'DR Congo', '+243');
INSERT INTO public.countries VALUES (78, 'Angola', '+244');
INSERT INTO public.countries VALUES (79, 'Guinea-Bissau', '+245');
INSERT INTO public.countries VALUES (80, 'British Indian Ocean Territory', '+246');
INSERT INTO public.countries VALUES (81, 'Ascension Island', '+247');
INSERT INTO public.countries VALUES (82, 'Seychelles', '+248');
INSERT INTO public.countries VALUES (83, 'Sudan', '+249');
INSERT INTO public.countries VALUES (84, 'Rwanda', '+250');
INSERT INTO public.countries VALUES (85, 'Ethiopia', '+251');
INSERT INTO public.countries VALUES (86, 'Somalia', '+252');
INSERT INTO public.countries VALUES (87, 'Djibouti', '+253');
INSERT INTO public.countries VALUES (88, 'Kenya', '+254');
INSERT INTO public.countries VALUES (89, 'Tanzania', '+255');
INSERT INTO public.countries VALUES (90, 'Uganda', '+256');
INSERT INTO public.countries VALUES (91, 'Burundi', '+257');
INSERT INTO public.countries VALUES (92, 'Mozambique', '+258');
INSERT INTO public.countries VALUES (93, 'Zambia', '+260');
INSERT INTO public.countries VALUES (94, 'Madagascar', '+261');
INSERT INTO public.countries VALUES (95, 'Reunion', '+262');
INSERT INTO public.countries VALUES (96, 'Zimbabwe', '+263');
INSERT INTO public.countries VALUES (97, 'Namibia', '+264');
INSERT INTO public.countries VALUES (98, 'Malawi', '+265');
INSERT INTO public.countries VALUES (99, 'Lesotho', '+266');
INSERT INTO public.countries VALUES (100, 'Botswana', '+267');
INSERT INTO public.countries VALUES (101, 'Eswatini', '+268');
INSERT INTO public.countries VALUES (102, 'Comoros', '+269');
INSERT INTO public.countries VALUES (103, 'Saint Helena', '+290');
INSERT INTO public.countries VALUES (104, 'Eritrea', '+291');
INSERT INTO public.countries VALUES (105, 'Aruba', '+297');
INSERT INTO public.countries VALUES (106, 'Faroe Islands', '+298');
INSERT INTO public.countries VALUES (107, 'Greenland', '+299');
INSERT INTO public.countries VALUES (108, 'Gibraltar', '+350');
INSERT INTO public.countries VALUES (109, 'Portugal', '+351');
INSERT INTO public.countries VALUES (110, 'Luxembourg', '+352');
INSERT INTO public.countries VALUES (111, 'Ireland', '+353');
INSERT INTO public.countries VALUES (112, 'Iceland', '+354');
INSERT INTO public.countries VALUES (113, 'Albania', '+355');
INSERT INTO public.countries VALUES (114, 'Malta', '+356');
INSERT INTO public.countries VALUES (115, 'Cyprus', '+357');
INSERT INTO public.countries VALUES (116, 'Finland', '+358');
INSERT INTO public.countries VALUES (117, 'Bulgaria', '+359');
INSERT INTO public.countries VALUES (118, 'Lithuania', '+370');
INSERT INTO public.countries VALUES (119, 'Latvia', '+371');
INSERT INTO public.countries VALUES (120, 'Estonia', '+372');
INSERT INTO public.countries VALUES (121, 'Moldova', '+373');
INSERT INTO public.countries VALUES (122, 'Armenia', '+374');
INSERT INTO public.countries VALUES (123, 'Belarus', '+375');
INSERT INTO public.countries VALUES (124, 'Andorra', '+376');
INSERT INTO public.countries VALUES (125, 'Monaco', '+377');
INSERT INTO public.countries VALUES (126, 'San Marino', '+378');
INSERT INTO public.countries VALUES (127, 'Vatican City', '+379');
INSERT INTO public.countries VALUES (128, 'Ukraine', '+380');
INSERT INTO public.countries VALUES (129, 'Serbia', '+381');
INSERT INTO public.countries VALUES (130, 'Montenegro', '+382');
INSERT INTO public.countries VALUES (131, 'Kosovo', '+383');
INSERT INTO public.countries VALUES (132, 'Croatia', '+385');
INSERT INTO public.countries VALUES (133, 'Slovenia', '+386');
INSERT INTO public.countries VALUES (134, 'Bosnia & Herzegovina', '+387');
INSERT INTO public.countries VALUES (135, 'North Macedonia', '+389');
INSERT INTO public.countries VALUES (136, 'Czech Republic', '+420');
INSERT INTO public.countries VALUES (137, 'Slovakia', '+421');
INSERT INTO public.countries VALUES (138, 'Liechtenstein', '+423');
INSERT INTO public.countries VALUES (139, 'Falkland Islands', '+500');
INSERT INTO public.countries VALUES (140, 'Belize', '+501');
INSERT INTO public.countries VALUES (141, 'Guatemala', '+502');
INSERT INTO public.countries VALUES (142, 'El Salvador', '+503');
INSERT INTO public.countries VALUES (143, 'Honduras', '+504');
INSERT INTO public.countries VALUES (144, 'Nicaragua', '+505');
INSERT INTO public.countries VALUES (145, 'Costa Rica', '+506');
INSERT INTO public.countries VALUES (146, 'Panama', '+507');
INSERT INTO public.countries VALUES (147, 'Saint Pierre & Miquelon', '+508');
INSERT INTO public.countries VALUES (148, 'Haiti', '+509');
INSERT INTO public.countries VALUES (149, 'Guadeloupe', '+590');
INSERT INTO public.countries VALUES (150, 'Bolivia', '+591');
INSERT INTO public.countries VALUES (151, 'Guyana', '+592');
INSERT INTO public.countries VALUES (152, 'Ecuador', '+593');
INSERT INTO public.countries VALUES (153, 'French Guiana', '+594');
INSERT INTO public.countries VALUES (154, 'Paraguay', '+595');
INSERT INTO public.countries VALUES (155, 'Martinique', '+596');
INSERT INTO public.countries VALUES (156, 'Suriname', '+597');
INSERT INTO public.countries VALUES (157, 'Uruguay', '+598');
INSERT INTO public.countries VALUES (158, 'Curacao', '+599');
INSERT INTO public.countries VALUES (159, 'Timor-Leste', '+670');
INSERT INTO public.countries VALUES (160, 'Antarctica', '+672');
INSERT INTO public.countries VALUES (161, 'Brunei', '+673');
INSERT INTO public.countries VALUES (162, 'Nauru', '+674');
INSERT INTO public.countries VALUES (163, 'Papua New Guinea', '+675');
INSERT INTO public.countries VALUES (164, 'Tonga', '+676');
INSERT INTO public.countries VALUES (165, 'Solomon Islands', '+677');
INSERT INTO public.countries VALUES (166, 'Vanuatu', '+678');
INSERT INTO public.countries VALUES (167, 'Fiji', '+679');
INSERT INTO public.countries VALUES (168, 'Palau', '+680');
INSERT INTO public.countries VALUES (169, 'Wallis & Futuna', '+681');
INSERT INTO public.countries VALUES (170, 'Cook Islands', '+682');
INSERT INTO public.countries VALUES (171, 'Niue', '+683');
INSERT INTO public.countries VALUES (172, 'Samoa', '+685');
INSERT INTO public.countries VALUES (173, 'Kiribati', '+686');
INSERT INTO public.countries VALUES (174, 'New Caledonia', '+687');
INSERT INTO public.countries VALUES (175, 'Tuvalu', '+688');
INSERT INTO public.countries VALUES (176, 'French Polynesia', '+689');
INSERT INTO public.countries VALUES (177, 'Tokelau', '+690');
INSERT INTO public.countries VALUES (178, 'Micronesia', '+691');
INSERT INTO public.countries VALUES (179, 'Marshall Islands', '+692');
INSERT INTO public.countries VALUES (180, 'Macau', '+853');
INSERT INTO public.countries VALUES (181, 'Cambodia', '+855');
INSERT INTO public.countries VALUES (182, 'Laos', '+856');
INSERT INTO public.countries VALUES (183, 'Bangladesh', '+880');
INSERT INTO public.countries VALUES (184, 'Taiwan', '+886');
INSERT INTO public.countries VALUES (185, 'Maldives', '+960');
INSERT INTO public.countries VALUES (186, 'Lebanon', '+961');
INSERT INTO public.countries VALUES (187, 'Jordan', '+962');
INSERT INTO public.countries VALUES (188, 'Syria', '+963');
INSERT INTO public.countries VALUES (189, 'Iraq', '+964');
INSERT INTO public.countries VALUES (190, 'Kuwait', '+965');
INSERT INTO public.countries VALUES (191, 'Saudi Arabia', '+966');
INSERT INTO public.countries VALUES (192, 'Yemen', '+967');
INSERT INTO public.countries VALUES (193, 'Oman', '+968');
INSERT INTO public.countries VALUES (194, 'Palestine', '+970');
INSERT INTO public.countries VALUES (195, 'United Arab Emirates', '+971');
INSERT INTO public.countries VALUES (196, 'Israel', '+972');
INSERT INTO public.countries VALUES (197, 'Bahrain', '+973');
INSERT INTO public.countries VALUES (198, 'Qatar', '+974');
INSERT INTO public.countries VALUES (199, 'Bhutan', '+975');
INSERT INTO public.countries VALUES (200, 'Mongolia', '+976');
INSERT INTO public.countries VALUES (201, 'Nepal', '+977');
INSERT INTO public.countries VALUES (202, 'Tajikistan', '+992');
INSERT INTO public.countries VALUES (203, 'Turkmenistan', '+993');
INSERT INTO public.countries VALUES (204, 'Azerbaijan', '+994');
INSERT INTO public.countries VALUES (205, 'Georgia', '+995');
INSERT INTO public.countries VALUES (206, 'Kyrgyzstan', '+996');
INSERT INTO public.countries VALUES (207, 'Uzbekistan', '+998');


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cities VALUES (1, 'Adana', 4);
INSERT INTO public.cities VALUES (2, 'Adıyaman', 4);
INSERT INTO public.cities VALUES (3, 'Afyonkarahisar', 4);
INSERT INTO public.cities VALUES (4, 'Ağrı', 4);
INSERT INTO public.cities VALUES (5, 'Amasya', 4);
INSERT INTO public.cities VALUES (6, 'Ankara', 4);
INSERT INTO public.cities VALUES (7, 'Antalya', 4);
INSERT INTO public.cities VALUES (8, 'Artvin', 4);
INSERT INTO public.cities VALUES (9, 'Aydın', 4);
INSERT INTO public.cities VALUES (10, 'Balıkesir', 4);
INSERT INTO public.cities VALUES (11, 'Bilecik', 4);
INSERT INTO public.cities VALUES (12, 'Bingöl', 4);
INSERT INTO public.cities VALUES (13, 'Bitlis', 4);
INSERT INTO public.cities VALUES (14, 'Bolu', 4);
INSERT INTO public.cities VALUES (15, 'Burdur', 4);
INSERT INTO public.cities VALUES (16, 'Bursa', 4);
INSERT INTO public.cities VALUES (17, 'Çanakkale', 4);
INSERT INTO public.cities VALUES (18, 'Çankırı', 4);
INSERT INTO public.cities VALUES (19, 'Çorum', 4);
INSERT INTO public.cities VALUES (20, 'Denizli', 4);
INSERT INTO public.cities VALUES (21, 'Diyarbakır', 4);
INSERT INTO public.cities VALUES (22, 'Edirne', 4);
INSERT INTO public.cities VALUES (23, 'Elazığ', 4);
INSERT INTO public.cities VALUES (24, 'Erzincan', 4);
INSERT INTO public.cities VALUES (25, 'Erzurum', 4);
INSERT INTO public.cities VALUES (26, 'Eskişehir', 4);
INSERT INTO public.cities VALUES (27, 'Gaziantep', 4);
INSERT INTO public.cities VALUES (28, 'Giresun', 4);
INSERT INTO public.cities VALUES (29, 'Gümüşhane', 4);
INSERT INTO public.cities VALUES (30, 'Hakkâri', 4);
INSERT INTO public.cities VALUES (31, 'Hatay', 4);
INSERT INTO public.cities VALUES (32, 'Isparta', 4);
INSERT INTO public.cities VALUES (33, 'Mersin', 4);
INSERT INTO public.cities VALUES (34, 'İstanbul', 4);
INSERT INTO public.cities VALUES (35, 'İzmir', 4);
INSERT INTO public.cities VALUES (36, 'Kars', 4);
INSERT INTO public.cities VALUES (37, 'Kastamonu', 4);
INSERT INTO public.cities VALUES (38, 'Kayseri', 4);
INSERT INTO public.cities VALUES (39, 'Kırklareli', 4);
INSERT INTO public.cities VALUES (40, 'Kırşehir', 4);
INSERT INTO public.cities VALUES (41, 'Kocaeli', 4);
INSERT INTO public.cities VALUES (42, 'Konya', 4);
INSERT INTO public.cities VALUES (43, 'Kütahya', 4);
INSERT INTO public.cities VALUES (44, 'Malatya', 4);
INSERT INTO public.cities VALUES (45, 'Manisa', 4);
INSERT INTO public.cities VALUES (46, 'Kahramanmaraş', 4);
INSERT INTO public.cities VALUES (47, 'Mardin', 4);
INSERT INTO public.cities VALUES (48, 'Muğla', 4);
INSERT INTO public.cities VALUES (49, 'Muş', 4);
INSERT INTO public.cities VALUES (50, 'Nevşehir', 4);
INSERT INTO public.cities VALUES (51, 'Niğde', 4);
INSERT INTO public.cities VALUES (52, 'Ordu', 4);
INSERT INTO public.cities VALUES (53, 'Rize', 4);
INSERT INTO public.cities VALUES (54, 'Sakarya', 4);
INSERT INTO public.cities VALUES (55, 'Samsun', 4);
INSERT INTO public.cities VALUES (56, 'Siirt', 4);
INSERT INTO public.cities VALUES (57, 'Sinop', 4);
INSERT INTO public.cities VALUES (58, 'Sivas', 4);
INSERT INTO public.cities VALUES (59, 'Tekirdağ', 4);
INSERT INTO public.cities VALUES (60, 'Tokat', 4);
INSERT INTO public.cities VALUES (61, 'Trabzon', 4);
INSERT INTO public.cities VALUES (62, 'Tunceli', 4);
INSERT INTO public.cities VALUES (63, 'Şanlıurfa', 4);
INSERT INTO public.cities VALUES (64, 'Uşak', 4);
INSERT INTO public.cities VALUES (65, 'Van', 4);
INSERT INTO public.cities VALUES (66, 'Yozgat', 4);
INSERT INTO public.cities VALUES (67, 'Zonguldak', 4);
INSERT INTO public.cities VALUES (68, 'Aksaray', 4);
INSERT INTO public.cities VALUES (69, 'Bayburt', 4);
INSERT INTO public.cities VALUES (70, 'Karaman', 4);
INSERT INTO public.cities VALUES (71, 'Kırıkkale', 4);
INSERT INTO public.cities VALUES (72, 'Batman', 4);
INSERT INTO public.cities VALUES (73, 'Şırnak', 4);
INSERT INTO public.cities VALUES (74, 'Bartın', 4);
INSERT INTO public.cities VALUES (75, 'Ardahan', 4);
INSERT INTO public.cities VALUES (76, 'Iğdır', 4);
INSERT INTO public.cities VALUES (77, 'Yalova', 4);
INSERT INTO public.cities VALUES (78, 'Karabük', 4);
INSERT INTO public.cities VALUES (79, 'Kilis', 4);
INSERT INTO public.cities VALUES (80, 'Osmaniye', 4);
INSERT INTO public.cities VALUES (81, 'Düzce', 4);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: api_clients; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: api_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: car_brands; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: car_types; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.car_types VALUES (1, 'Otomobil', true);
INSERT INTO public.car_types VALUES (2, 'Minibüs', true);
INSERT INTO public.car_types VALUES (3, 'Midibüs', true);
INSERT INTO public.car_types VALUES (4, 'Otobüs', true);
INSERT INTO public.car_types VALUES (5, 'Kamyonet', true);
INSERT INTO public.car_types VALUES (6, 'Kamyon', true);
INSERT INTO public.car_types VALUES (7, 'Çekici', true);
INSERT INTO public.car_types VALUES (8, 'Yarı Römork', true);
INSERT INTO public.car_types VALUES (9, 'Tam Römork', true);
INSERT INTO public.car_types VALUES (10, 'Motosiklet', true);
INSERT INTO public.car_types VALUES (11, 'Motorsiklet', true);
INSERT INTO public.car_types VALUES (12, 'Moped', true);
INSERT INTO public.car_types VALUES (13, 'Scooter', true);
INSERT INTO public.car_types VALUES (14, 'ATV (All Terrain Vehicle)', true);
INSERT INTO public.car_types VALUES (15, 'Traktör', true);
INSERT INTO public.car_types VALUES (16, 'İş Makinesi', true);
INSERT INTO public.car_types VALUES (17, 'Forklift', true);
INSERT INTO public.car_types VALUES (18, 'Vinç', true);
INSERT INTO public.car_types VALUES (19, 'Beton Mikseri', true);
INSERT INTO public.car_types VALUES (20, 'Tanker', true);
INSERT INTO public.car_types VALUES (21, 'Ambulans', true);
INSERT INTO public.car_types VALUES (22, 'İtfaiye Aracı', true);
INSERT INTO public.car_types VALUES (23, 'Polis Aracı', true);
INSERT INTO public.car_types VALUES (24, 'Askeri Araç', true);
INSERT INTO public.car_types VALUES (25, 'Okul Servisi', true);
INSERT INTO public.car_types VALUES (26, 'Servis Minibüsü', true);
INSERT INTO public.car_types VALUES (27, 'Taksi', true);
INSERT INTO public.car_types VALUES (28, 'Dolmuş', true);
INSERT INTO public.car_types VALUES (29, 'Halk Otobüsü', true);
INSERT INTO public.car_types VALUES (30, 'Şehir İçi Otobüsü', true);
INSERT INTO public.car_types VALUES (31, 'Şehirlerarası Otobüsü', true);
INSERT INTO public.car_types VALUES (32, 'Turizm Otobüsü', true);
INSERT INTO public.car_types VALUES (33, 'Karavan', true);
INSERT INTO public.car_types VALUES (34, 'Römork (Binek)', true);
INSERT INTO public.car_types VALUES (35, 'Römork (Ticari)', true);
INSERT INTO public.car_types VALUES (36, 'Lowbed', true);
INSERT INTO public.car_types VALUES (37, 'Platform', true);
INSERT INTO public.car_types VALUES (38, 'Soğutucu', true);
INSERT INTO public.car_types VALUES (39, 'Açık Kasa', true);
INSERT INTO public.car_types VALUES (40, 'Kapalı Kasa', true);
INSERT INTO public.car_types VALUES (41, 'Tenteli', true);
INSERT INTO public.car_types VALUES (42, 'Kargo Aracı', true);
INSERT INTO public.car_types VALUES (43, 'Kurye Motosikleti', true);
INSERT INTO public.car_types VALUES (44, 'Zirai Traktör', true);
INSERT INTO public.car_types VALUES (45, 'Zirai Alet', true);
INSERT INTO public.car_types VALUES (46, 'Biçerdöver', true);
INSERT INTO public.car_types VALUES (47, 'Pulluk', true);
INSERT INTO public.car_types VALUES (48, 'Greyder', true);
INSERT INTO public.car_types VALUES (49, 'Ekskavatör', true);
INSERT INTO public.car_types VALUES (50, 'Dozer', true);
INSERT INTO public.car_types VALUES (51, 'Kepçe', true);
INSERT INTO public.car_types VALUES (52, 'Kurtarıcı', true);
INSERT INTO public.car_types VALUES (53, 'Çöp Kamyonu', true);
INSERT INTO public.car_types VALUES (54, 'Su Tankeri', true);
INSERT INTO public.car_types VALUES (55, 'Yakıt Tankeri', true);
INSERT INTO public.car_types VALUES (56, 'LPG Tankeri', true);
INSERT INTO public.car_types VALUES (57, 'Kimyasal Tanker', true);
INSERT INTO public.car_types VALUES (58, 'Damperli', true);
INSERT INTO public.car_types VALUES (59, 'Cenaze Aracı', true);
INSERT INTO public.car_types VALUES (60, 'Hasta Nakil Aracı', true);
INSERT INTO public.car_types VALUES (61, 'Kan Nakil Aracı', true);
INSERT INTO public.car_types VALUES (62, 'Mobil Sağlık Aracı', true);
INSERT INTO public.car_types VALUES (63, 'Konsol Motosikleti', true);
INSERT INTO public.car_types VALUES (64, 'Chopper', true);
INSERT INTO public.car_types VALUES (65, 'Naked Bike', true);
INSERT INTO public.car_types VALUES (66, 'Sport Bike', true);
INSERT INTO public.car_types VALUES (67, 'Enduro', true);
INSERT INTO public.car_types VALUES (68, 'Cross', true);
INSERT INTO public.car_types VALUES (69, 'Trial', true);
INSERT INTO public.car_types VALUES (70, 'Elektrikli Otomobil', true);
INSERT INTO public.car_types VALUES (71, 'Hibrit Otomobil', true);
INSERT INTO public.car_types VALUES (72, 'Elektrikli Bisiklet', true);
INSERT INTO public.car_types VALUES (73, 'Elektrikli Scooter', true);
INSERT INTO public.car_types VALUES (74, 'Elektrikli Motosiklet', true);


--
-- Data for Name: car_models; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ownership_types; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: personnel; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: doc_main_types; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: doc_sub_types; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: asset_documents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: policy_types; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: assets_policies; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: damage_types; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: assets_damage_data; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: maintenance_types; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: assets_maintenance; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: fin_current_accounts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: penalty_types; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.penalty_types VALUES (1, '23/2-a - Araç tescil belgesini araçta bulundurmamak, Sürücü...', 'Araç tescil belgesini araçta bulundurmamak, Sürücülere 843 TL. % 25 İndirimli 632,25 TL. Araç bilgileri doğrulanıncaya kadar Tescil kayıtlarından gerekli bilgileri tespit edilemeyen araçlar eksiklikleri giderilinceye kadar trafikten men edilir.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (2, '23/2-b - Tescil plakasını monte edilmesi gereken yerin dışı...', 'Tescil plakasını monte edilmesi gereken yerin dışında farklı bir yere takmak, Sürücülere 843 TL. % 25 İndirimli 632,25 TL. Tescil plakası uygun yere takılıncaya kadar', 15, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (3, '23/3-a-1 - Yönetmelikte belirtilen nitelik veya ölçülere aykı...', 'Yönetmelikte belirtilen nitelik veya ölçülere aykırı plaka takmak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin  verilir.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (4, '23/3-c-1 - Farklı okunması veya okunamamasını sağlayacak şeki...', 'Farklı okunması veya okunamamasını sağlayacak şekilde tescil plakasında değişiklik yapmak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin verilir.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (5, '23/4 - Tescilli aracı plakasız kullanmak, Sürücülere 15.7...', 'Tescilli aracı plakasız kullanmak, Sürücülere 15.712 TL. % 25 İndirimli 11.784 TL. Tescil plakası takılıncaya kadar', 20, 1178400, 1178400, true, NULL);
INSERT INTO public.penalty_types VALUES (6, '31/2 - Takograf veya taksimetre cihazlarını bozuk imal et...', 'Takograf veya taksimetre cihazlarını bozuk imal etmek veya bozulmasına vasıta olmak, bu durumdaki cihazları araçlarda kullanmak, Sorumlulara 70.594 TL. 3-6 ay hafif hapis cezası Eksikliği giderilinceye kadar araçlar', 0, 7059400, 7059400, true, NULL);
INSERT INTO public.penalty_types VALUES (7, '39/4 - Dış ülkelerden aldıkları sürücü belgeleri ile Yöne...', 'Dış ülkelerden aldıkları sürücü belgeleri ile Yönetmelikte belirtilen süreye ve şartlara aykırı olarak motorlu araç kullanmak, Sürücülere 3.755 TL. % 25 İndirimli 2.816,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (8, '44/1-a - İkamet adresi değişikliklerini tescil kuruluşuna o...', 'İkamet adresi değişikliklerini tescil kuruluşuna otuz gün içinde bildirmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (9, '46/2-b - Aksine bir işaret bulunmadıkça sürücülerin, şerit ...', 'Aksine bir işaret bulunmadıkça sürücülerin, şerit değiştirmeden önce gireceği şeritte sürülen araçların emniyetle geçişini beklememesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (10, '46/2-c - Aksine bir işaret bulunmadıkça sürücülerin, trafiğ...', 'Aksine bir işaret bulunmadıkça sürücülerin, trafiği aksatacak veya tehlikeye düşürecek şekilde şerit değiştirmesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (11, '46/2-h - Aksine bir işaret bulunmadıkça sürücülerin tek yön...', 'Aksine bir işaret bulunmadıkça sürücülerin tek yönlü karayollarında araçlarını ters istikamette sürmesi, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (12, '47/1-a - Trafiği düzenleme ve denetimle görevli trafik koll...', 'Trafiği düzenleme ve denetimle görevli trafik kolluğu veya özel kıyafetli veya işaret taşıyan diğer yetkili kişilerin uyarı ve işaretlerine uymamak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (13, '47/1-c - Trafik işaret levhaları, cihazları ve yer işaretle...', 'Trafik işaret levhaları, cihazları ve yer işaretlemeleri ile belirtilen veya gösterilen hususlara uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (14, '51/2-a - Yönetmelikte belirlenen hız sınırlarını % 10’dan %...', 'Yönetmelikte belirlenen hız sınırlarını % 10’dan % 30’a (otuz dahil) kadar aşmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (15, '51/2-b - Yönetmelikte belirlenen hız sınırlarını % 30’dan %...', 'Yönetmelikte belirlenen hız sınırlarını % 30’dan % 50''ye (elli dahil) kadar aşmak, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL.', 15, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (16, '51/5-a - Hız sınırlarını tespite yarayan cihazların yerleri...', 'Hız sınırlarını tespite yarayan cihazların yerlerini belirleyen veya sürücüyü ikaz eden cihazları imal veya ithal etmek, İmal veya ithal edenlere 28.161 TL.den 46.972 TL.ye kadar 6-8 ay hafif hapis cezası Cihazlar mahkeme kararıyla müsadere edilir.', 0, 4697200, 4697200, true, NULL);
INSERT INTO public.penalty_types VALUES (17, '51/5-b - Hız sınırlarını tespite yarayan cihazların yerleri...', 'Hız sınırlarını tespite yarayan cihazların yerlerini belirleyen veya sürücüyü ikaz eden cihazları araçlarda bulundurmak, İşletenlere 18.677   TL.den 28.161 TL''ye kadar 4-6 ay hafif hapis cezası Cihazlar mahkeme kararıyla müsadere edilir.', 15, 2816100, 2816100, true, NULL);
INSERT INTO public.penalty_types VALUES (18, '52/1-b - Aracının hızını, aracın yük ve teknik özelliğine, ...', 'Aracının hızını, aracın yük ve teknik özelliğine, görüş, yol, hava ve trafik durumunun gerektirdiği şartlara uydurmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (19, '52/1-c - Diğer bir aracı izlerken, hızını kullandığı aracın...', 'Diğer bir aracı izlerken, hızını kullandığı aracın yük ve teknik özelliğine, görüş, yol, hava ve trafik durumunun gerektirdiği şartlara uydurmadan Yönetmelikte belirlenen güvenli mesafeyi bırakmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (20, '53/1-a - Sağa dönüş kurallarına riayet etmemek, Sürücülere ...', 'Sağa dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (21, '53/1-b - Sola dönüş kurallarına riayet etmemek, Sürücülere ...', 'Sola dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (22, '53/1-c - Dönel kavşaklarda dönüş kurallarına riayet etmemek...', 'Dönel kavşaklarda dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (23, '53/1-d - Dönel kavşaklarda geriye dönüş kurallarına riayet ...', 'Dönel kavşaklarda geriye dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (24, '53/2-a - Sağa ve sola dönüşlerde sürücülerin, kurallara uyg...', 'Sağa ve sola dönüşlerde sürücülerin, kurallara uygun olarak geçiş yapan yayalara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (25, '53/2-b - Sağa ve sola dönüşlerde sürücülerin, varsa bisikle...', 'Sağa ve sola dönüşlerde sürücülerin, varsa bisiklet yolundaki ve bisiklet şeridindeki bisiklet ve elektrikli skuter kullananlara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (26, '54/1-a - Öndeki aracı geçerken geçme kurallarına riayet etm...', 'Öndeki aracı geçerken geçme kurallarına riayet etmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (27, '54/1-b - Geçmenin yasak olduğu yerlerde önündeki aracı geçm...', 'Geçmenin yasak olduğu yerlerde önündeki aracı geçmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (28, '56/1-a - Şerit izleme ve değiştirme kurallarına uymamak, Sü...', 'Şerit izleme ve değiştirme kurallarına uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (29, '56/1-c - Önlerinde giden araçları Yönetmelikte belirtilen g...', 'Önlerinde giden araçları Yönetmelikte belirtilen güvenli ve yeterli bir mesafeden izlememek (Yakın takip), Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (30, '57/1-d - Işıklı trafik işaretleri izin verse bile trafik ak...', 'Işıklı trafik işaretleri izin verse bile trafik akımı; kendisini kavşak içinde durmaya zorlayacak veya diğer doğrultudaki trafiğin geçişine engel olacak hallerde  kavşağa girmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (31, '57/1-e - Kavşaklarda gereksiz olarak duraklamak, yavaşlamak...', 'Kavşaklarda gereksiz olarak duraklamak, yavaşlamak, taşıttan inmek veya araçların motorunu durdurmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (32, '60/1-a - Taşıt yolu üzerinde duraklamanın yasaklandığının b...', 'Taşıt yolu üzerinde duraklamanın yasaklandığının bir trafik işareti ile belirtilmiş olduğu yerlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (33, '60/1-b - Taşıt yolu üzerinde sol şeritte (raylı sistemin bu...', 'Taşıt yolu üzerinde sol şeritte (raylı sistemin bulunduğu yollar hariç) duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (34, '60/1-c - Taşıt yolu üzerinde yaya ve okul geçitleri ile diğ...', 'Taşıt yolu üzerinde yaya ve okul geçitleri ile diğer geçitlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (35, '60/1-d - Taşıt yolu üzerinde kavşaklar, tüneller, rampalar,...', 'Taşıt yolu üzerinde kavşaklar, tüneller, rampalar, köprüler ve bağlantı yollarında veya buralara yerleşim birimleri içinde beş metre veya yerleşim birimleri dışında yüz metre mesafede duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (36, '60/1-e - Taşıt yolu üzerinde görüşün yeterli olmadığı tepel...', 'Taşıt yolu üzerinde görüşün yeterli olmadığı tepelere yakın yerlerde veya dönemeçlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (37, '60/1-g - Taşıt yolu üzerinde duraklayan veya park edilen ar...', 'Taşıt yolu üzerinde duraklayan veya park edilen araçların yanında duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (38, '60/1-h - Taşıt yolu üzerinde işaret levhalarına, yaklaşım y...', 'Taşıt yolu üzerinde işaret levhalarına, yaklaşım yönünde ve park izni verilen yerler dışında; yerleşim birimi içinde onbeş metre ve yerleşim birimi dışında yüz metre mesafede duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (39, '61/1-a - Taşıt yolu üzerinde duraklamanın yasaklandığı yerl...', 'Taşıt yolu üzerinde duraklamanın yasaklandığı yerlere park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (40, '61/1-b - Taşıt yolu üzerinde park etmenin trafik işaretleri...', 'Taşıt yolu üzerinde park etmenin trafik işaretleri ile yasaklandığı yerlerde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (41, '61/1-c - Taşıt yolu üzerinde geçiş yolları önünde veya üzer...', 'Taşıt yolu üzerinde geçiş yolları önünde veya üzerinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (42, '61/1-n - Yönetmelikte belirtilen haller dışında yaya yollar...', 'Yönetmelikte belirtilen haller dışında yaya yollarında park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (43, '64/1-a-3 - Kuyruk (arka kenar-arka park lambası) ışıklarını u...', 'Kuyruk (arka kenar-arka park lambası) ışıklarını uzağı veya yakını gösteren ışıklarla birlikte kullanmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (44, '64/1-b-1 - Gece sis ışıklarını; sisli, karlı ve sağanak yağmu...', 'Gece sis ışıklarını; sisli, karlı ve sağanak yağmurlu havalar dışında diğer farlarla birlikte yakmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (45, '64/1-b-2 - Dönüş ışıklarını geç anlamında kullanmak, Sürücüle...', 'Dönüş ışıklarını geç anlamında kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 5, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (46, '64/1-b-3 - Gece karşılaşmalarda ışıkları söndürmek, Sürücüler...', 'Gece karşılaşmalarda ışıkları söndürmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (47, '64/1-b-4 - Öndeki aracı geçerken, uyarı için çok kısa süre dı...', 'Öndeki aracı geçerken, uyarı için çok kısa süre dışında uzağı gösteren ışıkları yakmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (48, '64/1-b-5 - Yönetmelikte belirlenen esaslara aykırı ışık takma...', 'Yönetmelikte belirlenen esaslara aykırı ışık takmak ve kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (49, '65/1-a - Taşıma sınırı üstünde yolcu almak, Uymayanlara 777...', 'Taşıma sınırı üstünde yolcu almak, Uymayanlara 777 TL. % 25 İndirimli 582,75 TL. Ayrıca bütün sorumluluk ve giderler araç işletenine ait olmak üzere, fazla yolcular en yakın yerleşim biriminde indirilir.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (50, '65/1-c - Azami yüklü ağırlık veya izin verilen azami yüklü ...', 'Azami yüklü ağırlık veya izin verilen azami yüklü ağırlık aşılmamış olsa bile azami dingil ağırlıklarını aşmak, İşletenlere 8.463 TL. % 25 İndirimli 6.347,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (51, '65/1-d - Karayolu yapısı ve kapasitesi ile trafik güvenliği...', 'Karayolu yapısı ve kapasitesi ile trafik güvenliği bakımından tehlikeli olabilecek tarzda yükleme yapmak, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (52, '23/2-a - Araç tescil belgesini araçta bulundurmamak, Sürücü...', 'Araç tescil belgesini araçta bulundurmamak, Sürücülere 843 TL. % 25 İndirimli 632,25 TL. Araç bilgileri doğrulanıncaya kadar Tescil kayıtlarından gerekli bilgileri tespit edilemeyen araçlar eksiklikleri giderilinceye kadar trafikten men edilir.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (53, '23/2-b - Tescil plakasını monte edilmesi gereken yerin dışı...', 'Tescil plakasını monte edilmesi gereken yerin dışında farklı bir yere takmak, Sürücülere 843 TL. % 25 İndirimli 632,25 TL. Tescil plakası uygun yere takılıncaya kadar', 15, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (54, '23/3-a-1 - Yönetmelikte belirtilen nitelik veya ölçülere aykı...', 'Yönetmelikte belirtilen nitelik veya ölçülere aykırı plaka takmak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin  verilir.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (55, '65/1-h - Yükü, karayoluna değecek, düşecek, dökülecek, saçı...', 'Yükü, karayoluna değecek, düşecek, dökülecek, saçılacak, sızacak, akacak, kayacak, gürültü çıkaracak şekilde yüklemek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (56, '65/1-i - Yükü, her çeşit yolda ve yolun her eğiminde dengey...', 'Yükü, her çeşit yolda ve yolun her eğiminde dengeyi bozacak, yoldaki bir şeye takılacak ve sivri çıkıntılar hasıl edecek şekilde yüklemek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (57, '23/3-c-1 - Farklı okunması veya okunamamasını sağlayacak şeki...', 'Farklı okunması veya okunamamasını sağlayacak şekilde tescil plakasında değişiklik yapmak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin verilir.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (58, '65/1-k - Çeken ve çekilen araçlarla ilgili şartlar ve tedbi...', 'Çeken ve çekilen araçlarla ilgili şartlar ve tedbirler yerine getirilmeden araçları çekmek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (59, '23/4 - Tescilli aracı plakasız kullanmak, Sürücülere 15.7...', 'Tescilli aracı plakasız kullanmak, Sürücülere 15.712 TL. % 25 İndirimli 11.784 TL. Tescil plakası takılıncaya kadar', 20, 1178400, 1178400, true, NULL);
INSERT INTO public.penalty_types VALUES (60, '67/1-b - Yönetmelikte belirtilen şartlar dışında geriye dön...', 'Yönetmelikte belirtilen şartlar dışında geriye dönmek veya geriye gitmek, izin verilen hallerde bu manevraları yaparken karayolunu kullananlar için tehlike veya engel yaratmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (61, '67/1-c - Dönüşlerde veya şerit değiştirmelerde niyetini dön...', 'Dönüşlerde veya şerit değiştirmelerde niyetini dönüş işaret ışıkları veya kol işareti ile açıkça ve yeterli şekilde belirtmemek, işaretlere manevra süresince devam etmemek ve biter bitmez sona erdirmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (62, '68/1-a-2 - Yayaların yürümesine ayrılmış kısımların kullanılm...', 'Yayaların yürümesine ayrılmış kısımların kullanılmasının mümkün olmadığı veya bulunmadığı hallerde, yayaların taşıt yolunun kenara yakın olan kısmı dışında yürümeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (63, '68/1-a-3 - Her iki tarafta da yaya yolu ve banket bulunmayan ...', 'Her iki tarafta da yaya yolu ve banket bulunmayan veya kullanılır durumda olmayan iki yönlü trafiğin kullanıldığı karayollarında, yayaların taşıt yolunun sol kenarını izlememeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (64, '68/1-b - Yüz metreye kadar mesafede yaya geçidi veya kavşak...', 'Yüz metreye kadar mesafede yaya geçidi veya kavşak bulunduğu halde yayaların, karşı tarafa geçmek için taşıt yolunun yaya ve okul geçidi veya kavşak giriş ve çıkışları dışında herhangi bir yerini kullanmaları. Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (65, '68/1-b-1 - Yaya ve okul geçitlerinin bulunduğu yerlerdeki geç...', 'Yaya ve okul geçitlerinin bulunduğu yerlerdeki geçitlerde yayalar için ışıklı işaret olduğu halde yayaların bu işaretlere uymaması, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (66, '31/2 - Takograf veya taksimetre cihazlarını bozuk imal et...', 'Takograf veya taksimetre cihazlarını bozuk imal etmek veya bozulmasına vasıta olmak, bu durumdaki cihazları araçlarda kullanmak, Sorumlulara 70.594 TL. 3-6 ay hafif hapis cezası Eksikliği giderilinceye kadar araçlar', 0, 7059400, 7059400, true, NULL);
INSERT INTO public.penalty_types VALUES (67, '68/1-c - Yaya yollarında, geçitlerde veya zorunlu hallerde;...', 'Yaya yollarında, geçitlerde veya zorunlu hallerde; taşıt yolu üzerinde bulunan yayaların trafiği engelleyecek veya tehlikeye düşürecek şekilde davranışlarda bulunmaları veya buraları saygısızca kullanmaları, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (68, '76/1-b - Işıklı işaret ve bariyerle donatılmamış demiryolu ...', 'Işıklı işaret ve bariyerle donatılmamış demiryolu geçitlerini geçmeden önce, durmamak, herhangi bir demiryolu aracının yaklaşmadığına emin olmadan geçmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (69, '77/1-c - Bir yetkili veya görevli yönetimindeki yürüyüş kol...', 'Bir yetkili veya görevli yönetimindeki yürüyüş kolları arasından geçmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (70, '39/4 - Dış ülkelerden aldıkları sürücü belgeleri ile Yöne...', 'Dış ülkelerden aldıkları sürücü belgeleri ile Yönetmelikte belirtilen süreye ve şartlara aykırı olarak motorlu araç kullanmak, Sürücülere 3.755 TL. % 25 İndirimli 2.816,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (71, '81/1-a - Trafik kazalarına karışanların, kaza mahallinde du...', 'Trafik kazalarına karışanların, kaza mahallinde durmaması ve kaza mahallinde trafik güvenliği için gerekli tedbirleri almaması, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (72, '44/1-a - İkamet adresi değişikliklerini tescil kuruluşuna o...', 'İkamet adresi değişikliklerini tescil kuruluşuna otuz gün içinde bildirmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (73, '81/1-b - Kazalarda; ölen, yaralanan veya maddi hasar var is...', 'Kazalarda; ölen, yaralanan veya maddi hasar var ise bu kaza can ve mal güvenliğini etkilemiyorsa, sorumluluğunun tespitine yarayan iz ve delil dahil kaza yerindeki durumu değiştirmek, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL.', 0, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (74, '81/1-c - Trafik kazalarına karışanların, kazaya karışan kiş...', 'Trafik kazalarına karışanların, kazaya karışan kişiler tarafından istendiği takdirde kimliğini, adresini, sürücü ve tescil belgesi ile sigorta poliçe tarih ve numarasını bildirmemesi ve göstermemesi, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (75, '46/2-b - Aksine bir işaret bulunmadıkça sürücülerin, şerit ...', 'Aksine bir işaret bulunmadıkça sürücülerin, şerit değiştirmeden önce gireceği şeritte sürülen araçların emniyetle geçişini beklememesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (76, '81/1-d-2 - Trafik kazasına karışanların; (tutanak düzenleme k...', 'Trafik kazasına karışanların; (tutanak düzenleme konusunda kendi aralarında anlaştıkları maddi hasarlı trafik kazaları hariç) yetkililer gelinceye kadar veya bunların iznini almadan kaza yerinden ayrılması, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL.', 20, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (187, '47/1-c - Trafik işaret levhaları, cihazları ve yer işaretle...', 'Trafik işaret levhaları, cihazları ve yer işaretlemeleri ile belirtilen veya gösterilen hususlara uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (77, '46/2-c - Aksine bir işaret bulunmadıkça sürücülerin, trafiğ...', 'Aksine bir işaret bulunmadıkça sürücülerin, trafiği aksatacak veya tehlikeye düşürecek şekilde şerit değiştirmesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (78, '46/2-h - Aksine bir işaret bulunmadıkça sürücülerin tek yön...', 'Aksine bir işaret bulunmadıkça sürücülerin tek yönlü karayollarında araçlarını ters istikamette sürmesi, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (79, '47/1-a - Trafiği düzenleme ve denetimle görevli trafik koll...', 'Trafiği düzenleme ve denetimle görevli trafik kolluğu veya özel kıyafetli veya işaret taşıyan diğer yetkili kişilerin uyarı ve işaretlerine uymamak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (80, '47/1-c - Trafik işaret levhaları, cihazları ve yer işaretle...', 'Trafik işaret levhaları, cihazları ve yer işaretlemeleri ile belirtilen veya gösterilen hususlara uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (81, '51/2-a - Yönetmelikte belirlenen hız sınırlarını % 10’dan %...', 'Yönetmelikte belirlenen hız sınırlarını % 10’dan % 30’a (otuz dahil) kadar aşmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (82, '51/2-b - Yönetmelikte belirlenen hız sınırlarını % 30’dan %...', 'Yönetmelikte belirlenen hız sınırlarını % 30’dan % 50''ye (elli dahil) kadar aşmak, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL.', 15, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (83, '51/5-a - Hız sınırlarını tespite yarayan cihazların yerleri...', 'Hız sınırlarını tespite yarayan cihazların yerlerini belirleyen veya sürücüyü ikaz eden cihazları imal veya ithal etmek, İmal veya ithal edenlere 28.161 TL.den 46.972 TL.ye kadar 6-8 ay hafif hapis cezası Cihazlar mahkeme kararıyla müsadere edilir.', 0, 4697200, 4697200, true, NULL);
INSERT INTO public.penalty_types VALUES (84, '51/5-b - Hız sınırlarını tespite yarayan cihazların yerleri...', 'Hız sınırlarını tespite yarayan cihazların yerlerini belirleyen veya sürücüyü ikaz eden cihazları araçlarda bulundurmak, İşletenlere 18.677   TL.den 28.161 TL''ye kadar 4-6 ay hafif hapis cezası Cihazlar mahkeme kararıyla müsadere edilir.', 15, 2816100, 2816100, true, NULL);
INSERT INTO public.penalty_types VALUES (85, '52/1-b - Aracının hızını, aracın yük ve teknik özelliğine, ...', 'Aracının hızını, aracın yük ve teknik özelliğine, görüş, yol, hava ve trafik durumunun gerektirdiği şartlara uydurmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (86, '52/1-c - Diğer bir aracı izlerken, hızını kullandığı aracın...', 'Diğer bir aracı izlerken, hızını kullandığı aracın yük ve teknik özelliğine, görüş, yol, hava ve trafik durumunun gerektirdiği şartlara uydurmadan Yönetmelikte belirlenen güvenli mesafeyi bırakmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (87, '53/1-a - Sağa dönüş kurallarına riayet etmemek, Sürücülere ...', 'Sağa dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (88, '53/1-b - Sola dönüş kurallarına riayet etmemek, Sürücülere ...', 'Sola dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (89, '53/1-c - Dönel kavşaklarda dönüş kurallarına riayet etmemek...', 'Dönel kavşaklarda dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (90, '53/1-d - Dönel kavşaklarda geriye dönüş kurallarına riayet ...', 'Dönel kavşaklarda geriye dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (91, '53/2-a - Sağa ve sola dönüşlerde sürücülerin, kurallara uyg...', 'Sağa ve sola dönüşlerde sürücülerin, kurallara uygun olarak geçiş yapan yayalara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (92, '53/2-b - Sağa ve sola dönüşlerde sürücülerin, varsa bisikle...', 'Sağa ve sola dönüşlerde sürücülerin, varsa bisiklet yolundaki ve bisiklet şeridindeki bisiklet ve elektrikli skuter kullananlara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (93, '54/1-a - Öndeki aracı geçerken geçme kurallarına riayet etm...', 'Öndeki aracı geçerken geçme kurallarına riayet etmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (94, '54/1-b - Geçmenin yasak olduğu yerlerde önündeki aracı geçm...', 'Geçmenin yasak olduğu yerlerde önündeki aracı geçmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (95, '56/1-a - Şerit izleme ve değiştirme kurallarına uymamak, Sü...', 'Şerit izleme ve değiştirme kurallarına uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (96, '56/1-c - Önlerinde giden araçları Yönetmelikte belirtilen g...', 'Önlerinde giden araçları Yönetmelikte belirtilen güvenli ve yeterli bir mesafeden izlememek (Yakın takip), Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (97, '57/1-d - Işıklı trafik işaretleri izin verse bile trafik ak...', 'Işıklı trafik işaretleri izin verse bile trafik akımı; kendisini kavşak içinde durmaya zorlayacak veya diğer doğrultudaki trafiğin geçişine engel olacak hallerde  kavşağa girmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (98, '57/1-e - Kavşaklarda gereksiz olarak duraklamak, yavaşlamak...', 'Kavşaklarda gereksiz olarak duraklamak, yavaşlamak, taşıttan inmek veya araçların motorunu durdurmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (99, '60/1-a - Taşıt yolu üzerinde duraklamanın yasaklandığının b...', 'Taşıt yolu üzerinde duraklamanın yasaklandığının bir trafik işareti ile belirtilmiş olduğu yerlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (100, '60/1-b - Taşıt yolu üzerinde sol şeritte (raylı sistemin bu...', 'Taşıt yolu üzerinde sol şeritte (raylı sistemin bulunduğu yollar hariç) duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (101, '60/1-c - Taşıt yolu üzerinde yaya ve okul geçitleri ile diğ...', 'Taşıt yolu üzerinde yaya ve okul geçitleri ile diğer geçitlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (102, '60/1-d - Taşıt yolu üzerinde kavşaklar, tüneller, rampalar,...', 'Taşıt yolu üzerinde kavşaklar, tüneller, rampalar, köprüler ve bağlantı yollarında veya buralara yerleşim birimleri içinde beş metre veya yerleşim birimleri dışında yüz metre mesafede duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (103, '60/1-e - Taşıt yolu üzerinde görüşün yeterli olmadığı tepel...', 'Taşıt yolu üzerinde görüşün yeterli olmadığı tepelere yakın yerlerde veya dönemeçlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (104, '60/1-g - Taşıt yolu üzerinde duraklayan veya park edilen ar...', 'Taşıt yolu üzerinde duraklayan veya park edilen araçların yanında duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (105, '60/1-h - Taşıt yolu üzerinde işaret levhalarına, yaklaşım y...', 'Taşıt yolu üzerinde işaret levhalarına, yaklaşım yönünde ve park izni verilen yerler dışında; yerleşim birimi içinde onbeş metre ve yerleşim birimi dışında yüz metre mesafede duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (106, '61/1-a - Taşıt yolu üzerinde duraklamanın yasaklandığı yerl...', 'Taşıt yolu üzerinde duraklamanın yasaklandığı yerlere park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (107, '61/1-b - Taşıt yolu üzerinde park etmenin trafik işaretleri...', 'Taşıt yolu üzerinde park etmenin trafik işaretleri ile yasaklandığı yerlerde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (108, '61/1-c - Taşıt yolu üzerinde geçiş yolları önünde veya üzer...', 'Taşıt yolu üzerinde geçiş yolları önünde veya üzerinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (109, '61/1-n - Yönetmelikte belirtilen haller dışında yaya yollar...', 'Yönetmelikte belirtilen haller dışında yaya yollarında park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (110, '64/1-a-3 - Kuyruk (arka kenar-arka park lambası) ışıklarını u...', 'Kuyruk (arka kenar-arka park lambası) ışıklarını uzağı veya yakını gösteren ışıklarla birlikte kullanmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (111, '64/1-b-1 - Gece sis ışıklarını; sisli, karlı ve sağanak yağmu...', 'Gece sis ışıklarını; sisli, karlı ve sağanak yağmurlu havalar dışında diğer farlarla birlikte yakmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (112, '64/1-b-2 - Dönüş ışıklarını geç anlamında kullanmak, Sürücüle...', 'Dönüş ışıklarını geç anlamında kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 5, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (113, '64/1-b-3 - Gece karşılaşmalarda ışıkları söndürmek, Sürücüler...', 'Gece karşılaşmalarda ışıkları söndürmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (114, '64/1-b-4 - Öndeki aracı geçerken, uyarı için çok kısa süre dı...', 'Öndeki aracı geçerken, uyarı için çok kısa süre dışında uzağı gösteren ışıkları yakmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (115, '64/1-b-5 - Yönetmelikte belirlenen esaslara aykırı ışık takma...', 'Yönetmelikte belirlenen esaslara aykırı ışık takmak ve kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (116, '65/1-a - Taşıma sınırı üstünde yolcu almak, Uymayanlara 777...', 'Taşıma sınırı üstünde yolcu almak, Uymayanlara 777 TL. % 25 İndirimli 582,75 TL. Ayrıca bütün sorumluluk ve giderler araç işletenine ait olmak üzere, fazla yolcular en yakın yerleşim biriminde indirilir.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (117, '65/1-c - Azami yüklü ağırlık veya izin verilen azami yüklü ...', 'Azami yüklü ağırlık veya izin verilen azami yüklü ağırlık aşılmamış olsa bile azami dingil ağırlıklarını aşmak, İşletenlere 8.463 TL. % 25 İndirimli 6.347,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (118, '65/1-d - Karayolu yapısı ve kapasitesi ile trafik güvenliği...', 'Karayolu yapısı ve kapasitesi ile trafik güvenliği bakımından tehlikeli olabilecek tarzda yükleme yapmak, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (119, '65/1-h - Yükü, karayoluna değecek, düşecek, dökülecek, saçı...', 'Yükü, karayoluna değecek, düşecek, dökülecek, saçılacak, sızacak, akacak, kayacak, gürültü çıkaracak şekilde yüklemek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (120, '65/1-i - Yükü, her çeşit yolda ve yolun her eğiminde dengey...', 'Yükü, her çeşit yolda ve yolun her eğiminde dengeyi bozacak, yoldaki bir şeye takılacak ve sivri çıkıntılar hasıl edecek şekilde yüklemek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (121, '65/1-k - Çeken ve çekilen araçlarla ilgili şartlar ve tedbi...', 'Çeken ve çekilen araçlarla ilgili şartlar ve tedbirler yerine getirilmeden araçları çekmek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (122, '67/1-b - Yönetmelikte belirtilen şartlar dışında geriye dön...', 'Yönetmelikte belirtilen şartlar dışında geriye dönmek veya geriye gitmek, izin verilen hallerde bu manevraları yaparken karayolunu kullananlar için tehlike veya engel yaratmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (123, '67/1-c - Dönüşlerde veya şerit değiştirmelerde niyetini dön...', 'Dönüşlerde veya şerit değiştirmelerde niyetini dönüş işaret ışıkları veya kol işareti ile açıkça ve yeterli şekilde belirtmemek, işaretlere manevra süresince devam etmemek ve biter bitmez sona erdirmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (124, '68/1-a-2 - Yayaların yürümesine ayrılmış kısımların kullanılm...', 'Yayaların yürümesine ayrılmış kısımların kullanılmasının mümkün olmadığı veya bulunmadığı hallerde, yayaların taşıt yolunun kenara yakın olan kısmı dışında yürümeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (125, '68/1-a-3 - Her iki tarafta da yaya yolu ve banket bulunmayan ...', 'Her iki tarafta da yaya yolu ve banket bulunmayan veya kullanılır durumda olmayan iki yönlü trafiğin kullanıldığı karayollarında, yayaların taşıt yolunun sol kenarını izlememeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (126, '68/1-b - Yüz metreye kadar mesafede yaya geçidi veya kavşak...', 'Yüz metreye kadar mesafede yaya geçidi veya kavşak bulunduğu halde yayaların, karşı tarafa geçmek için taşıt yolunun yaya ve okul geçidi veya kavşak giriş ve çıkışları dışında herhangi bir yerini kullanmaları. Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (127, '68/1-b-1 - Yaya ve okul geçitlerinin bulunduğu yerlerdeki geç...', 'Yaya ve okul geçitlerinin bulunduğu yerlerdeki geçitlerde yayalar için ışıklı işaret olduğu halde yayaların bu işaretlere uymaması, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (128, '68/1-c - Yaya yollarında, geçitlerde veya zorunlu hallerde;...', 'Yaya yollarında, geçitlerde veya zorunlu hallerde; taşıt yolu üzerinde bulunan yayaların trafiği engelleyecek veya tehlikeye düşürecek şekilde davranışlarda bulunmaları veya buraları saygısızca kullanmaları, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (129, '76/1-b - Işıklı işaret ve bariyerle donatılmamış demiryolu ...', 'Işıklı işaret ve bariyerle donatılmamış demiryolu geçitlerini geçmeden önce, durmamak, herhangi bir demiryolu aracının yaklaşmadığına emin olmadan geçmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (130, '77/1-c - Bir yetkili veya görevli yönetimindeki yürüyüş kol...', 'Bir yetkili veya görevli yönetimindeki yürüyüş kolları arasından geçmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (131, '81/1-a - Trafik kazalarına karışanların, kaza mahallinde du...', 'Trafik kazalarına karışanların, kaza mahallinde durmaması ve kaza mahallinde trafik güvenliği için gerekli tedbirleri almaması, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (132, '81/1-b - Kazalarda; ölen, yaralanan veya maddi hasar var is...', 'Kazalarda; ölen, yaralanan veya maddi hasar var ise bu kaza can ve mal güvenliğini etkilemiyorsa, sorumluluğunun tespitine yarayan iz ve delil dahil kaza yerindeki durumu değiştirmek, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL.', 0, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (133, '81/1-c - Trafik kazalarına karışanların, kazaya karışan kiş...', 'Trafik kazalarına karışanların, kazaya karışan kişiler tarafından istendiği takdirde kimliğini, adresini, sürücü ve tescil belgesi ile sigorta poliçe tarih ve numarasını bildirmemesi ve göstermemesi, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (134, '81/1-d-2 - Trafik kazasına karışanların; (tutanak düzenleme k...', 'Trafik kazasına karışanların; (tutanak düzenleme konusunda kendi aralarında anlaştıkları maddi hasarlı trafik kazaları hariç) yetkililer gelinceye kadar veya bunların iznini almadan kaza yerinden ayrılması, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL.', 20, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (135, ' - Yolun yapımı ve bakımı ile görevli kuruluştan izin...', 'Yolun yapımı ve bakımı ile görevli kuruluştan izin almadan ve trafik akımı ile güvenliğini bozacak, karayolunu kullananlara ve araçlara zarar verecek veya yaya yollarını trafiğe kapatacak şekilde karayolu yapısında çalışma yapmak, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL. Tehlikeli durum ve engeller, bütün sorumluluk bunları yaratan kişilere ait olmak üzere trafik kolluğunca veya gerektiğinde genel kolluk ile iş birliği yapılmak suretiyle yolun yapımı, bakımı, işletilmesinden sorumlu kuruluşlar tarafından ortadan kaldırılır. Yapılan masraflar sorumlulara ödetilir.', 13, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (136, ' - Yolun yapımı ve bakımı ile görevli kuruluştan izin...', 'Yolun yapımı ve bakımı ile görevli kuruluştan izin almadan ve trafik akımı ile güvenliğini bozacak, karayolunu kullananlara ve araçlara zarar verecek veya yaya yollarını trafiğe kapatacak şekilde karayolu yapısında çalışma yapmak, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL. Tehlikeli durum ve engeller, bütün sorumluluk bunları yaratan kişilere ait olmak üzere trafik kolluğunca veya gerektiğinde genel kolluk ile iş birliği yapılmak suretiyle yolun yapımı, bakımı, işletilmesinden sorumlu kuruluşlar tarafından ortadan kaldırılır. Yapılan masraflar sorumlulara ödetilir.', 13, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (137, '14/1-a - Karayolu yapısı üzerine (yaya yolları ve bisiklet ...', 'Karayolu yapısı üzerine (yaya yolları ve bisiklet yolları dahil), araç veya yaya trafiğini güçleştirecek, tehlikeye sokacak veya engel yaratacak, trafik işaretlerinin görülmelerini engelleyecek veya güçleştirecek şekilde bir şey atmak, dökmek, bırakmak vb. hareketlerde bulunmak, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL. Tehlikeli durum ve engeller trafik kolluğu veya gerektiğinde genel kolluk ile iş birliği yapılmak suretiyle yolun yapımı, bakımı, işletilmesinden sorumlu kuruluşlar tarafından ortadan kaldırılır, bozukluk ve eksiklikler derhal giderilir. Zarar karşılıkları ve masraflar sorumlulara ödetilir.', 10, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (138, '14/1-b - Karayolu yapısı ve güvenlik tesisleri ile trafik i...', 'Karayolu yapısı ve güvenlik tesisleri ile trafik işaretlerine zarar vermek, yerlerini değiştirmek veya ortadan kaldırmak, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL. Tehlikeli durum ve engeller trafik kolluğu veya gerektiğinde genel kolluk ile iş birliği yapılmak suretiyle yolun yapımı, bakımı, işletilmesinden sorumlu kuruluşlar tarafından ortadan kaldırılır, bozukluk ve eksiklikler derhal giderilir. Zarar karşılıkları ve masraflar sorumlulara ödetilir. Karayolu dışında, kenarında veya karayolu sınırı içinde izin almadan, trafik işaretlerinin görünmelerini engelleyecek, anlamlarını değiştirecek veya güçleştirecek, yanıltacak veya trafik için tehlike veya engel yaratacak şekilde levha, ışık ile ağaç, parmaklık, direk vb. dikmek, koymak veya bulundurmak, Uymayanlara 46.972 TL. % 25 İndirimli 35.229 TL. Bunlar, bütün sorumluluk ve giderler mal sahibine ait olmak üzere, yolun yapımı, bakımı, işletilmesi ile ilgili kuruluşça kaldırılır. Belediye sınırları dışındaki karayolu kenarında her iki taraftan sınır çizgisine elli metre mesafe içinde, karayolunun yapım ve bakımı ile sorumlu kuruluştan izin almadan yapı ve tesis yapmak, Uymayanlara 46.972 TL. % 25 İndirimli 35.229 TL. Bunlar, yetkililerce durdurulacağı gibi, Yönetmelikteki şartlar yerine getirilmeden işletme izni verilmez ve bağlantı yolu, her türlü gider sorumlulara ait olmak üzere yolun yapım ve bakımı ile ilgili kuruluşça ortadan kaldırılır. Belediye sınırları içindeki karayolu kenarında ilgili belediyeden izin almadan yapı ve tesis yapmak, Uymayanlara 46.972 TL. % 25 İndirimli 35.229 TL. Bunlar, yetkililerce durdurulacağı gibi, Yönetmelikteki şartlar yerine getirilmeden işletme izni verilmez ve bağlantı yolu, her türlü gider sorumlulara ait olmak üzere yolun yapım ve bakımı ile ilgili kuruluşlarca ortadan kaldırılır.', 18, 3522900, 3522900, true, NULL);
INSERT INTO public.penalty_types VALUES (139, '20/1-a/1 - Tescili zorunlu ve ilk tescili yapılacak olan arac...', 'Tescili zorunlu ve ilk tescili yapılacak olan aracın satın alma veya gümrükten çekme tarihinden itibaren üç ay içinde tescili için; hurdaya çıkarılma halinde çıkarılış tarihinden itibaren 1 ay içinde tescilinin silinmesi için; ilgili tescil kuruluşuna başvurmamak, Araç sahiplerine 2.167 TL. % 25 İndirimli 1.625,25 TL. Tescil yapılıncaya kadar Tescil yapılmadan trafiğe çıkarılan araçlar, tescil yapılıncaya kadar trafikten men edilir. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (140, '20/1-d - Satış ve devir işlemini, siciline işlenmek üzere ü...', 'Satış ve devir işlemini, siciline işlenmek üzere üç iş günü içerisinde ilgili tescil kuruluşu ile vergi dairesine bildirmemek, yeni malik adına bir ay süreyle geçerli tescile ilişkin geçici belge düzenlememek, 1512 sayılı Kanunun 112''nci maddesi uyarınca belirlenen ücret uygulanmaksızın satış ve devre ilişkin her türlü işlem karşılığında belirlenen miktarın üzerinde ücret almak, Noterlere 16.975 TL. % 25 İndirimli 12.731,25 TL. 5326 sayılı Kabahatler Kanununun 22/2 fıkrası uyarınca idari para cezası, ilgili kamu kurum ve kuruluşunun en üst amiri tarafından uygulanır.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (234, '61/1-b - Taşıt yolu üzerinde park etmenin trafik işaretleri...', 'Taşıt yolu üzerinde park etmenin trafik işaretleri ile yasaklandığı yerlerde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (141, '20/1-d-8 - İcra müdürlükleri, vergi dairesi müdürlükleri, mil...', 'İcra müdürlükleri, vergi dairesi müdürlükleri, milli emlak müdürlükleri ile diğer yetkili kamu kurum ve kuruluşları tarafından satışı yapılan araçları satın alanların gerekli bilgi ve belgeleri sağlayarak ilgili tescil kuruluşundan bir ay içerisinde adlarına tescil belgesi almamaları, Alıcısına 2.167 TL. % 25 İndirimli 1.625,25 TL. Tescil yapılıncaya kadar Tescili yapılmadan trafiğe çıkarılan araçlar, tescil yapılıncaya kadar trafikten men edilir.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (142, '21/1 - Tescil edilen araçları tescil belgesi ve tescil pl...', 'Tescil edilen araçları tescil belgesi ve tescil plakası almadan karayoluna çıkarmak, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL. Belgeler; geçersiz ise süresiz, eksik ise geçici olarak. Eksiklikleri giderilinceye kadar Trafikten men edilen araçlar; 1) Tescil belgesi ve plakası ya da “C” geçici trafik belgesi alınması halinde karayolunda sürülerek, 2) Trafik kolluğunca izin belgesi (ek-33/A) düzenlenmesi halinde ise karayolunda sürülmeden çekici/kurtarıcı marifetiyle götürülebilir.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (143, '21/5 - Hurdaya çıkarılmış aracı karayolunda sürmek, Sürüc...', 'Hurdaya çıkarılmış aracı karayolunda sürmek, Sürücülere 18.677 TL. % 25 İndirimli 14.007,75 TL. Mülkiyeti kamuya geçirilinceye kadar Ayrıca araca mülki amir tarafından el konularak mülkiyeti kamuya geçirilir. Genel hükümlerden kaynaklanan sorumlulukları saklı kalmak üzere, ilk tescili yapılacak araçların tesciline esas teşkil edecek işlemleri elektronik ortamda bilgi paylaşımı yoluyla yapmak üzere, elektronik ortamda oluşturduğu bir ay süre ile geçerli tescile ilişkin geçici belgeyi basmak ve araç sahibine vermek üzere yetkilendirilen gerçek veya özel hukuk tüzel kişilerinin belirlenen usul ve esaslara aykırı hareket etmesi, Yetkilendirilmiş gerçek veya özel hukuk tüzel kişilerine 158.040 TL. % 25 İndirimli 118.530 TL. Tespitin yapıldığı yerin mülki amiri veya yetkilendireceği trafik tescil birim amiri tarafından ceza uygulanır. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 22, 11853000, 11853000, true, NULL);
INSERT INTO public.penalty_types VALUES (144, '23/2-a - Araç tescil belgesini araçta bulundurmamak, Sürücü...', 'Araç tescil belgesini araçta bulundurmamak, Sürücülere 843 TL. % 25 İndirimli 632,25 TL. Araç bilgileri doğrulanıncaya kadar Tescil kayıtlarından gerekli bilgileri tespit edilemeyen araçlar eksiklikleri giderilinceye kadar trafikten men edilir.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (145, '23/2-b - Tescil plakasını monte edilmesi gereken yerin dışı...', 'Tescil plakasını monte edilmesi gereken yerin dışında farklı bir yere takmak, Sürücülere 843 TL. % 25 İndirimli 632,25 TL. Tescil plakası uygun yere takılıncaya kadar', 15, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (146, '23/3-a-1 - Yönetmelikte belirtilen nitelik veya ölçülere aykı...', 'Yönetmelikte belirtilen nitelik veya ölçülere aykırı plaka takmak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin  verilir.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (147, '23/3-a-1 madde hükümlerine göre işlem yapılan ve verilen 7 günlük sürenin - sonuna kadar Yönetmelikte belirtilen nitelik veya ...', 'sonuna kadar Yönetmelikte belirtilen nitelik veya ölçülere uygun plaka takmamak, Araç sahiplerine 7.808 TL. % 25 İndirimli 5.856 TL. Tescil plakası uygun duruma getirilinceye kadar', 20, 585600, 585600, true, NULL);
INSERT INTO public.penalty_types VALUES (148, '23/3-b-1 - Tescilli araca Yönetmelikte öngörülen sayıda tesci...', 'Tescilli araca Yönetmelikte öngörülen sayıda tescil plakası takmamak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin verilir. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (149, '23/3-b-1 madde hükümlerine göre işlem yapılan ve verilen 7 günlük sürenin - sonuna kadar tescilli araca Yönetmelikte öngörülen...', 'sonuna kadar tescilli araca Yönetmelikte öngörülen sayıda tescil plakası takmamak, Araç sahiplerine 7.808 TL. % 25 İndirimli 5.856 TL. Yönetmelikte belirtilen sayıda tescil plakası takıncaya kadar', 20, 585600, 585600, true, NULL);
INSERT INTO public.penalty_types VALUES (150, '23/3-c-1 - Farklı okunması veya okunamamasını sağlayacak şeki...', 'Farklı okunması veya okunamamasını sağlayacak şekilde tescil plakasında değişiklik yapmak, Araç sahiplerine 3.809 TL. % 25 İndirimli 2.856,75 TL. Plakanın uygun duruma getirilmesi için 7 gün süreyle izin verilir.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (151, '23/3-c-2 - Farklı okunması veya okunamamasını sağlayacak şeki...', 'Farklı okunması veya okunamamasını sağlayacak şekilde tescil plakasında değişiklik yapmak nedeniyle hakkında işlem yapılarak verilen 7 günlük sürenin sonuna kadar tescil plakalarını uygun duruma getirmemek, Araç sahiplerine 7.808 TL. % 25 İndirimli 5.856 TL. Tescil plakaları uygun duruma getirilinceye kadar', 20, 585600, 585600, true, NULL);
INSERT INTO public.penalty_types VALUES (152, '23/4 - Tescilli aracı plakasız kullanmak, Sürücülere 15.7...', 'Tescilli aracı plakasız kullanmak, Sürücülere 15.712 TL. % 25 İndirimli 11.784 TL. Tescil plakası takılıncaya kadar', 20, 1178400, 1178400, true, NULL);
INSERT INTO public.penalty_types VALUES (153, '23/5-a - Başka bir araca tescilli  plakayı takmak veya kull...', 'Başka bir araca tescilli  plakayı takmak veya kullanmak, Takana veya kullananlara 46.302 TL. % 25 İndirimli 34.726,50 TL. Araç tescil edilinceye veya tescil plakası takılıncaya kadar Ayrıca, Türk Ceza Kanunu''nun 204''üncü maddesinden adli işlem yapılır. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 5000, 5000, true, NULL);
INSERT INTO public.penalty_types VALUES (161, '31/1-a - Özelliklerine ve cinslerine göre, Yönetmelikte nit...', 'Özelliklerine ve cinslerine göre, Yönetmelikte nitelik ve nicelikleri belirtilen gereçleri, araçlarda bulundurmamak, kullanmamak veya kullanılır şekilde bulundurmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Sürücü aynı zamanda araç sahibi değilse, ayrıca tescil plakasına da aynı miktar için trafik idari para cezası karar tutanağı düzenlenir.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (154, '23/5-b - Araca sahte plaka takmak veya kullanmak, Takana ve...', 'Araca sahte plaka takmak veya kullanmak, Takana veya kullananlara 46.302 TL. % 25 İndirimli 34.726,50 TL. Araç tescil edilinceye veya tescil plakası takılıncaya kadar Ayrıca, Türk Ceza Kanunu''nun 204''üncü maddesinden adli işlem yapılır. Tescili zorunlu ve karayolunda geçici olarak kullanılacak aracı, geçici trafik belgesi ve geçici tescil plakası almadan trafiğe çıkarmak, bu belge ve plakayı süresi bittiği halde kullanmak, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL. Eksiklikleri giderilinceye kadar araçlar Geçici belge ve plakalar iptal edilir. Tescili yaptırılmadan veya geçici trafik belgesi ve geçici tescil plakası alınmadan bu araçların trafiğe çıkışına izin verilmez.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (155, '26/1 - Araçlarda, bulundurulması mecburi olan (çalışma ye...', 'Araçlarda, bulundurulması mecburi olan (çalışma yerini ve şeklini, kapasite ile diğer niteliklerini belirleyen plaka, ışık, renk, şekil, sembol ve yazı gibi) ayırım işaretlerini bulundurmamak, Sürücülere ve araç işletenlerine 993 TL. % 25 İndirimli 744,75 TL. Eksikllikleri tamamlanıncaya kadar araçlar *Sürücü aynı zamanda araç sahibi değilse, ayrıca tescil plakasına da aynı miktar için trafik idari para cezası karar tutanağı düzenlenir. *Trafikten men edilen araçlara, gerekli şartları sağlamaları veya eksikliklerini gidermeleri amacıyla ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Süresi sonunda gerekli şartları sağlamadığı tespit edilen araçlar trafikten men edilir. Bu araçlara tekrar izin verilmez. Ancak, bulundukları yerde gerekli şartları sağlamaları halinde, trafiğe çıkarılmalarına müsaade edilir.', 5, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (156, '26/2 - Mevzuatta belirtilen ışıklı ve/veya sesli uyarı iş...', 'Mevzuatta belirtilen ışıklı ve/veya sesli uyarı işareti veren cihazları mevzuatta izin verilmeyen araçlara takmak ve kullanmak, Sürücülere ve araç işletenlerine 1. defasında 30 gün, geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde 60 gün süreyle geçici olarak 1. defasında 30 gün, geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde 60 gün süreyle Sürücüler *Sürücü aynı zamanda araç sahibi değilse, ayrıca tescil plakasına da aynı miktar için trafik idari para cezası karar tutanağı düzenlenir. *Bu cihazlar bütün giderler ve sorumluluk işletene ait olmak üzere söktürülür. Bu cihazlara mülki amir tarafından el konulur ve mülki amir tarafından mülkiyetinin kamuya geçirilmesine karar verilir. *Bu madde kapsamında geçici olarak geri alınan sürücü belgelerinin geri alma süreleri sonunda ilgilisine teslim edilebilmesi için 2918 sayılı Kanun''a istinaden verilmiş olan idari para cezalarının tamamının tahsil edilmiş olması zorunludur. *60 gün süreyle alınan sürücü belgelerinin geçici geri alma süresi sonunda iade edilebilmesi için psiko-teknik değerlendirme ve psikiyatri uzmanının muayenesine tabi tutulması ve sürücü belgesi almasına mâni hâli olmadığının anlaşılması halinde iade edilir. 1. defada  138.172 TL. (% 25 İndirimli 103.629 TL.) geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde 276.345 TL. (% 25 İndirimli 207.258,75 TL.) Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 0, 27634500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (157, '26/3 - Araçların dışında bulundurulması zorunlu işaretler...', 'Araçların dışında bulundurulması zorunlu işaretlerden başka, araçlara; izin alınmaksızın veya aracın tescil kayıtlarına işletilmeksizin reklam, yazı, işaret, resim, şekil, sembol, ilan, flama, bayrak ve benzerlerini takmak, yazmak, sesli ve ışıklı donanımları bulundurmak, Sürücülere ve araç işletenlerine 993 TL. % 25 İndirimli 744,75 TL. Gerekli şartlar sağlanıncaya kadar  araçlar *Sürücü aynı zamanda araç sahibi değilse, ayrıca tescil plakasına da aynı miktar için trafik idari para cezası karar tutanağı düzenlenir. *Yönetmelikte belirtilen şartlara aykırı olarak takılan veya bulundurulan gereçler ile izin alınmadan yazılan yazılar, bütün giderler ve sorumluluk işletene ait olmak üzere söktürülür veya sildirilir. Ancak bulundukları yerde bu işlemlerin mümkün olmaması halinde, gerekli şartların sağlanması amacıyla ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Verilen izin süresi sonunda gerekli şartları sağlamadığı tespit edilen araçlar gerekli şartlar sağlanıncaya kadar trafikten men edilir.', 5, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (158, '26/6 - İkinci fıkra kapsamında çıkarılan Yönetmelikte bel...', 'İkinci fıkra kapsamında çıkarılan Yönetmelikte belirtilen araçlarda; ışıklı ve sesli uyarı işaretlerinin takılacağı yerlerin dışında bulundurulması ve kullanılması, Sürücülere Geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde 30 gün süreyle geçici olarak Geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde 30 gün süreyle Geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde sürücüler *Bu madde kapsamında geçici olarak geri alınan sürücü belgelerinin geri alma süreleri sonunda ilgilisine teslim edilebilmesi için 2918 sayılı Kanun''a istinaden verilmiş olan idari para cezalarının tamamının tahsil edilmiş olması zorunludur. Resmi olmayan araçların tescil plakalarının, devlet malı araçlara ait plaka renginde olması, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL. Aykırılığı giderilinceye kadar araçlar Bu maddeye istinaden trafikten men edilen araçlara, gerekli şartları sağlamaları amacıyla ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Süresi sonunda gerekli şartları sağlamadığı tespit edilen araçlar trafikten men edilir. Bu araçlara tekrar izin verilmez. Ancak bulundukları yerde gerekli şartları sağlamaları veya eksikliklerini gidermeleri halinde trafiğe çıkarılmalarına müsaade edilir. 1. defada  138.172 TL. (% 25 İndirimli 103.629 TL.) geriye doğru bir yıl içinde 2 ve daha fazla kez ihlalinde 276.345 TL. (% 25 İndirimli 207.258,75 TL.) Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 10, 27634500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (159, '30/1-a - Servis freni, lastikleri, dış ışık donanımından ya...', 'Servis freni, lastikleri, dış ışık donanımından yakını ve uzağı gösteren ışıklar ile park, fren ve dönüş ışıkları noksan, bozuk veya teknik şartlara aykırı olan araçları kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Eksikliği giderilinceye kadar araçlar Bu maddede sayılan bozukluk veya eksiklikleri nedeniyle trafikten men edilen araçlardan, karayolunda sürülmeye elverişli olanlara, bozukluk veya eksikliklerini gidermek üzere ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Süresi sonunda gerekli şartları sağlamadığı tespit edilen araçlar trafikten men edilir. Bu araçlara tekrar izin verilmez. Ancak, bulundukları yerde gerekli şartları sağlamaları halinde trafiğe çıkarılmasına müsaade edilir. Işık donanımındaki bozukluk veya eksiklikler nedeniyle trafikten men edilen araçlara, günün kararması ile günün aydınlanması arasındaki zamanda  izin belgesi verilmez.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (160, '30/1-b - Diğer eksiklik ve bozuklukları bulunan araçlarla, ...', 'Diğer eksiklik ve bozuklukları bulunan araçlarla, görüşü engelleyecek veya bir kaza halinde içindekiler için tehlikeli olabilecek süs, aksesuar, eşya ve çıkıntıları olan araçları kullanmak, karayolunu kullananlar için tehlike yaratacak şekilde olan veya görüşü engelleyecek ve çevredekileri rahatsız edecek derecede duman veya gürültü çıkaran araçları kullanmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Eksikliği giderilinceye kadar araçlar Bu maddeye istinaden trafikten men edilen araçlara, bozukluk veya eksikliklerini gidermek üzere ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Süresi sonunda gerekli şartları sağlamadığı tespit edilen araçlar trafikten men edilir. Bu araçlara tekrar izin verilmez. Ancak, bulundukları yerde gerekli şartları sağlamaları halinde trafiğe çıkarılmasına müsaade edilir.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (162, '31/1-b - Kamyon, çekici ve otobüslerde, takograf, taksi oto...', 'Kamyon, çekici ve otobüslerde, takograf, taksi otomobillerinde ise taksimetre bulundurmamak, kullanmamak veya kullanılır şekilde bulundurmamak, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL. Eksikliği giderilinceye kadar araçlar *Sürücü aynı zamanda araç sahibi değilse, ayrıca tescil plakasına da aynı miktar için trafik idari para cezası karar tutanağı düzenlenir. *Kamyon, çekici ve otobüslerde çalışır durumda olan takografın kullanılmadığının tespiti halinde sadece sürücü hakkında trafik idari para cezası karar tutanağı düzenlenir. *Taksilerde, çalışır durumda olan taksimetrenin kullanılmadığının tespiti halinde sadece sürücü hakkında trafik idari para cezası karar tutanağı düzenlenir. *Bu maddeye istinaden trafikten men edilen araçlara, gerekli şartları sağlamaları veya eksikliklerini gidermeleri amacıyla ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Süresi sonunda gerekli şartları sağlamadığı tespit edilen araçlar trafikten men edilir. Bu araçlara tekrar izin verilmez. Ancak bulundukları yerde gerekli şartları sağlamaları veya eksikliklerini gidermeleri halinde trafiğe çıkarılmalarına müsaade edilir. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (163, '31/2 - Takograf veya taksimetre cihazlarını bozuk imal et...', 'Takograf veya taksimetre cihazlarını bozuk imal etmek veya bozulmasına vasıta olmak, bu durumdaki cihazları araçlarda kullanmak, Sorumlulara 70.594 TL. 3-6 ay hafif hapis cezası Eksikliği giderilinceye kadar araçlar', 0, 7059400, 7059400, true, NULL);
INSERT INTO public.penalty_types VALUES (164, '32/1 - Araçlar üzerinde mevzuata uygun şekilde yapılan he...', 'Araçlar üzerinde mevzuata uygun şekilde yapılan her türlü değişikliği otuz gün içinde araç tescil belgesine işletmemek, İşletenlere 993 TL. % 25 İndirimli 744,75 TL. Yapılan değişiklik araç tescil belgesine işletilinceye/araç mevzuata uygun duruma getirilinceye kadar Bu fıkraya istinaden trafikten men edilen araçlara, yapılan teknik değişiklikleri belgelendirip araç tescil belgesine işlettirmeleri/aracı mevzuata uygun duruma getirmeleri amacıyla ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. Bu süre sonunda gerekli şartları sağlamadığı tespit edilen araçlar trafikten men edilir ve çekici/kurtarıcı marifetiyle götürülmek üzere ek-33/A düzenlemek suretiyle teslim edilir.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (165, '32/3 - Mevzuata uygun olarak yapıldığı belgelenemeyen tek...', 'Mevzuata uygun olarak yapıldığı belgelenemeyen teknik değişikliğin çevredekileri rahatsız edecek derecede gürültü çıkaracak özellikte olması, Uymayanlara 9.267 TL. % 25 İndirimli 6.950,25 TL. Araç mevzuata uygun duruma getirilinceye kadar Aracın mevzuata uygun duruma getirilmesi ve muayene istasyonunda tespitin yaptırılması için çekici/kurtarıcı marifetiyle götürülmek üzere ek-33/A düzenlemek suretiyle yedi iş gününe kadar izin verilerek teslim edilir. 34/a Muayenesi yapılmamış bir aracın trafiğe çıkarılması, Araç sahibine 2.167 TL. % 25 İndirimli 1.625,25 TL. Araçlar Bu maddeye istinaden trafikten men edilen araçlara, muayenelerini yaptırmak amacıyla ek-33 düzenlenmek suretiyle yedi iş gününe kadar izin verilir. 34/b Muayenesi yapılmamış bir araçla trafiğe çıkılması nedeniyle trafikten men edilen araca verilen izin süresinin sonunda, aracın muayenesi yapılmadan trafiğe çıkarılması, Araç sahibine 4.512 TL. % 25 İndirimli 3.384 TL. Araçlar *Bu maddeye istinaden trafikten men edilen araçlara, muayenelerini yaptırmak amacıyla çekici/kurtarıcı marifetiyle götürülmek üzere ek- 33/A düzenlenmek suretiyle yedi iş gününe kadar izin verilir. *Muayenesinin yaptırılmadığının üç ve daha fazla tespiti halinde de, her seferinde trafik idari para cezası karar tutanağı uygulanarak trafikten men edilir ve çekici/kurtarıcı marifetiyle götürülmek üzere ek- 33/A düzenlenerek izin verilir. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men 34/c Muayene sonucunda emniyetsiz raporu verilen aracın  trafiğe çıkarılması, Araç sahibine 4.512 TL. % 25 İndirimli 3.384 TL. Araçlar *Bu maddeye istinaden trafikten men edilen araçlar, muayenelerini yaptırmak amacıyla çekici/kurtarıcı marifetiyle götürülmek üzere ek- 33/A düzenlenmek suretiyle yedi iş gününe kadar izin verilir. *Muayenesinin yaptırılmadığının her tespitinde trafik idari para cezası karar tutanağı uygulanarak trafikten men edilir ve çekici/kurtarıcı marifetiyle götürülmek üzere ek-33/A düzenlenerek izin verilir.', 10, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (166, '35/7 - Muayene istasyonu için işletme belgesi ile yetki v...', 'Muayene istasyonu için işletme belgesi ile yetki verildiği halde, işletme şartlarına uymamak veya gerektiği şekilde muayene yapmamak, Muayene istasyonu işletenlere 1-74.087 TL. 2-123.584 TL. 3-247.212 TL. İdari para cezası, sayılı Kanun''un 8. maddesi (c) bendi kapsamında Ulaştırma ve Altyapı Bakanlığının ilgili birimlerince uygulanacaktır. Bir yıl içinde üçüncü kez tekrarı halinde, ayrıca ilgili Bakanlıkça istasyonun işletme belgesi iptal edilir.', 0, 24721200, 24721200, true, NULL);
INSERT INTO public.penalty_types VALUES (167, '36/3-a - Sürücü belgesiz olarak motorlu araç kullanmak, Kul...', 'Sürücü belgesiz olarak motorlu araç kullanmak, Kullananlara ve kullandıranlara 18.677 TL. % 25 İndirimli 14.007,75 TL. Sürücüler Sürücü aynı zamanda araç sahibi değilse, ayrıca aracının kullanılmasına izin veren sahibine de tescil plakası üzerinden aynı miktarda trafik idari para cezası karar tutanağı düzenlenir.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (168, '36/3-b - Mahkemelerce veya Cumhuriyet Savcılıklarınca ya da...', 'Mahkemelerce veya Cumhuriyet Savcılıklarınca ya da Karayolları Trafik Kanununda belirtilen yetkililerce sürücü belgesi geçici olarak ya da tedbiren geri alındığı halde motorlu araç kullanmak, Kullananlara ve kullandıranlara 18.677 TL. % 25 İndirimli 14.007,75 TL. Sürücüler Sürücü aynı zamanda araç sahibi değilse, ayrıca aracının kullanılmasına izin veren sahibine de tescil plakası üzerinden aynı miktarda trafik idari para cezası karar tutanağı düzenlenir.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (169, '36/3-c - Sürücü belgesi iptal edildiği halde motorlu araç k...', 'Sürücü belgesi iptal edildiği halde motorlu araç kullanmak, Kullananlara ve kullandıranlara 18.677 TL. % 25 İndirimli 14.007,75 TL. Sürücüler Sürücü aynı zamanda araç sahibi değilse, ayrıca aracının kullanılmasına izin veren sahibine de tescil plakası üzerinden aynı miktarda trafik idari para cezası karar tutanağı düzenlenir. 1) Bedensel ve ruhsal bakımdan sağlıklı bulunmayanlara bisiklet, elektrikli bisiklet, elektrikli skuter ve motorsuz taşıt kullandırmak veya hayvan tevdi ettirmek, 2) 11 yaşını bitirmeyenlere bisiklet kullandırmak, 3) 15 yaşını bitirmeyenlere elektrikli bisiklet ve elektrikli skuter kullandırmak, 4) 13 yaşını bitirmeyenlere motorsuz taşıt kullandırmak veya hayvan tevdi ettirmek, Kullandıranlara 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 37, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (170, '39/2 - Sürücü belgesi sahiplerinin, sürücü belgelerinin s...', 'Sürücü belgesi sahiplerinin, sürücü belgelerinin sınıfına göre sürmeye yetkili olmadıkları  motorlu araçları sürmeleri, Sürücülere ve kullandıranlara 9.267 TL. % 25 İndirimli 6.950,25 TL. Sürücüler Sürücü aynı zamanda araç sahibi değilse, ayrıca aracının kullanılmasına izin veren sahibine de tescil plakası üzerinden aynı miktarda trafik idari para cezası karar tutanağı düzenlenir.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (171, '39/3 - Geçerlilik süresi dolan sürücü belgesi ile motorlu...', 'Geçerlilik süresi dolan sürücü belgesi ile motorlu araç kullanmak, Sürücülere 3.755 TL. % 25 İndirimli 2.816,25 TL. Sürücüler *Geçerlilik süresi halen devam eden sınıfın bulunması halinde sürücü belgesi geri alınmadan sürücü araç kullanmaktan men edilir. *Sürücü belgesinde yer alan sınıfların tamamının geçerlilik süresinin sona ermesi halinde sürücü araç kullanmaktan men edilerek sürücü belgesi geri alınarak ilgili nüfus müdürlüğüne gönderilir.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (172, '39/4 - Dış ülkelerden aldıkları sürücü belgeleri ile Yöne...', 'Dış ülkelerden aldıkları sürücü belgeleri ile Yönetmelikte belirtilen süreye ve şartlara aykırı olarak motorlu araç kullanmak, Sürücülere 3.755 TL. % 25 İndirimli 2.816,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (173, '42/11 - Sürücü sertifikasını sınıfına uygun sürücü belgesi...', 'Sürücü sertifikasını sınıfına uygun sürücü belgesine dönüştürmeden karayolunda motorlu araç kullanmak, Sürücü adaylarına ve araç sahiplerine 9.267 TL. % 25 İndirimli 6.950,25 TL. Sürücüler Sürücü aynı zamanda araç sahibi değilse, ayrıca bu kişilere araç kullandıran araç sahibine de tescil plakasına göre aynı miktar için trafik idari para cezası karar tutanağı düzenlenir. Sertifika geçerlilik süresi de dolmuş ise sürücülere ve bu kişilere araç kullandıran araç sahibine bu madde hükmü yerine 2918 sayılı Kanun''un 36/3-a maddesinden işlem yapılır.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (174, '44/1-a - İkamet adresi değişikliklerini tescil kuruluşuna o...', 'İkamet adresi değişikliklerini tescil kuruluşuna otuz gün içinde bildirmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (175, '44/1-b - Araç kullanırken sürücü belgesini yanında bulundur...', 'Araç kullanırken sürücü belgesini yanında bulundurmamak ve yetkililerin her isteyişinde göstermemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Yeni tip T.C. kimlik kartını ibraz eden ve bilgi sisteminde yapılan sorgulamada “Kimlik Kartım: Sürücü Belgesi Bilgileri Yüklüdür” şeklinde uyarı bulunan sürücülerin ibraz ettikleri T.C. kimlik kartı sürücü belgesi gibi değerlendirilerek bu madde kapsamında işlem yapılmaz.', 5, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (176, '46/2-a - Aksine bir işaret bulunmadıkça sürücülerin, araçla...', 'Aksine bir işaret bulunmadıkça sürücülerin, araçlarını, gidiş yönüne göre yolun sağından, çok şeritli yollarda ise yol ve trafik durumuna göre hızının gerektirdiği şeritten sürmemesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (177, '46/2-b - Aksine bir işaret bulunmadıkça sürücülerin, şerit ...', 'Aksine bir işaret bulunmadıkça sürücülerin, şerit değiştirmeden önce gireceği şeritte sürülen araçların emniyetle geçişini beklememesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (178, '46/2-c - Aksine bir işaret bulunmadıkça sürücülerin, trafiğ...', 'Aksine bir işaret bulunmadıkça sürücülerin, trafiği aksatacak veya tehlikeye düşürecek şekilde şerit değiştirmesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (179, '46/2-d - Aksine bir işaret bulunmadıkça sürücülerin, gidişe...', 'Aksine bir işaret bulunmadıkça sürücülerin, gidişe ayrılan en soldaki şeridi sürekli olarak işgal etmesi, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Kamyon-çekici için 9.267 TL. % 25 İndirimli 6.950,25 TL. Bu maddenin kamyon ve çekici sürücüleri tarafından ihlal edilmesi halinde ise trafik idari para cezası 9.267 (% 25 İndirimli 6.950,25 TL.) Türk Lirası olarak uygulanır.', 20, 926700, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (180, '46/2-e - Aksine bir işaret bulunmadıkça sürücülerin; iki ve...', 'Aksine bir işaret bulunmadıkça sürücülerin; iki veya daha fazla şeritli yollarda motosiklet, otomobil, kamyonet, panelvan, minibüs ve otobüs dışındaki araçları kullanırken, geçme ve dönme dışında en sağ şeridi izlememeleri, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL.', 20, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (181, '46/2-f - Aksine bir işaret bulunmadıkça sürücülerin; trafik...', 'Aksine bir işaret bulunmadıkça sürücülerin; trafik kazası, arıza halleri, acil yardım, kurtarma, kar mücadelesi, kaza incelemesi, genel güvenlik ve asayişin sağlanması gibi durumlar dışında emniyet şeritlerini ve banketleri kullanmaları, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (182, '46/2-g - Aksine bir işaret bulunmadıkça sürücülerin; trafiğ...', 'Aksine bir işaret bulunmadıkça sürücülerin; trafiği aksatacak veya tehlikeye sokacak şekilde ardı ardına birden fazla şerit değiştirmeleri, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (183, '46/2-h - Aksine bir işaret bulunmadıkça sürücülerin tek yön...', 'Aksine bir işaret bulunmadıkça sürücülerin tek yönlü karayollarında araçlarını ters istikamette sürmesi, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (184, '46/3 - Karayollarının belirli kesimlerinde ve zorunluluk ...', 'Karayollarının belirli kesimlerinde ve zorunluluk olması halinde, hayvanlarını veya hayvan sürülerini gidiş yönüne göre yolun en sağından ve en az genişlik işgal ederek ve imkan olduğunda taşıt yolu dışından götürmemek, Hayvan sürücülerine 2.167 TL. % 25 İndirimli 1.625,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (185, '47/1-a - Trafiği düzenleme ve denetimle görevli trafik koll...', 'Trafiği düzenleme ve denetimle görevli trafik kolluğu veya özel kıyafetli veya işaret taşıyan diğer yetkili kişilerin uyarı ve işaretlerine uymamak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (186, '47/1-b - Kırmızı ışık kuralına uymamak, Sürücülere 2.167 TL...', 'Kırmızı ışık kuralına uymamak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Geriye doğru 1 yıl içinde; 3.defada 30 gün, 6.defada 45 gün, 9.defada 60 gün geçici olarak *Aynı yıl içinde bu madde kapsamında iki ve daha fazla kez sürücü belgesi geri alınanlar; geri alma süresi sonunda psiko-teknik değerlendirmeden ve psikiyatri uzmanının muayenesinden geçirilir. Sürücü belgesi almasına mâni hali olmadığı anlaşılanlara bu Kanun kapsamında verilen trafik idari para cezalarının tahsil edilmiş olması şartıyla belgeleri iade edilir.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (188, '47/1-d - Trafik güvenliği ve düzeni ile ilgili olan ve yöne...', 'Trafik güvenliği ve düzeni ile ilgili olan ve yönetmelikte gösterilen diğer kural, yasak, zorunluluk veya yükümlülüklere uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (189, '48/8 - Uyuşturucu veya uyarıcı madde alarak araç kullanma...', 'Uyuşturucu veya uyarıcı madde alarak araç kullanmak, Sürücülere 47.842 TL. % 25 İndirimli 35.881,50 TL. 5 yıl geçici olarak Sürücüler Sürücü belgeleri; Sürücü olmasında sakınca bulunmadığına dair resmi sağlık kurumlarından alınmış sağlık kurulu raporunun ibraz edilmesi ve ayrıca 2918 sayılı Kanun''a istinaden (48''inci madde ve diğer bütün maddeler) verilmiş olan idari para cezalarının tamamının tahsil edilmiş ve geri alma süresinin tamamlanmış olması halinde iade edilir.', 20, 5000, 5000, true, NULL);
INSERT INTO public.penalty_types VALUES (190, '48/9 - Yaralanmalı veya ölümlü ya da kollukça müdahil olu...', 'Yaralanmalı veya ölümlü ya da kollukça müdahil olunan maddi hasarlı trafik kazasına karışma hali de dahil olmak üzere uyuşturucu veya uyarıcı maddelerin kullanılıp kullanılmadığı ya da alkolün kandaki miktarını tespit amacıyla, kollukça teknik cihazlar kullanılmasını kabul etmemek, Sürücülere 26.557 TL. % 25 İndirimli 19.917,75 TL. 2 yıl geçici olarak Sürücüler *Trafik görevlilerince uyuşturucu veya uyarıcı madde ölçümü yapılmasına müsade etmeyen, ancak uyuşturucu ya da uyarıcı madde kullandığı konusunda makul şüphe duyulan sürücüler, 5271 sayılı Ceza Muhakemesi Kanunu''nun adli kolluğa ilişkin hükümleri gereğince mahalli zabıtaya teslim edilir. *Mahalli zabıta tarafından yürütülen soruşturma takip edilerek sonuca göre  2918 sayılı Kanun''un 48/8 maddesine göre işlem yapılır. *Ayrıca, 2918 sayılı Kanun''a istinaden (48''inci madde ve diğer bütün maddeler) verilmiş olan idari para cezalarının tamamının tahsil edilmiş olması halinde sürücü belgesi geri alma süresi sonunda iade edilir. 1. defada  9.267 TL. (% 25 İndirimli 6.950,25 TL.) 2. defada  11.622 TL. (% 25 İndirimli 8.716,50 TL.) 3 ve 3''ten fazlasında 18.677 TL. (% 25 İndirimli 14.007,75 TL) Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 1867700, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (191, '49/3 - Ticari amaçla yük ve yolcu taşıyan motorlu taşıt s...', 'Ticari amaçla yük ve yolcu taşıyan motorlu taşıt sürücülerinin; taşıt kullanma sürelerine aykırı olarak taşıt kullanması ve bunlara taşıt kullandırılması, Sürücüye, araç sahibine, işleten veya teşebbüse Sürücüler Sürücü aynı zamanda araç sahibi değilse, araç sahibine de 2.167 TL (% 25 İndirimli 1.625,25 TL.), ayrıca işleten veya teşebbüs sahibine de 4.512 TL. (% 25 İndirimli 3.384 TL.) trafik idari para cezası uygulanır. Sürücü aynı zamanda araç sahibi ise araç sahibi yönünden 2.167 TL (% 25 İndirimli 1.625,25 TL.)  trafik idari para cezası uygulanır.', 20, 216700, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (192, '51/2-a - Yönetmelikte belirlenen hız sınırlarını % 10’dan %...', 'Yönetmelikte belirlenen hız sınırlarını % 10’dan % 30’a (otuz dahil) kadar aşmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (193, '51/2-b - Yönetmelikte belirlenen hız sınırlarını % 30’dan %...', 'Yönetmelikte belirlenen hız sınırlarını % 30’dan % 50''ye (elli dahil) kadar aşmak, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL.', 15, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (194, '51/2-c - Yönetmelikte belirlenen hız sınırlarını % 50''den ...', 'Yönetmelikte belirlenen hız sınırlarını % 50''den fazla aşmak, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL. Geriye doğru 1 yıl içinde toplamda  5 defa ihlal edildiğinde 1 yıl süre ile geçici olarak *Sürücü belgesi geri alınanların süresi sonunda psiko-teknik değerlendirme ve psikiyatri uzmanının muayenesi sonucunda sürücü belgesi almasına mani hali olmadığı anlaşılanlara bu Kanun kapsamında verilen trafik idari para cezalarının tahsil edilmiş olması şartıyla belgeleri iade edilir. *Son ihlalin gerçekleştiği tarihten itibaren geriye doğru beş yıl içinde bu kapsamda sürücü belgesi ikinci defa geri alınanların sürücü belgeleri iptal edilir. *Belgesi iptal edilenlerin tekrar sürücü belgesi alabilmeleri için; sürücü kurslarına devam etmeleri ve yapılan sınavlarda başarılı olarak motorlu taşıt sürücüsü sertifikası almaları gerekir. *Bu kişilerin sürücü kurslarında eğitime başlayabilmeleri için tabi tutulacakları psiko-teknik değerlendirme ve psikiyatri uzmanı muayenesi sonucunda sürücülüğe engel hali bulunmadığını gösterir belgenin sürücü kursuna ibrazı zorunludur. Sürücüye 993 TL. ( % 25 İndirimli 744,75 TL) Araç sahibine 2.167 TL (% 25 İndirimli 1.625,25 TL.) İşleten veya teşebbüs sahibine 4.512 TL. (% 25 İndirimli 3.384 TL.) Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 451200, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (195, '51/5-a - Hız sınırlarını tespite yarayan cihazların yerleri...', 'Hız sınırlarını tespite yarayan cihazların yerlerini belirleyen veya sürücüyü ikaz eden cihazları imal veya ithal etmek, İmal veya ithal edenlere 28.161 TL.den 46.972 TL.ye kadar 6-8 ay hafif hapis cezası Cihazlar mahkeme kararıyla müsadere edilir.', 0, 4697200, 4697200, true, NULL);
INSERT INTO public.penalty_types VALUES (196, '51/5-b - Hız sınırlarını tespite yarayan cihazların yerleri...', 'Hız sınırlarını tespite yarayan cihazların yerlerini belirleyen veya sürücüyü ikaz eden cihazları araçlarda bulundurmak, İşletenlere 18.677   TL.den 28.161 TL''ye kadar 4-6 ay hafif hapis cezası Cihazlar mahkeme kararıyla müsadere edilir.', 15, 2816100, 2816100, true, NULL);
INSERT INTO public.penalty_types VALUES (197, '52/1-a - Aracın hızını, kavşaklara yaklaşırken, dönemeçlere...', 'Aracın hızını, kavşaklara yaklaşırken, dönemeçlere girerken, tepe üstlerine yaklaşırken, dönemeçli yollarda ilerlerken, yaya geçitlerine, hemzemin geçitlere, tünellere, dar köprü ve menfezlere yaklaşırken, yapım ve onarım alanlarına girerken azaltmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (198, '52/1-b - Aracının hızını, aracın yük ve teknik özelliğine, ...', 'Aracının hızını, aracın yük ve teknik özelliğine, görüş, yol, hava ve trafik durumunun gerektirdiği şartlara uydurmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (199, '52/1-c - Diğer bir aracı izlerken, hızını kullandığı aracın...', 'Diğer bir aracı izlerken, hızını kullandığı aracın yük ve teknik özelliğine, görüş, yol, hava ve trafik durumunun gerektirdiği şartlara uydurmadan Yönetmelikte belirlenen güvenli mesafeyi bırakmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (200, '52/1-d - Kol ve grup halinde araç kullanırken, araçlar aras...', 'Kol ve grup halinde araç kullanırken, araçlar arasında Yönetmelikte belirtilen esaslara uygun olarak diğer araçların güvenle girebilecekleri açıklığı bırakmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (201, '53/1-a - Sağa dönüş kurallarına riayet etmemek, Sürücülere ...', 'Sağa dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (202, '53/1-b - Sola dönüş kurallarına riayet etmemek, Sürücülere ...', 'Sola dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (203, '53/1-c - Dönel kavşaklarda dönüş kurallarına riayet etmemek...', 'Dönel kavşaklarda dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (204, '53/1-d - Dönel kavşaklarda geriye dönüş kurallarına riayet ...', 'Dönel kavşaklarda geriye dönüş kurallarına riayet etmemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (205, '53/2-a - Sağa ve sola dönüşlerde sürücülerin, kurallara uyg...', 'Sağa ve sola dönüşlerde sürücülerin, kurallara uygun olarak geçiş yapan yayalara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (206, '53/2-b - Sağa ve sola dönüşlerde sürücülerin, varsa bisikle...', 'Sağa ve sola dönüşlerde sürücülerin, varsa bisiklet yolundaki ve bisiklet şeridindeki bisiklet ve elektrikli skuter kullananlara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (207, '53/2-c - Sürücülerin, sola dönüşlerde sağdan ve karşıdan ge...', 'Sürücülerin, sola dönüşlerde sağdan ve karşıdan gelen trafiğe ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (208, '54/1-a - Öndeki aracı geçerken geçme kurallarına riayet etm...', 'Öndeki aracı geçerken geçme kurallarına riayet etmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (209, '54/1-b - Geçmenin yasak olduğu yerlerde önündeki aracı geçm...', 'Geçmenin yasak olduğu yerlerde önündeki aracı geçmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (210, '55/1-a - Geçilmek istenen araç sürücüsünün; duyulur veya gö...', 'Geçilmek istenen araç sürücüsünün; duyulur veya görülür bir geçiş işareti alınca, trafiğin iki yönlü kullanıldığı karayollarında taşıt yolunun sağ kenarından gitmemesi, dörtten fazla şeritli veya bölünmüş karayollarında bulunduğu şeridi izlememesi ve hızını artırması, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (211, '55/1-b - Geçilmek istenen araç sürücüsünün; dar taşıt yolla...', 'Geçilmek istenen araç sürücüsünün; dar taşıt yolları ile trafiğin yoğun olduğu karayollarında yavaş gitme nedeni ile kendisini geçmek için izleyen araçların kolayca ve güvenli geçmelerini sağlamak için; aracını elverdiği oranda sağ kenara almaması, yavaşlamaması, gerektiğinde durmaması, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (212, '55/1-c - Geçilmek istenen araç sürücüsünün; geçiş üstünlüğü...', 'Geçilmek istenen araç sürücüsünün; geçiş üstünlüğü bulunan bir aracın duyulur veya görülür işaretini alınca, bu araçların kolayca ilerlemesini sağlamak için taşıt yolu üzerinde yer açmaması, gerektiğinde durmaması, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (213, '55/2 - Kanunun 54/1 maddesinde yazılı durumlar dışında, g...', 'Kanunun 54/1 maddesinde yazılı durumlar dışında, geçiş yapmak isteyenlere yol vermemek, geçilmekte iken bir başka aracı geçmeye veya sola dönmeye kalkışmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (214, '56/1-a - Şerit izleme ve değiştirme kurallarına uymamak, Sü...', 'Şerit izleme ve değiştirme kurallarına uymamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (215, '56/1-b - İki yönlü trafiğin kullanıldığı taşıt yollarında k...', 'İki yönlü trafiğin kullanıldığı taşıt yollarında karşı yönden gelen araçların geçişini zorlaştıran bir durum varsa; sürücülerin geçişi kolaylaştırmak için aracını sağ kenara yanaştırmaması, gerektiğinde sağa yanaşıp durmaması, dağlık ve dik yokuşlu karayollarında karşılaşma halinde; çıkan araç için geçiş güç veya mümkün değilse, güvenli geçişi sağlamak üzere, inen aracın, varsa önceden sığınma cebine girmemesi, sığınma cebi yoksa sağ kenara yanaşıp durmaması, gerektiği hallerde geri gitmemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (216, '56/1-c - Önlerinde giden araçları Yönetmelikte belirtilen g...', 'Önlerinde giden araçları Yönetmelikte belirtilen güvenli ve yeterli bir mesafeden izlememek (Yakın takip), Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (217, '56/1-d - Araçlarını zorunlu bir neden olmadıkça, diğer araç...', 'Araçlarını zorunlu bir neden olmadıkça, diğer araçların ilerleyişine engel olacak şekilde veya işaretle belirtilen hız sınırının çok altında sürmek, güvenlik nedeni veya verilen herhangi bir talimata uyulması dışında, başkalarını rahatsız edecek veya tehlikeye sokacak şekilde gereksiz ani yavaşlamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (218, '56/1-e - Taşıt yolunun dar olduğu yerlerde aksini gösteren ...', 'Taşıt yolunun dar olduğu yerlerde aksini gösteren bir trafik işareti yoksa motorsuz araçları kullananların motorlu araçlara, otomobil, minibüs, kamyonet, otobüs, kamyon, arazi taşıtı, lastik tekerlekli traktör, iş makinelerini kullananların, yazılış sırasına göre kendisinden öncekilere geçiş kolaylığı sağlamamaları, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (219, '57/1-a - Kavşaklara yaklaşırken kavşaktaki şartlara uyacak ...', 'Kavşaklara yaklaşırken kavşaktaki şartlara uyacak şekilde yavaşlamamak, dikkatli olmamak, geçiş hakkı olan araçlara ilk geçiş hakkını vermemek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (220, '57/1-b - Trafik kolluğu veya ışıklı trafik işaret cihazları...', 'Trafik kolluğu veya ışıklı trafik işaret cihazları veya trafik işaret levhası bulunmayan kavşaklarda; 1.Bütün sürücülerin geçiş üstünlüğüne sahip olan araçlara, 2.Bütün sürücülerin doğru geçmekte olan tramvaylara, 3.Doğru geçen tramvay hattı bulunan karayoluna çıkan sürücülerin bu yoldan gelen araçlara, 4. Bölünmüş yola çıkan sürücülerin bu yoldan geçen araçlara, 5. Tali yoldan ana yola çıkan sürücülerin ana yoldan gelen araçlara, 6. Dönel kavşağa gelen sürücülerin dönel kavşak içindeki araçlara, 7. Bir iz veya mülkten çıkan sürücülerin, karayolundan gelen araçlara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (221, '57/1-c - Kavşak kollarının trafik yoğunluğu bakımından fark...', 'Kavşak kollarının trafik yoğunluğu bakımından farklı oldukları işaretlerle belirlenmemiş kavşaklarda; motorsuz araç sürücülerinin motorlu araçlara, motorlu araçlardan soldaki aracın, sağdan gelen araca geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (222, '57/1-d - Işıklı trafik işaretleri izin verse bile trafik ak...', 'Işıklı trafik işaretleri izin verse bile trafik akımı; kendisini kavşak içinde durmaya zorlayacak veya diğer doğrultudaki trafiğin geçişine engel olacak hallerde  kavşağa girmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (223, '57/1-e - Kavşaklarda gereksiz olarak duraklamak, yavaşlamak...', 'Kavşaklarda gereksiz olarak duraklamak, yavaşlamak, taşıttan inmek veya araçların motorunu durdurmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (224, '57/1-f - Aksine bir işaret olmadıkça, bütün kavşaklarda ara...', 'Aksine bir işaret olmadıkça, bütün kavşaklarda araçların ray üzerinde hareket eden taşıtlara ilk geçiş hakkını vermemesi, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. İndirme-bindirme sırasında sürücülerin; aksine bir işaret bulunmadıkça araçlarını gidiş yönlerine göre yolun en sağ kenarında durdurmaması, yolcularının iniş ve binişlerini sağ taraftan yaptırmaması ve yolcuların da iniş ve binişlerini sağ taraftan yapmaması, Sürücülere ve yolculara 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men Yerleşim birimleri dışındaki karayolunda, zorunlu haller dışında duraklamak veya park etmek, zorunlu hallerde gerekli önlemleri almadan duraklamak veya park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (225, '60/1-a - Taşıt yolu üzerinde duraklamanın yasaklandığının b...', 'Taşıt yolu üzerinde duraklamanın yasaklandığının bir trafik işareti ile belirtilmiş olduğu yerlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (226, '60/1-b - Taşıt yolu üzerinde sol şeritte (raylı sistemin bu...', 'Taşıt yolu üzerinde sol şeritte (raylı sistemin bulunduğu yollar hariç) duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (227, '60/1-c - Taşıt yolu üzerinde yaya ve okul geçitleri ile diğ...', 'Taşıt yolu üzerinde yaya ve okul geçitleri ile diğer geçitlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (228, '60/1-d - Taşıt yolu üzerinde kavşaklar, tüneller, rampalar,...', 'Taşıt yolu üzerinde kavşaklar, tüneller, rampalar, köprüler ve bağlantı yollarında veya buralara yerleşim birimleri içinde beş metre veya yerleşim birimleri dışında yüz metre mesafede duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (229, '60/1-e - Taşıt yolu üzerinde görüşün yeterli olmadığı tepel...', 'Taşıt yolu üzerinde görüşün yeterli olmadığı tepelere yakın yerlerde veya dönemeçlerde duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (230, '60/1-f - Taşıt yolu üzerinde otobüs, tramvay ve taksi durak...', 'Taşıt yolu üzerinde otobüs, tramvay ve taksi duraklarında duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (231, '60/1-g - Taşıt yolu üzerinde duraklayan veya park edilen ar...', 'Taşıt yolu üzerinde duraklayan veya park edilen araçların yanında duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (232, '60/1-h - Taşıt yolu üzerinde işaret levhalarına, yaklaşım y...', 'Taşıt yolu üzerinde işaret levhalarına, yaklaşım yönünde ve park izni verilen yerler dışında; yerleşim birimi içinde onbeş metre ve yerleşim birimi dışında yüz metre mesafede duraklamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (233, '61/1-a - Taşıt yolu üzerinde duraklamanın yasaklandığı yerl...', 'Taşıt yolu üzerinde duraklamanın yasaklandığı yerlere park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (235, '61/1-c - Taşıt yolu üzerinde geçiş yolları önünde veya üzer...', 'Taşıt yolu üzerinde geçiş yolları önünde veya üzerinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (236, '61/1-d - Taşıt yolu üzerinde belirlenmiş yangın muslukların...', 'Taşıt yolu üzerinde belirlenmiş yangın musluklarına her iki yönden beş metrelik mesafe içinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (237, '61/1-e - Kamu hizmeti yapan yolcu taşıtlarının duraklarını ...', 'Kamu hizmeti yapan yolcu taşıtlarının duraklarını belirten levhalara iki yönden onbeş metrelik mesafe içinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (238, '61/1-f - Taşıt yolu üzerinde üç veya daha fazla ayrı taşıt ...', 'Taşıt yolu üzerinde üç veya daha fazla ayrı taşıt yolu olan karayolunda ortadaki taşıt yolunda park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (239, '61/1-g - Taşıt yolu üzerinde kurallara uygun şekilde park e...', 'Taşıt yolu üzerinde kurallara uygun şekilde park etmiş araçların çıkmasına engel olacak yerlerde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (240, '61/1-h - Taşıt yolu üzerinde geçiş üstünlüğü olan araçların...', 'Taşıt yolu üzerinde geçiş üstünlüğü olan araçların giriş veya çıkışının yapıldığının belirlendiği işaret levhasından onbeş metre mesafe içinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (241, '61/1-ı - Taşıt yolu üzerinde işaret levhalarında park etme ...', 'Taşıt yolu üzerinde işaret levhalarında park etme izni verilen süre veya zamanın dışında park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (242, '61/1-j - Taşıt yolu üzerinde kamunun faydalandığı ve Yönetm...', 'Taşıt yolu üzerinde kamunun faydalandığı ve Yönetmelikte belirtilen yerlerin giriş ve çıkış kapılarına her iki yönde beş metrelik mesafe içinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (243, '61/1-k - Taşıt yolu üzerinde park için yer ayrılmamış veya ...', 'Taşıt yolu üzerinde park için yer ayrılmamış veya trafik işaretleri ile belirtilmemiş alt geçit, üst geçit ve köprüler üzerinde veya bunlara on metrelik mesafe içinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (244, '61/1-l - Taşıt yolu üzerinde park etmek için tespit edilen ...', 'Taşıt yolu üzerinde park etmek için tespit edilen süre ve şeklin dışında park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (245, '61/1-m - Taşıt yolu üzerinde belirli kişi, kurum ve kuruluş...', 'Taşıt yolu üzerinde belirli kişi, kurum ve kuruluşlara ait araçlara, Yönetmelikteki esaslara göre ayrılmış ve bir işaret levhası ile belirlenmiş park yerlerinde park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (246, '61/1-n - Yönetmelikte belirtilen haller dışında yaya yollar...', 'Yönetmelikte belirtilen haller dışında yaya yollarında park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (247, '61/1-o - Taşıt yolu üzerinde engellilerin araçları için ayr...', 'Taşıt yolu üzerinde engellilerin araçları için ayrılmış park yerlerinde park etmek, Sürücülere 1.986 TL. % 25 İndirimli 1.489,50 TL. Yasaklara aykırı park edilen araçlar, trafik kolluğunca kaldırılabilir, masraflar ödenmeden araç teslim edilmez. Yerleşim birimleri içindeki karayolunda, bir trafik işaretiyle izin verilmedikçe ve yükleme, boşaltma, indirme, bindirme, arızalanma gibi zorunlu nedenler dışında kamyon, otobüs ve bunların katarlarını, lastik tekerlekli traktörler ile her türlü iş makinelerini park etmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Araçlarda nicelik ve nitelikleri yönetmelikte belirtilen şartlara uygun ışık donanımı bulundurmamak, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL. Uygun olmayan ışık donanımı trafik kolluğunca söktürülür.', 10, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (248, '64/1-a-1 - Yerleşim birimleri dışındaki karayollarında gecele...', 'Yerleşim birimleri dışındaki karayollarında geceleri seyrederken, yeterince aydınlatılmamış tünellere girerken, benzeri yer ve hallerde (karşılaşmalar ve öndeki aracı izleme halleri dışında) uzağı gösteren ışıkları yakmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (263, '65/1-c - Azami yüklü ağırlık veya izin verilen azami yüklü ...', 'Azami yüklü ağırlık veya izin verilen azami yüklü ağırlık aşılmamış olsa bile azami dingil ağırlıklarını aşmak, İşletenlere 8.463 TL. % 25 İndirimli 6.347,25 TL.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (264, '65/1-d - Karayolu yapısı ve kapasitesi ile trafik güvenliği...', 'Karayolu yapısı ve kapasitesi ile trafik güvenliği bakımından tehlikeli olabilecek tarzda yükleme yapmak, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (249, '64/1-a-2 - Geceleri, yerleşim birimleri dışında ve içinde kar...', 'Geceleri, yerleşim birimleri dışında ve içinde karayollarındaki karşılaşmalarda, bir aracı takip ederken, bir aracı geçerken yan yana gelinceye kadar, gündüzleri ise görüşü azaltan sisli, yağışlı ve benzeri havalarda yakını gösteren ışıkların yakılmaması, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (250, '64/1-a-3 - Kuyruk (arka kenar-arka park lambası) ışıklarını u...', 'Kuyruk (arka kenar-arka park lambası) ışıklarını uzağı veya yakını gösteren ışıklarla birlikte kullanmamak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (251, '64/1-b-1 - Gece sis ışıklarını; sisli, karlı ve sağanak yağmu...', 'Gece sis ışıklarını; sisli, karlı ve sağanak yağmurlu havalar dışında diğer farlarla birlikte yakmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (252, '64/1-b-2 - Dönüş ışıklarını geç anlamında kullanmak, Sürücüle...', 'Dönüş ışıklarını geç anlamında kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 5, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (253, '64/1-b-3 - Gece karşılaşmalarda ışıkları söndürmek, Sürücüler...', 'Gece karşılaşmalarda ışıkları söndürmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (254, '64/1-b-4 - Öndeki aracı geçerken, uyarı için çok kısa süre dı...', 'Öndeki aracı geçerken, uyarı için çok kısa süre dışında uzağı gösteren ışıkları yakmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (255, '64/1-b-5 - Yönetmelikte belirlenen esaslara aykırı ışık takma...', 'Yönetmelikte belirlenen esaslara aykırı ışık takmak ve kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 20, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (256, '64/1-b-6 - Sadece park lambaları ile seyretmek, Sürücülere 99...', 'Sadece park lambaları ile seyretmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (257, '65/1-a - Taşıma sınırı üstünde yolcu almak, Uymayanlara 777...', 'Taşıma sınırı üstünde yolcu almak, Uymayanlara 777 TL. % 25 İndirimli 582,75 TL. Ayrıca bütün sorumluluk ve giderler araç işletenine ait olmak üzere, fazla yolcular en yakın yerleşim biriminde indirilir.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (258, '65/1-b(a) - Azami yüklü ağırlığı veya izin verilen azami yüklü...', 'Azami yüklü ağırlığı veya izin verilen azami yüklü ağırlığı %3,75 + 500 Kg dan %10 fazlasına kadar aşmak, Uymayan işletenlere ve yük gönderenlere 8.463 TL. % 25 İndirimli 6.347,25 TL. 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (259, '65/1-b(b) - Azami yüklü ağırlığı veya izin verilen azami yüklü...', 'Azami yüklü ağırlığı veya izin verilen azami yüklü ağırlığı %3,75 + 500 Kg dan %15 fazlasına kadar aşmak, Uymayan işletenlere ve yük gönderenlere 16.975 TL. % 25 İndirimli 12.731,25 TL. 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (260, '65/1-b (c) - Azami yüklü ağırlığı veya izin verilen azami yüklü...', 'Azami yüklü ağırlığı veya izin verilen azami yüklü ağırlığı %3,75 + 500 Kg dan %20  fazlasına kadar aşmak Uymayan işletenlere ve yük gönderenlere 25.469 TL. % 25 İndirimli 19.101,75 TL. 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (261, '65/1-b (d) Azami yüklü ağırlığı veya izin verilen azami yüklü ağırlığı %3,75 + 500 Kg dan - %25  fazlasına kadar aşmak, Uymayan işletenlere ve...', '%25  fazlasına kadar aşmak, Uymayan işletenlere ve yük gönderenlere 34.013 TL. % 25 İndirimli 25.509,75 TL. Gerekli şartlar sağlanıncaya kadar 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (262, '65/1-b (e) - Azami yüklü ağırlığı veya izin verilen azami yüklü...', 'Azami yüklü ağırlığı veya izin verilen azami yüklü ağırlığı %3,75 + 500 Kg dan %25''in üzerinde  fazla aşmak, Uymayan işletenlere ve yük gönderenlere 51.026 TL. % 25 İndirimli 38.269,50 TL. Gerekli şartlar sağlanıncaya kadar 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz.', 0, 5000, 5000, true, NULL);
INSERT INTO public.penalty_types VALUES (265, '65/1-e - Tehlikeli ve zararlı maddelerin, gerekli izin ve t...', 'Tehlikeli ve zararlı maddelerin, gerekli izin ve tedbirler alınmadan taşınması, Uymayanlara 4.198 TL. % 25 İndirimli 3.148,50 TL. Gerekli şartlar sağlanıncaya kadar Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 5000, 5000, true, NULL);
INSERT INTO public.penalty_types VALUES (266, '65/1-f - Ağırlık ve boyutları bakımından taşınması özel izn...', 'Ağırlık ve boyutları bakımından taşınması özel izne bağlı olan eşyayı izin almadan yüklemek, taşımak ve taşıttırmak, Sürücülere, uymayan işletenlere ve yük gönderenlere 4.198 TL. % 25 İndirimli 3.148,50 TL. Gerekli izinler sağlanıncaya kadar 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz.', 15, 5000, 5000, true, NULL);
INSERT INTO public.penalty_types VALUES (267, '65/1-g - Gabari dışı yük yüklemek, taşınan yük üzerine veya...', 'Gabari dışı yük yüklemek, taşınan yük üzerine veya araç dışına yolcu bindirmek, 1-Uymayan işletenlere 2-Yük gönderenlere 1-8.463 TL. 2-16.975 TL. 1-% 25 İndirimli 6.347,25 TL. 2-% 25 İndirimli 12.731,25 TL. Yük uygun duruma getirilinceye kadar 1- İşleten ile gönderenin aynı olması halinde, işleten ve gönderen için öngörülen cezaların toplamı yerine, öngörülen cezalardan sadece biri uygulanır. 2- Gönderenin birden fazla olması halinde işleten ve gönderen için uygulanacak idari para cezalarının toplamı işletene uygulanır. 3- Gönderenin tespit edilememesi halinde sadece işletene idari para cezası uygulanır, gönderen yönünden işletene idari para cezası uygulanmaz. 4-Ayrıca, bütün sorumluluk ve giderler araç işletenine ait olmak üzere, fazla yolcular en yakın yerleşim biriminde indirilir.', 0, 1697500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (268, '65/1-h - Yükü, karayoluna değecek, düşecek, dökülecek, saçı...', 'Yükü, karayoluna değecek, düşecek, dökülecek, saçılacak, sızacak, akacak, kayacak, gürültü çıkaracak şekilde yüklemek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (269, '65/1-i - Yükü, her çeşit yolda ve yolun her eğiminde dengey...', 'Yükü, her çeşit yolda ve yolun her eğiminde dengeyi bozacak, yoldaki bir şeye takılacak ve sivri çıkıntılar hasıl edecek şekilde yüklemek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (270, '65/1-j - Sürücünün görüşüne engel olacak, aracın sürme güve...', 'Sürücünün görüşüne engel olacak, aracın sürme güvenliğini bozacak ve tescil plakaları, ayırım işaretleri, dur ve dönüş ışıkları ile yansıtıcıları örtecek şekilde yükleme yapmak, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (271, '65/1-k - Çeken ve çekilen araçlarla ilgili şartlar ve tedbi...', 'Çeken ve çekilen araçlarla ilgili şartlar ve tedbirler yerine getirilmeden araçları çekmek, Uymayanlara 2.072 TL. % 25 İndirimli 1.554 TL. Gerekli şartlar sağlanıncaya kadar', 15, 155400, 155400, true, NULL);
INSERT INTO public.penalty_types VALUES (272, '65/4 - Ağırlık ve boyut kontrol mahallerinde işaret, ışık...', 'Ağırlık ve boyut kontrol mahallerinde işaret, ışık, ses veya görevlilerin dur ikazına rağmen tartı veya ölçü kontrolüne girmeden seyrine devam etmek, İşletenlere 16.975 TL. % 25 İndirimli 12.731,25 TL. Tescil plakalarına göre idari para cezası uygulanır. 65/A Yolcu ve eşya taşımalarında kullanılan araçlarda, yılın zorunlu tutulan dönemlerinde kış lastiği kullanmamak, İşletenlere 5.856 TL. % 25 İndirimli 4.392 TL. Bu araçların lastiklerini uygun hale getirebilecekleri en yakın yerleşim birimine kadar gitmelerine denetimle görevli olanlar tarafından izin verilir. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men 1- Ayrı bisiklet yolu veya şeridi varsa, bisiklet ve elektrikli skuterleri taşıt yolunda sürmek, 2- Bisiklet, elektrikli skuter, motorlu bisiklet ve motosikletleri yayaların kullanmasına ayrılmış yerlerde sürmek, 3- Bisiklet, elektrikli skuter, motorlu bisiklet ve motosikletlerin ikiden fazlasını taşıt yolunun bir şeridinde yan yana sürmek, 4- Bisiklet, motorlu bisiklet ve motosiklet ile diğer araçlar izlenirken, geçilirken, manevra yapılırken; karayolunu kullananların hareketini zorlaştırıcı, tehlike doğurucu davranışlarda bulunmak, 5- İzin alınarak yapılan gösteriler dışında, bisiklet, motorlu bisiklet ve motosiklet üzerinde akrobatik hareketler yapmak, 6- Bisiklet, motorlu bisiklet ve motosikleti başka bir araca bağlanarak, asılıp tutunarak sürmek, 7- Bisikleti, iki elini bırakarak sürmek, 8- Elektrikli skuter ve motorlu bisikleti manevra dışında tek elle sürmek, 9- Motosikleti devamlı iki elle sürmemek, 10- Elektrikli skuter ile sırtta taşınabilen kişisel eşya harici yük ve yolcu taşımak, 11- Elektrikli skuteri otoyol, şehirlerarası karayolları ve azami hız sınırı 50 km/s üzerinde olan karayollarında kullanmak, 12- Bisiklet, motorlu bisiklet ve motosikletlerde sürücü arkasında yeterli bir oturma yeri olmadıkça başka kişileri bindirmek, 13- Bisiklet, motorlu bisiklet ve sepetsiz motosikletlerde sürücü arkasında yeterli oturma yeri olsa bile bir kişiden fazlasını taşımak, 14- Bisiklet, motorlu bisiklet ve sepetsiz motosikletlerle yönetmelikte belirtilen şartlara aykırı olarak yük taşımak, 15- Bisiklet, motorlu bisiklet ve motosikletlerde elde bagaj, paket ve benzerlerini taşımak. Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 15, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (273, '67/1-a - Park yapmış taşıtlar arasından çıkarken, duraklark...', 'Park yapmış taşıtlar arasından çıkarken, duraklarken veya park yaparken taşıt yolunun sağına veya soluna yanaşırken, sağa veya sola dönerken, karayolunu kullananlar için tehlike doğurabilecek ve bunların hareketlerini zorlaştıracak şekilde davranmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (274, '67/1-b - Yönetmelikte belirtilen şartlar dışında geriye dön...', 'Yönetmelikte belirtilen şartlar dışında geriye dönmek veya geriye gitmek, izin verilen hallerde bu manevraları yaparken karayolunu kullananlar için tehlike veya engel yaratmak, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (275, '67/1-c - Dönüşlerde veya şerit değiştirmelerde niyetini dön...', 'Dönüşlerde veya şerit değiştirmelerde niyetini dönüş işaret ışıkları veya kol işareti ile açıkça ve yeterli şekilde belirtmemek, işaretlere manevra süresince devam etmemek ve biter bitmez sona erdirmemek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (276, '67/1-d - Herhangi bir zorunluluk olmaksızın, karayollarında...', 'Herhangi bir zorunluluk olmaksızın, karayollarında dönüş kuralları dışında bilerek ve isteyerek aracın el freninin çekilmesi suretiyle veya başka yöntemlerle aracın ani olarak yönünün değiştirilmesi veya kendi etrafında döndürülmesi, Sürücülere 46.392 TL. % 25 İndirimli 34.794 TL. Geriye doğru beş yıl içinde; 1.defasında sürücü bel.60 gün süreyle geçici olarak geri alınır. 2. defasında sürücü belgesi iptal edilir. Sürücü araç sahibi ise  araç 60 gün  trafikten men. Sürücü araç sahibi değilse araç trafikten men edilmeyecek Sürücü *Bu şekilde sürücü belgesi geri alınanlar psiko-teknik değerlendirmeden ve psikiyatri uzmanının muayenesinden geçirilerek sürücü belgesi almasına mâni hali olmadığı anlaşılanlara bu Kanun kapsamında verilen trafik idari para cezalarının tahsil edilmiş olması şartıyla geri alma süresi sonunda belgeleri iade edilir. **Son ihlalin gerçekleştiği tarihten geriye doğru beş yıl içinde bu madde kapsamında sürücü belgesi 2. defa geri alınanların sürücü belgeleri iptal edilir. ***Belgesi iptal edilenlerin tekrar sürücü belgesi alabilmeleri için; sürücü kurslarına devam etmeleri ve yapılan sınavlarda başarılı olarak motorlu taşıt sürücüsü sertifikası almaları gerekir. Bu kişilerin sürücü kurslarında eğitime başlayabilmeleri için tabi tutulacakları psiko-teknik değerlendirme ve psikiyatri uzmanı muayenesi sonucunda sürücülüğe engel hali bulunmadığını gösterir belgenin sürücü kursuna ibrazı zorunludur.', 0, 3479400, 3479400, true, NULL);
INSERT INTO public.penalty_types VALUES (277, '68/1-a-1, 68/1-a-2 ve 68/1-a-3’te sayılan haller dışında; taşıt yolu bitişiğinde ve - yakınında yaya yolu, banket veya alan bulunduğu ha...', 'yakınında yaya yolu, banket veya alan bulunduğu halde yayaların bisiklet yolunda veya şeridinde ya da  taşıt yolunda yürümesi, Yayalara 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (278, '68/1-a-1 - 1-Diğer yayalar için ciddi rahatsızlık verecek boy...', '1-Diğer yayalar için ciddi rahatsızlık verecek boyutta eşyaları iten veya taşıyan kişilerin taşıt yolunu kullanırken Yönetmelikte belirtilen tedbirleri almamaları ve taşıt yolunun en sağ şeridinden fazla kısmını işgal etmeleri, 2-Bir yetkili veya görevli yönetiminde düzenli şekilde taşıt yolunda yürüyen yaya kafilelerinin, gece ve gündüz görüşün az olduğu hallerde çarpmayı önleyici uyarıcı tedbirleri almadan ve imkan oranında tek sıra halinde yürümemeleri ve taşıt yolunun en sağ şeridinden fazla kısmını işgal etmeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (279, '68/1-a-2 - Yayaların yürümesine ayrılmış kısımların kullanılm...', 'Yayaların yürümesine ayrılmış kısımların kullanılmasının mümkün olmadığı veya bulunmadığı hallerde, yayaların taşıt yolunun kenara yakın olan kısmı dışında yürümeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (280, '68/1-a-3 - Her iki tarafta da yaya yolu ve banket bulunmayan ...', 'Her iki tarafta da yaya yolu ve banket bulunmayan veya kullanılır durumda olmayan iki yönlü trafiğin kullanıldığı karayollarında, yayaların taşıt yolunun sol kenarını izlememeleri, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (281, '68/1-b - Yüz metreye kadar mesafede yaya geçidi veya kavşak...', 'Yüz metreye kadar mesafede yaya geçidi veya kavşak bulunduğu halde yayaların, karşı tarafa geçmek için taşıt yolunun yaya ve okul geçidi veya kavşak giriş ve çıkışları dışında herhangi bir yerini kullanmaları. Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (282, '68/1-b-1 - Yaya ve okul geçitlerinin bulunduğu yerlerdeki geç...', 'Yaya ve okul geçitlerinin bulunduğu yerlerdeki geçitlerde yayalar için ışıklı işaret olduğu halde yayaların bu işaretlere uymaması, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (283, '68/1-b-2 - Geçitte yayalar için ışıklı işaret yoksa ve geçit ...', 'Geçitte yayalar için ışıklı işaret yoksa ve geçit sadece taşıt trafiği ışıklı işareti veya yetkili kişi tarafından yönetiliyorsa, geçecekleri doğrultu açılmadan yayaların  taşıt yoluna girmesi, Yayalara 993 TL. % 25 İndirimli 744,75 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (284, '68/1-c - Yaya yollarında, geçitlerde veya zorunlu hallerde;...', 'Yaya yollarında, geçitlerde veya zorunlu hallerde; taşıt yolu üzerinde bulunan yayaların trafiği engelleyecek veya tehlikeye düşürecek şekilde davranışlarda bulunmaları veya buraları saygısızca kullanmaları, Yayalara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (285, '69/1 - Yerleşim yerleri dışındaki karayollarında, taşıt y...', 'Yerleşim yerleri dışındaki karayollarında, taşıt yolu üzerinde; zorunlu haller dışında hayvan bulundurmak, binek hayvanları ve sürüler ile elle sürülen araçları trafik kurallarına uymadan sevk ve idare etmek veya ettirmek, başıboş bırakmak, Uymayanlara 993 TL. % 25 İndirimli 744,75 TL.', 0, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (299, '82/1-a - Kazaya karışan araç sürücülerinin veya kaza mahall...', 'Kazaya karışan araç sürücülerinin veya kaza mahallinden geçen araç sürücülerinin ilk yardım önlemlerini almaması, kolluğa ve sağlık kuruluşuna haber vermemesi ve yetkililerin talebi halinde yaralıları en yakın sağlık kuruluşuna götürmemesi, Sürücülere ve uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (300, '82/1-b - Şehirlerarası karayolları kenarındaki akaryakıt is...', 'Şehirlerarası karayolları kenarındaki akaryakıt istasyonlarında sağlık malzemesini her an kullanılabilir durumda bulundurmamak, Sahip ve işletenlere 2.167 TL. % 25 İndirimli 1.625,25 TL. Bulundurulması zorunlu olan ilk yardım malzemeleri 15/5/1997 tarihli ve 22990 sayılı Resmî Gazete’de yayımlanan Karayolları Kenarında Yapılacak ve Açılacak Tesisler Hakkında Yönetmeliğin ek-11''inde yer almaktadır.', 0, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (301, '82/1-c - Tamirhane, servis istasyonu ve garaj gibi yerlere ...', 'Tamirhane, servis istasyonu ve garaj gibi yerlere ölüm veya yaralanma ile sonuçlanan bir kaza geçirmiş olduğu belli olan veya üzerinde suç belirtisi bulunan bir araç geldiğinde, kolluğa haber vermemek ve deftere işlememek, Sahip ve sorumlulara 2.167 TL. % 25 İndirimli 1.625,25 TL. Zorunlu mali sorumluluk sigortası yaptırmamak, İşletenlere 993 TL. % 25 İndirimli 744,75 TL. Eksikliği giderilinceye kadar İlgili kayıtlarından, zorunlu mali sorumluluk sigortasının geçerli olduğu tespit edilen araçlar için sigorta poliçesi ibraz zorunluluğu aranmaz. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men Sigortalı aracı işletenlerin değişmesi halinde 15 gün içerisinde sigortacıya bildirmemek, Aracı devredenlere 993 TL. % 25 İndirimli 744,75 TL. Zarar gören kişilerin kaza veya zarara ilişkin belgelerin ibrazını müteakip 8 iş günü içinde, zorunlu mali sorumluluk sigortası sınırları içerisinde kalan miktarları hak sahibine ödememek, Sigortacılara 70.594 TL. Sigorta şirketinin zorunlu mali sorumluluk sigortası yapmaması, Sigorta şirketlerine 70.594 TL. Gözetim, onarım, bakım, alım, satım veya araçta değişiklik yapılması amacıyla kendisine teslim edilen araçların zorunlu mali sorumluluk sigortasını yaptırmamak, Mesleki faaliyette bulunanlara 70.594 TL. Bu sigortayı yaptırmayan teşebbüs sahiplerinin iş yerleri, mahallin en büyük mülki amirince 15 güne kadar faaliyetten men edilir. Trafik ihlalinin yapıldığı tarihten geriye doğru 1 yıl içerisinde 100 ceza puanını doldurmak, Sürücülere 1. defasında 2 ay 2. defasında 4 ay geçici olarak 3. defasında  daimi iptal 100 ceza puanını doldurması nedeniyle sürücü belgesi; 1) Birinci defa geri alınanların belgeleri Trafik ve Çevre Bilgisi Eğitimi tamamlandıktan sonra, 2) İkinci defa geri alınanların belgeleri psiko-teknik değerlendirme ve psikiyatri uzmanının muayenesi sonucunda sürücülük yapmasına engel hali yoksa süresi sonunda iade edilir. 3) 100 ceza puanını doldurması nedeniyle üçüncü defa alınanlar ise belgenin iptal edilmesi için Sulh Ceza Hakimliğine sevk edilir. 118/5 Asli kusurlu olarak, ölümle sonuçlanan trafik kazalarına sebebiyet vermek, Sürücülere 1 yıl geçici olarak Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men 123/4 Yazılı uyarıya rağmen belirlenecek süre içinde kurslarını Kanun ve Yönetmelik şartlarına uygun duruma getirmemek, Kurs sahiplerine 11.622 TL. Kurs 15 günden az olmamak üzere mülki amirlerce geçici olarak kapatılır. 123/5 Gerekli makamdan izin ve belge almadan sürücü kursları açmak, Kurs sahiplerine 70.594 TL. 3-6 ay hafif hapis cezası Belge alınmadan açılan kurslar trafik kolluğunca kapatılır. 131/6-a Yetkisiz olarak tescil plakası basmak, Uymayanlara 92.610 TL. % 25 İndirimli 69.457,50 TL. İdari para cezası 5326 sayılı Kabahatler Kanunu''nun 22''nci maddesi 2''nci fıkrası uyarınca ilgili kamu kurum ve kuruluşunun en üst amiri tarafından verilir. Ayrıca, Türk Ceza Kanunu''nun 204''üncü maddesinden adli işlem yapılır. 131/6-b Yetkisiz olarak tescil plakası dağıtmak, Uymayanlara 92.610 TL. % 25 İndirimli 69.457,50 TL. İdari para cezası 5326 sayılı Kabahatler Kanunu''nun 22''nci maddesi 2''nci fıkrası uyarınca ilgili kamu kurum ve kuruluşunun en üst amiri tarafından verilir. Ayrıca, Türk Ceza Kanunu''nun 204''üncü maddesinden adli işlem yapılır. 131/6-c Trafik şube veya bürolarında ve motorlu taşıt sürücüleri kurslarında iş sahipleri ve kursiyerlerce verilmesi ve kullanılması lüzumlu kağıtları yetkisiz olarak basmak, Uymayanlara 92.610 TL. % 25 İndirimli 69.457,50 TL. İdari para cezası 5326 sayılı Kabahatler Kanunu''nun 22''nci maddesi 2''nci fıkrası uyarınca ilgili kamu kurum ve kuruluşunun en üst amiri tarafından verilir. Ayrıca, Türk Ceza Kanunu''nun 204''üncü maddesinden adli işlem yapılır. 131/6-d Trafik şube veya bürolarında ve motorlu taşıt sürücüleri kurslarında iş sahipleri ve kursiyerlerce verilmesi ve kullanılması lüzumlu kağıtları yetkisiz olarak dağıtmak, Uymayanlara 92.610 TL. % 25 İndirimli 69.457,50 TL. İdari para cezası 5326 sayılı Kabahatler Kanunu''nun 22''nci maddesi 2''nci fıkrası uyarınca ilgili kamu kurum ve kuruluşunun en üst amiri tarafından verilir. Ayrıca, Türk Ceza Kanunu''nun 204''üncü maddesinden adli işlem yapılır. Ek-2/1 Araçları motorlu araç tescil belgesinde gösterilen maksadın dışında kullanmak ve sürülmesine izin vermek, Sürücülere ve araç sahiplerine 9.267 TL. % 25 İndirimli 6.950,25 TL. 15 gün Sürücü aynı zamanda araç sahibi değilse, ayrıca, tescil plakasına da aynı miktar için trafik idari para cezası karar tutanağı düzenlenir. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men Ek-2/3-a 5216 sayılı Kanun ile 5393 sayılı Kanun kapsamında ilgili belediyeden çalışma izni/ruhsatı almadan belediye sınırları dâhilinde yolcu taşımak, Sürücülere 46.392 TL. % 25 İndirimli 34.794 TL. Bir yıl içerisinde tekerrürü halinde; 92.784 TL. %25 İndirimli 69.588 TL. 60 gün İşleteni veya sahibi, sürücüsünün kendisi olup olmadığına bakılmaksızın aracın bu maddenin üçüncü fıkrasına aykırı olarak kullanılmaması hususunda gerekli tedbirleri almak ve denetimini yapmakla yükümlüdür. Ek-2/3-b 5216 sayılı Kanun ile 5393 sayılı Kanun kapsamında ilgili belediyeden alınan izin/ruhsatta belirtilen faaliyet konusu dışında belediye sınırları dâhilinde yolcu taşımak, Sürücülere 18.677 TL. % 25 İndirimli 14.007,75 TL. Bir yıl içerisinde tekerrürü halinde; 37.354 TL. %25 İndirimli 28.015,50 TL. 30 gün İşleteni veya sahibi, sürücüsünün kendisi olup olmadığına bakılmaksızın aracın bu maddenin üçüncü fıkrasına aykırı olarak kullanılmaması hususunda gerekli tedbirleri almak ve denetimini yapmakla yükümlüdür. Ek-2/3-c 5216 sayılı Kanun ile 5393 sayılı Kanun kapsamında ilgili belediyeden alınan izin/ruhsatta belirtilen çalışma bölgesi/güzergah dışında belediye sınırları dâhilinde yolcu taşımak, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL. Bir yıl içerisinde tekerrürü halinde; 18.534 TL. %25 İndirimli 13.900,50 TL. 15 gün İşleteni veya sahibi, sürücüsünün kendisi olup olmadığına bakılmaksızın aracın bu maddenin üçüncü fıkrasına aykırı olarak kullanılmaması hususunda gerekli tedbirleri almak ve denetimini yapmakla yükümlüdür. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men Ek 2/5 5216 sayılı Kanun ile 5393 sayılı Kanun kapsamında ilgili belediye tarafından tahdit veya tahsis kapsamına alınmış ve bu kapsamda verilmiş çalışma izninin/ruhsatının süresi bittiği halde, belediye sınırları dahilinde yolcu taşımak, Sürücülere 9.267 TL. % 25 İndirimli 6.950,25 TL. Eksikliği giderilinceye kadar Ek-2/6 Ayırıcı işareti bulunmayan ve 5216 sayılı Kanun ve 5393 sayılı Kanun kapsamında ilgili belediyeden çalışma izni/ruhsatı almadan, alınan izin/ruhsatta belirtilen faaliyet konusu dışında, alınan izin/ruhsatta belirtilen çalışma bölgesi/güzergah dışında faaliyet gösteren araçlardan taşımacılık hizmeti almak, Yolculara 3.084 TL. % 25 İndirimli 2.313 TL. Ek-6 Görevini kötüye kullanmak. Fahri Trafik Müfettişlerine İki aydan altı aya kadar hafif hapis cezası Ayrıca, ilgili valilikçe Fahri Trafik Müfettişliği görevine son verilir. Ek-8 Zorunlu mali sorumluluk sigortası yaptıranlar ile sigorta yaptırılan araçlara ait bilgileri Türkiye Sigorta ve Reasürans Şirketleri Birliğine göndermemek, sigortasını yaptırmamış işletenleri tespit amacıyla zorunlu mali sorumluluk sigortası poliçeleri ile ilgili olarak İçişleri Bakanlığınca istenecek bilgileri vermemek, Sigorta şirketlerine 70.594 TL.', 99, 7059400, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (286, '69/2 - Başıboş hayvan bırakma yasağına riayet etmeyerek, ...', 'Başıboş hayvan bırakma yasağına riayet etmeyerek, trafik kazasına sebebiyet vermek, Uymayanlara 3 ay hafif hapis cezaı Gerekli makamdan izin almadan karayolu üzerinde yarış ve koşu düzenlemek, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL. Görevlilerce derhal durdurulur. Zorunluluk olmadığı halde geçiş üstünlüğü hakkını kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Ses, müzik, görüntü ve haberleşme cihazlarını Yönetmelikte belirtilen şartlara aykırı olarak araçlarda bulundurmak, bu tür cihazları kamunun rahat ve huzurunu bozacak şekilde kullanmak, Sürücülere 993 TL. % 25 İndirimli 744,75 TL. Cihazlar araçlardan söktürülür. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men 73/a Karayollarında kamunun rahat ve huzurunu bozacak veya kişilere zarar verecek şekilde; su, çamur ve benzerlerini sıçratmak, kişileri korkutmak/şaşırtmak, özel amaçlarla keyfi ya da kasıtlı davranışlarda bulunarak yaya veya araç trafiğinin seyir emniyetini ihlal etmek suretiyle tedbirsiz ve saygısız davranışlarda bulunarak araç sürmek Uymayanlara 993 TL. % 25 İndirimli 744,75 TL. 73/b Araçlardan bir şey atmak veya dökmek, Uymayanlara 993 TL. % 25 İndirimli 744,75 TL. 73/c Sürücülerin, seyir halinde cep veya araç telefonu ya da benzer haberleşme cihazlarını ele alarak kullanması, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL. Cep ve araç telefonları ile benzeri haberleşme cihazlarının sürücüler tarafından çeşitli elektronik sistemler vasıtasıyla ele alınmadan kullanılıyor olması halinde bu madde hükümleri uygulanmaz. 74/a Görevli bir kişi veya ışıklı trafik işareti bulunmayan ancak trafik işareti veya levhalarıyla belirlenmiş kavşak giriş ve çıkışlarına yaklaşırken yavaşlamamak varsa buralardan geçen veya geçmek üzere bulunan yayalara durarak ilk geçiş hakkını vermemek Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL. 74/b Görevli bir kişi veya ışıklı trafik işareti bulunmayan ancak trafik işareti veya levhalarıyla belirlenmiş yaya veya okul geçitlerine yaklaşırken yavaşlamamak, varsa buralardan geçen veya geçmek üzere bulunan yayalara durarak ilk geçiş hakkını vermemek, Sürücülere 4.512 TL. % 25 İndirimli 3.384 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men Okul taşıtlarının “DUR” işaretini yaktıklarında diğer araçların durmaması; “DUR” işaretinin öğrencilerin binmeleri/inmeleri veya Yönetmelikte belirtilen haller dışında yakılması, okul taşıtlarının Karayolları Trafik Yönetmeliği ve Okul Servis Araçları Yönetmeliğinde belirtilen hususlara uymadan kullanılması, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 15, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (287, '76/1-a - Demiryolu geçitlerini, geçidin durumuna uygun olma...', 'Demiryolu geçitlerini, geçidin durumuna uygun olmayan hızla geçmek, ışıklı veya sesli işaretin vereceği "DUR" talimatına uymamak, taşıt yolu üzerine indirilmiş veya indirilmekte olan tam veya yarım bariyerler varken geçide girmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (288, '76/1-b - Işıklı işaret ve bariyerle donatılmamış demiryolu ...', 'Işıklı işaret ve bariyerle donatılmamış demiryolu geçitlerini geçmeden önce, durmamak, herhangi bir demiryolu aracının yaklaşmadığına emin olmadan geçmek, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (289, '77/1-b - Gözleri görmeyen ve yönetmelikte gösterilen özel i...', 'Gözleri görmeyen ve yönetmelikte gösterilen özel işaret ve benzerlerini taşıyan kişilerin, taşıt yolu üzerinde bulunmaları halinde, sürücülerin yavaşlamamaları ve gerekiyorsa durmamaları ve yardımcı olmamaları, Sürücülere 2.167 TL. % 25 İndirimli 1.625,25 TL.', 15, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (290, '77/1-c - Bir yetkili veya görevli yönetimindeki yürüyüş kol...', 'Bir yetkili veya görevli yönetimindeki yürüyüş kolları arasından geçmek, Sürücülere 993 TL. % 25 İndirimli 744,75 TL.', 10, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (291, '78/1-a - Bulundurulma zorunluluğu olan araçlarda emniyet ke...', 'Bulundurulma zorunluluğu olan araçlarda emniyet kemeri /çocuk bağlama sistemi bulundurmamak ve kullanmamak, Uymayanlara 993 TL. % 25 İndirimli 744,75 TL. İşlem yapılan araçlarda bulunan sürücü ve yolcular gerekli koruyucu tertibatları usulüne uygun olarak takmadan aracın karayolunda seyrine izin verilmez. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 15, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (292, '78/1-b - Motosiklet, motorlu bisiklet ve elektrikli bisikle...', 'Motosiklet, motorlu bisiklet ve elektrikli bisikletlerde sürücülerin koruma başlığı ve gözlüğü, yolcuların ise koruma başlığı bulundurmaması ve kullanmaması, Uymayanlara 993 TL. % 25 İndirimli 744,75 TL. İşlem yapılan araçlarda bulunan sürücü ve yolcuların gerekli koruyucu tertibatları usulüne uygun olarak takmadan aracın karayolunda seyrine izin verilmez. Karayolu üzerinde park yerini tespite yetkili idare veya bu idare tarafından işletme izni verilenler dışındaki gerçek veya tüzel kişilerin karayolu üzerindeki park alanlarına park edenlerden ücret alması veya almaya teşebbüs etmesi, Uymayanlara Bu maddede öngörülen altı aydan iki yıla kadar hapis ve beş bin güne kadar adli para cezası suçunun, soruşturma ve kovuşturması 5271 sayılı Ceza Muhakemesi Kanunu ve diğer ilgili mevzuata göre yapılır.', 79, 7500, 7500, true, NULL);
INSERT INTO public.penalty_types VALUES (293, '81/1-a - Trafik kazalarına karışanların, kaza mahallinde du...', 'Trafik kazalarına karışanların, kaza mahallinde durmaması ve kaza mahallinde trafik güvenliği için gerekli tedbirleri almaması, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (294, '81/1-b - Kazalarda; ölen, yaralanan veya maddi hasar var is...', 'Kazalarda; ölen, yaralanan veya maddi hasar var ise bu kaza can ve mal güvenliğini etkilemiyorsa, sorumluluğunun tespitine yarayan iz ve delil dahil kaza yerindeki durumu değiştirmek, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL.', 0, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (295, '81/1-c - Trafik kazalarına karışanların, kazaya karışan kiş...', 'Trafik kazalarına karışanların, kazaya karışan kişiler tarafından istendiği takdirde kimliğini, adresini, sürücü ve tescil belgesi ile sigorta poliçe tarih ve numarasını bildirmemesi ve göstermemesi, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 10, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (296, '81/1-d-1 - Trafik kazasına karışanların; (tutanak düzenleme k...', 'Trafik kazasına karışanların; (tutanak düzenleme konusunda kendi aralarında anlaştıkları maddi hasarlı trafik kazaları hariç) kazayı yetkililere bildirmemesi, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL. Diğer Hususlar Trafik Kolluğu/ Diğer Yetkili Mülki Amir İdari Para Cezası (Trafik  kolluğunca) Ceza Puanı (Sürücüler İçin) Belgelerin Geçici Olarak  Geri Alınması/İptali (Trafik kolluğunca) Belgelerin Geçici Olarak  Geri Alınması/İptali(Mahkemelerce) Trafikten Men Kanun Madde Numarası Trafik İhlalinin Konusu Kimlere Uygulanacağı Ceza Miktarı ve Uygulayacak Kuruluş 5252 sayılı Kanunun 7. maddesine göre belirlenecek idari para cezası Araç Kullanmaktan Men', 20, 2500, 2500, true, NULL);
INSERT INTO public.penalty_types VALUES (297, '81/1-d-2 - Trafik kazasına karışanların; (tutanak düzenleme k...', 'Trafik kazasına karışanların; (tutanak düzenleme konusunda kendi aralarında anlaştıkları maddi hasarlı trafik kazaları hariç) yetkililer gelinceye kadar veya bunların iznini almadan kaza yerinden ayrılması, Uymayanlara 4.512 TL. % 25 İndirimli 3.384 TL.', 20, 338400, 338400, true, NULL);
INSERT INTO public.penalty_types VALUES (298, '81/1-e - Trafik kazasına karışarak; sürücüsü, mal sahibi ve...', 'Trafik kazasına karışarak; sürücüsü, mal sahibi veya ilgili kişilerin bulunmadığı sırada araç, eşya veya yüklere zarar veren sürücülerin, zarar verdikleri araç, eşya veya mülkün sahibini veya ilgili kişileri bulmaması, ilgilileri bulamadığı takdirde durumu tespit ederek zarar verilen şey üzerine yazılı bilgi bırakarak ilgili kolluğa en kısa zamanda bilgi vermemesi, Uymayanlara 2.167 TL. % 25 İndirimli 1.625,25 TL.', 15, 2500, 2500, true, NULL);


--
-- Data for Name: penalties; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: personnel_positions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: work_areas; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: personnel_work_areas; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rental_agreements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rental_assets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: api_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_clients_id_seq', 1, false);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- Name: api_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_tokens_id_seq', 1, false);


--
-- Name: asset_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asset_documents_id_seq', 1, false);


--
-- Name: assets_damage_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_damage_data_id_seq', 1, false);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 6, true);


--
-- Name: assets_maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_maintenance_id_seq', 1, false);


--
-- Name: assets_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_policies_id_seq', 1, false);


--
-- Name: car_brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_brands_id_seq', 1, false);


--
-- Name: car_models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_models_id_seq', 1, false);


--
-- Name: car_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_types_id_seq', 74, true);


--
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cities_id_seq', 1, false);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.companies_id_seq', 1, false);


--
-- Name: countries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.countries_id_seq', 207, true);


--
-- Name: damage_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.damage_types_id_seq', 1, false);


--
-- Name: doc_main_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.doc_main_types_id_seq', 1, false);


--
-- Name: doc_sub_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.doc_sub_types_id_seq', 1, false);


--
-- Name: fin_current_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_current_accounts_id_seq', 1, false);


--
-- Name: maintenance_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_types_id_seq', 1, false);


--
-- Name: ownership_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ownership_types_id_seq', 1, false);


--
-- Name: penalties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.penalties_id_seq', 1, false);


--
-- Name: penalty_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.penalty_types_id_seq', 301, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: personnel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personnel_id_seq', 1, false);


--
-- Name: personnel_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personnel_positions_id_seq', 1, false);


--
-- Name: personnel_work_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personnel_work_areas_id_seq', 1, false);


--
-- Name: policy_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.policy_types_id_seq', 1, false);


--
-- Name: rental_agreements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rental_agreements_id_seq', 1, false);


--
-- Name: rental_assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rental_assets_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: work_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_areas_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

