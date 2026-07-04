import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Новости', slug: 'news' },
  { name: 'IT и Технологии', slug: 'tech' },
  { name: 'Бизнес и Финансы', slug: 'business' },
  { name: 'Маркетинг и PR', slug: 'marketing' },
  { name: 'Наука и Образование', slug: 'science' },
  { name: 'Развлечения и Юмор', slug: 'entertainment' },
  { name: 'Путешествия', slug: 'travel' },
  { name: 'Спорт', slug: 'sport' },
  { name: 'Криптовалюты', slug: 'crypto' },
  { name: 'Дизайн', slug: 'design' },
  { name: 'Психология', slug: 'psychology' },
  { name: 'Политика', slug: 'politics' },
  { name: 'Культура и Искусство', slug: 'culture' },
  { name: 'Музыка', slug: 'music' },
  { name: 'Кино и Сериалы', slug: 'cinema' },
  { name: 'Книги', slug: 'books' },
  { name: 'Здоровье и Фитнес', slug: 'health' },
  { name: 'Еда и Кулинария', slug: 'food' },
  { name: 'Автомобили', slug: 'auto' },
  { name: 'Недвижимость', slug: 'realestate' },
];

async function seed() {
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Seeded ${categories.length} categories`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
