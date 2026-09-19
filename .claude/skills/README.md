# Skill klasörü

Claude Code, bu klasördeki skill'leri her oturumda otomatik yükler.

## Beklenen yapı

```
.claude/
└── skills/
    ├── <skill-adi>/
    │   └── SKILL.md          ← zorunlu dosya
    │   └── (varsa referans dosyaları, scriptler…)
    └── <baska-skill>/
        └── SKILL.md
```

`SKILL.md` dosyasının başında şu biçimde bir frontmatter bulunur:

```markdown
---
name: skill-adi
description: Bu skill ne zaman kullanılmalı, tek cümleyle.
---

Yönergelerin gövdesi…
```

## Nasıl eklenir

1. Kendi skill klasörlerini olduğu gibi bu klasörün içine kopyala.
2. `git add .claude && git commit -m "skill dosyaları eklendi" && git push`
3. Dosyalar depoya düştüğünde Claude bunları okuyup projede kullanabilir.

Yapı yukarıdakinden farklıysa da sorun değil — dosyaları olduğu gibi bırak,
uygun biçime ben dönüştürürüm.
