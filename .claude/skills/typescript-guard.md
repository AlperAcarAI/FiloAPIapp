---
name: typescript-guard
description: TypeScript kodu yazarken veya düzenlerken otomatik devreye gir. Type safety, strict mode uyumu, any kullanımı tespiti için kullan.
---

TypeScript dosyalarında daima:
1. `any` yerine proper type veya `unknown` kullan
2. Fonksiyon parametreleri ve return type'larını belirt
3. Optional chaining (`?.`) ve nullish coalescing (`??`) tercih et
4. Enum yerine `as const` object kullan
5. Generic type'ları anlamlı isimlendir (T yerine TUser gibi)
6. Zod schema'lardan type çıkarımı yap (`z.infer<typeof schema>`)
7. Express route handler'larda Request/Response type'larını belirt
