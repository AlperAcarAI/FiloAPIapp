# FILOKI Fleet Management API

## Proje Hakkinda
Filoki Backend API — Express.js + TypeScript tabanli filo yonetim sistemi backend'i.
- **Runtime:** Node.js 20, TypeScript 5.6, Express.js 4
- **ORM:** Drizzle ORM + Neon PostgreSQL (serverless)
- **Auth:** JWT (access + refresh token), Passport.js, hierarchical RBAC
- **Multi-tenant:** AsyncLocalStorage ile domain bazli tenant izolasyonu
- **Paket Yoneticisi:** npm

## Proje Yapisi
```
server/
  index.ts              # Express app entry (port 5000)
  routes.ts             # Route registry (38 route modulu)
  db.ts                 # Multi-tenant DB context (proxy pattern)
  tenant-context.ts     # Domain bazli tenant routing (AsyncLocalStorage)
  auth.ts               # JWT token yonetimi, login logic
  hierarchical-auth.ts  # Role-based access control
  storage.ts            # Google Cloud Storage entegrasyonu
  security-middleware.ts # Guvenlik header'lari, device fingerprinting
  sendpulse-service.ts  # Email servisi (SendPulse)
  policy-scheduler.ts   # Cron job zamanlayici
  *-routes.ts           # 38 feature route modulu
shared/
  schema.ts             # Drizzle schema + Zod type'lar (3101 satir, TEK kaynak)
client/
  src/                  # React frontend (ayni repo icinde)
migrations/
  *.sql                 # Drizzle migration dosyalari (12 adet)
```

## Komutlar
```bash
npm run dev      # Gelistirme sunucusu (port 5000)
npm run build    # Production build (vite + esbuild)
npm run start    # Production server (node dist/index.js)
npm run check    # TypeScript type check
npm run db:push  # DB schema push (drizzle-kit)
```

## Kod Kurallari

### API Response Formati (HER ZAMAN)
```typescript
// Basari
{ success: true, message: "...", data: { ... } }
// Hata
{ success: false, error: "ERROR_CODE", message: "Kullanici dostu mesaj" }
// Liste
{ success: true, data: { items: [...], totalCount: N, pagination: { limit, offset, hasMore } } }
```

### Route Yazim Kurallari
- Her yeni route `server/*-routes.ts` dosyasinda ayri moduldur
- Route'lar `server/routes.ts` registry'sine eklenir
- Her endpoint JWT authentication kontrolu yapar (hierarchical-auth)
- Request validation: Zod schema ile (shared/schema.ts'den import)
- Hata yonetimi: try/catch ile sarmalanir, anlamli error code dondurulur

### Multi-Tenant Mimari
- `tenant-context.ts`: AsyncLocalStorage ile request bazli tenant context
- `db.ts`: Domain'e gore tenant DB secimi (proxy pattern)
- Env: `TENANT_N_DOMAIN` + `TENANT_N_DB_URL` ciftleri
- Fallback: `DATABASE_URL` (varsayilan tenant)

### Guvenlik
- JWT token pair (access 15dk + refresh 7gun)
- Basarisiz giris sonrasi hesap kilitleme
- Device fingerprinting
- API key hashing (api-security.ts)
- Rate limiting
- Helmet guvenlik header'lari

### Veri Tipleri (DIKKAT)
- `tcNo`: bigint -> string (JSON serialization)
- Para: integer (cents) -> TL'ye cevir (/ 100)
- Decimal: string -> parseFloat()
- Tarih: ISO string formatinda

### Import Alias'lari
- `@/` -> `client/src/`
- `@shared/` -> `shared/`

## Yeni Route Ekleme Checklist
1. `shared/schema.ts` - Drizzle table + Zod schema ekle
2. `server/yeni-feature-routes.ts` - Route modulu olustur
3. `server/routes.ts` - Route registry'ye ekle
4. Endpoint'lere JWT auth middleware ekle
5. Request/response validation (Zod) ekle
6. Hata yonetimi (try/catch + anlamli error code) ekle

## Sik Karsilasilan Sorunlar
- API response format uyumsuzluklari: HER ZAMAN standart formati kullan
- Multi-tenant context kaybi: AsyncLocalStorage scope disina cikilmamali
- Token refresh sorunlari: auth.ts'deki token lifecycle'a dikkat et
- Buyuk route dosyalari: api-management-routes.ts (~132KB), parcalanmali

## Kritik Kurallar (PRODUCTION)
- Bu yazilim CANLI ortamda kullaniliyor, gercek kullanicilar var
- Kullanicilar teknik bilgisi dusuk kisiler
- Major degisikliklerde VERI KAYBI yasanmamali
- DB schema degisiklikleri geriye uyumlu olmali (migration oncesi mevcut veriyi koru)
- Silme islemleri icin soft-delete veya onay mekanizmasi kullan
- Hata mesajlari teknik jargon icermemeli, Turkce ve anlasilir olmali
- SQL sorgularinda parameterized query kullan (injection onleme)
- Secret'lari asla hardcode etme, .env'den al

## Git Kurallari
- Commit mesajlari Turkce yazilir, Conventional Commits prefix'leri kullanilir
  - `feat: yeni stok route'lari eklendi`
  - `fix: token refresh hatasi duzeltildi`
  - `chore: bagimliliklar guncellendi`
- Branch isimleri: `feat/`, `fix/`, `chore/` prefix'leriyle

## Kod Kalitesi
- Uzun fonksiyonlar yerine moduler, kucuk fonksiyonlar yaz
- Tek fonksiyon = tek sorumluluk
- 50+ satir fonksiyon varsa parcalamayi dusun
- Formatter: Prettier

## Onemli Notlar
- Dil: UI Turkce, kod/degiskenler Ingilizce
- Test framework'u yok — degisiklikleri `npm run check` ile dogrula
- `.env` dosyasini ASLA commit etme
- `shared/schema.ts` cok buyuk (3101 satir), dikkatli ol
- `api-management-routes.ts` cok buyuk (~132KB), dikkatli ol
- Deployment: Docker + PM2 + Nginx

## Bagli Servisler
- GitHub: https://github.com/AlperAcarAI/FiloAPIapp
- DB: Neon PostgreSQL (multi-tenant, serverless)
- Email: SendPulse API
- Storage: Google Cloud Storage (opsiyonel)
