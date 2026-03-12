---
description: Stage, commit ve push — tek komutla
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git diff:*), Bash(git status:*)
argument-hint: [commit mesajı]
---

1. `git status` ile değişiklikleri göster
2. `git diff` ile ne değiştiğini analiz et
3. Tüm değişiklikleri stage et
4. Conventional Commits formatında Türkçe commit mesajı oluştur ($ARGUMENTS varsa kullan)
5. Commit mesajını göster ve onay iste
6. Onay gelince push et
