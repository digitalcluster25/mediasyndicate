import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const bbcUkraine = await prisma.source.upsert({
    where: { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
    update: {},
    create: {
      name: 'BBC Ukraine',
      url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
      type: 'RSS',
      isActive: true,
    },
  });

  console.log(`Created source: ${bbcUkraine.name}`);
  console.log(`Source ID: ${bbcUkraine.id}`);
  console.log(`Source URL: ${bbcUkraine.url}`);
  console.log(`Source type: ${bbcUkraine.type}`);
  console.log(`Source isActive: ${bbcUkraine.isActive}`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
