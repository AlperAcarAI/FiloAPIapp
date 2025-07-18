-- ENUM Types (ASCII-only)
CREATE TYPE varlik_tur AS ENUM ('Binek','Kamyon','Forklift','Vinc','Ekskavator');
CREATE TYPE sahiplik_turu AS ENUM ('Sirket','Kiralik');
CREATE TYPE sigorta_turu AS ENUM ('Sorumluluk','Kasko');
CREATE TYPE sozlesme_turu AS ENUM ('Kredi','Kiralama');
CREATE TYPE bakim_turu AS ENUM ('Periyodik','Agir','Ariza');
CREATE TYPE talep_durum AS ENUM ('Beklemede','Karsilandi','Iptal');
CREATE TYPE ps_rol AS ENUM ('Gorevli','Amir');
CREATE TYPE personel_rol AS ENUM ('Filo_Personeli','Santiye_Sefi','Bolge_Koordinatoru','Genel_Yonetim','Filo_Yonetici');

-- Assets
CREATE TABLE varliklar (
    varlik_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tur varlik_tur NOT NULL,
    marka VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    plaka VARCHAR(20) UNIQUE NOT NULL,
    sahiplik sahiplik_turu NOT NULL,
    edinim_tarihi DATE NOT NULL,
    kullanim_sayaci INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insurances
CREATE TABLE sigortalar (
    sigorta_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    sirket VARCHAR(100) NOT NULL,
    sigorta_turu sigorta_turu NOT NULL,
    police_no VARCHAR(30) UNIQUE NOT NULL,
    prim_tutari DECIMAL(12,2) NOT NULL,
    baslangic_tarihi DATE NOT NULL,
    bitis_tarihi DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contracts (Loans & Leases)
CREATE TABLE sozlesmeler (
    sozlesme_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    sozlesme_turu sozlesme_turu NOT NULL,
    saglayici VARCHAR(100) NOT NULL,
    sozlesme_no VARCHAR(30) UNIQUE NOT NULL,
    baslangic_tarihi DATE NOT NULL,
    bitis_tarihi DATE NOT NULL,
    tutar DECIMAL(15,2) NOT NULL,
    faiz_orani DECIMAL(5,2),
    vade_ay INTEGER,
    aylik_odeme DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Maintenance
CREATE TABLE bakimlar (
    bakim_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    bakim_turu bakim_turu NOT NULL,
    yapilan_tarih DATE NOT NULL,
    sonraki_tarih DATE,
    saglayici VARCHAR(100),
    maliyet DECIMAL(12,2),
    fatura_no VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tires
CREATE TABLE lastikler (
    lastik_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    pozisyon VARCHAR(20) NOT NULL,
    model VARCHAR(50),
    uretim_tarihi DATE,
    degisim_tarihi DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Failures
CREATE TABLE arizalar (
    ariza_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    olusum_tarihi DATE NOT NULL,
    aciklama TEXT,
    onarim_baslangic DATE,
    onarim_bitis DATE,
    parca_maliyeti DECIMAL(12,2),
    iscilik_maliyeti DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fuel Records
CREATE TABLE yakit_kayitlari (
    kayit_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    tarih DATE NOT NULL,
    hacim DECIMAL(8,2),
    birim_fiyat DECIMAL(8,2),
    toplam_tutar DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Material Requests
CREATE TABLE malzeme_talepleri (
    talep_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    malzeme_adi VARCHAR(100) NOT NULL,
    talep_eden INTEGER NOT NULL,
    talep_tarihi DATE NOT NULL,
    durum talep_durum NOT NULL DEFAULT 'Beklemede',
    onay_eden INTEGER,
    onay_tarihi DATE,
    miktar DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE giderler (
    gider_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    gider_turu VARCHAR(50),
    aciklama TEXT,
    tutar DECIMAL(12,2),
    gider_tarihi DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sites
CREATE TABLE santiyeler (
    santiye_id SERIAL PRIMARY KEY,
    adi VARCHAR(100) NOT NULL,
    adres TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personnel
CREATE TABLE personeller (
    personel_id SERIAL PRIMARY KEY,
    ad_soyad VARCHAR(100) NOT NULL,
    departman VARCHAR(50),
    rol personel_rol NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefon VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Site Assignments
CREATE TABLE santiye_atamalari (
    atama_id SERIAL PRIMARY KEY,
    varlik_id UUID NOT NULL REFERENCES varliklar(varlik_id) ON DELETE CASCADE,
    santiye_id INTEGER NOT NULL REFERENCES santiyeler(santiye_id) ON DELETE CASCADE,
    atama_tarihi DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Personnel-to-Site Roles
CREATE TABLE personel_santiye (
    ps_id SERIAL PRIMARY KEY,
    personel_id INTEGER NOT NULL REFERENCES personeller(personel_id) ON DELETE CASCADE,
    santiye_id INTEGER NOT NULL REFERENCES santiyeler(santiye_id) ON DELETE CASCADE,
    ps_rol ps_rol NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Site Permissions
CREATE TABLE santiye_yetkilendirmeler (
    syetki_id SERIAL PRIMARY KEY,
    santiye_id INTEGER NOT NULL REFERENCES santiyeler(santiye_id) ON DELETE CASCADE,
    personel_id INTEGER NOT NULL REFERENCES personeller(personel_id) ON DELETE CASCADE,
    gorebilme BOOLEAN DEFAULT FALSE,
    duzenleyebilme BOOLEAN DEFAULT FALSE,
    silebilme BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations
CREATE TABLE organizations (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(organization_id) ON DELETE SET NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id)
);

-- Access Tokens
CREATE TABLE access_tokens (
    access_token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    refresh_token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE
);

-- User Sessions
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    revoked BOOLEAN DEFAULT FALSE
);

-- Password Resets
CREATE TABLE password_resets (
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reset_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_org             ON users(organization_id);
CREATE INDEX idx_user_roles_usr        ON user_roles(user_id);
CREATE INDEX idx_user_roles_role       ON user_roles(role_id);
CREATE INDEX idx_access_tokens_usr     ON access_tokens(user_id);
CREATE INDEX idx_refresh_tokens_usr    ON refresh_tokens(user_id);
