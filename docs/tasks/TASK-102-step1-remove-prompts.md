# ШАГ 1/6: Удалить Prompts систему

## ЧТО ДЕЛАЕМ

Удаляем всю инфраструктуру промптов:
- Admin pages: `/adminko/prompts`
- API routes: `/api/admin/prompts`
- Prisma models: `Prompt`, `PromptHistory`
- Service: `lib/ai/prompt-service.ts`

---

## ШАГИ

### 1. Backup

```bash
git add .
git commit -m "chore: backup before removing prompts (step 1/6)"
git push
```

### 2. Удалить файлы

```bash
# Admin pages
rm -rf app/adminko/prompts

# API routes  
rm -rf app/api/admin/prompts

# Service
rm lib/ai/prompt-service.ts
```

### 3. Обновить Prisma schema

Открыть `prisma/schema.prisma`

Удалить:
```prisma
model Prompt {
  id          String          @id @default(cuid())
  key         String          @unique
  name        String
  description String?         @db.Text
  content     String          @db.Text
  variables   Json?
  isActive    Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  history     PromptHistory[]

  @@index([key])
  @@index([isActive])
}

model PromptHistory {
  id        String   @id @default(cuid())
  promptId  String
  prompt    Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  variables Json?
  changedBy String?
  createdAt DateTime @default(now())

  @@index([promptId])
  @@index([createdAt])
}
```

После удаления должны остаться только:
- model Source
- model Article
- model RatingSettings

### 4. Проверить build

```bash
npx prisma generate
npm run build
```

Если ошибки - найти и удалить импорты `prompt-service`

### 5. Создать миграцию

```bash
npx prisma migrate dev --name remove_prompts
```

### 6. Commit

```bash
git add .
git commit -m "feat(step1): remove Prompts system"
git push
```

---

## ПРОВЕРКА

После деплоя:

1. Открыть https://mediasyndicate.online/uk/ukraine - должна работать
2. Открыть https://mediasyndicate.online/adminko/sources - должна работать  
3. Открыть https://mediasyndicate.online/adminko/prompts - должна показать 404

---

## ГОТОВО КОГДА

- [ ] Папки удалены: `app/adminko/prompts`, `app/api/admin/prompts`
- [ ] Файл удален: `lib/ai/prompt-service.ts`
- [ ] Prisma schema: только Source, Article, RatingSettings
- [ ] `npm run build` успешен
- [ ] Миграция создана и применена
- [ ] Git push выполнен
- [ ] Production работает
