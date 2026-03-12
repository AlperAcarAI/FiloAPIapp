---
description: Mevcut branch'teki değişiklikleri code review yap
allowed-tools: Bash(git diff:*), Bash(git log:*), Read
---

Şunları kontrol et ve madde madde raporla:
1. **Güvenlik**: SQL injection, hardcoded secret, eksik auth kontrolü var mı?
2. **Performans**: N+1 query, gereksiz DB çağrısı, büyük payload var mı?
3. **Hata yönetimi**: try/catch eksik mi, edge case'ler ele alınmış mı?
4. **Tip güvenliği**: TypeScript hataları, `any` kullanımı?
5. **Multi-tenant**: Tenant context doğru kullanılmış mı?
6. **Modülerlik**: 50+ satır fonksiyon var mı, parçalanabilir mi?
7. **CLAUDE.md uyumu**: Proje standartlarına uyuluyor mu?

Her sorun için etiketle:
- Kritik: Mutlaka düzeltilmeli
- Uyarı: Düzeltilmesi önerilir
- Öneri: İyileştirme fırsatı
