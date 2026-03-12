---
description: Pull request oluştur
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(gh pr:*), Bash(gh auth:*), Bash(git push:*)
argument-hint: [PR başlığı]
---

Önkoşul: `gh` CLI kurulu ve authenticated olmalı.

1. `git log main..HEAD --oneline` ile branch'teki commitleri listele
2. `git diff main...HEAD` ile tüm değişiklikleri analiz et
3. PR başlığı ve açıklaması oluştur (Türkçe açıklama, İngilizce teknik terimler)
4. Açıklamaya ekle: değişiklik özeti, test edilen senaryolar
5. `gh pr create` ile oluştur
6. PR URL'ini göster
