---
description: Test yaz ve çalıştır
allowed-tools: Bash, Read, Write
argument-hint: [test edilecek dosya veya özellik]
---

1. $ARGUMENTS dosyasını veya belirtilen özelliği oku
2. Mevcut test dosyası varsa incele, yoksa oluştur
3. Şunları kapsayan testler yaz:
   - Happy path (başarılı senaryo)
   - Edge case'ler
   - Hata durumları
4. Testleri çalıştır
5. Başarısız test varsa düzelt
