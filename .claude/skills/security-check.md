---
name: security-check
description: Yeni API endpoint, authentication kodu, veya kullanıcı girdisi işlenirken otomatik devreye gir.
---

Güvenlik kontrolleri:
1. Kullanıcı girdisini daima validate et (Zod ile)
2. SQL sorguları için parameterized queries kullan (Drizzle ORM)
3. Secret'ları asla hardcode etme, .env'den al
4. API endpoint'lerinde JWT authentication kontrolü yap
5. Hierarchical auth ile yetkilendirme kontrolü yap
6. CORS ayarlarını production için kısıtla
7. Multi-tenant context'in doğru tenant'a bağlı olduğunu doğrula
8. Rate limiting aktif olduğundan emin ol
