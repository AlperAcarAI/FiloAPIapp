---
description: Staged değişiklikler için Conventional Commits formatında Türkçe commit oluştur
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git diff:*), Bash(git status:*)
argument-hint: [isteğe bağlı commit mesajı]
---

Şunları yap:
1. `git diff --cached` ile staged değişiklikleri analiz et
2. Staged değişiklik yoksa `git status` göster ve kullanıcıya bildir
3. Değişikliklerin kapsamına göre uygun prefix seç: feat/fix/chore/docs/refactor/test
4. $ARGUMENTS verilmişse onu kullan, verilmemişse Türkçe açıklama ile kendin yaz
5. Commit mesajını Conventional Commits formatında, Türkçe açıklamalı oluştur
6. Commit et ve sonucu göster
