#!/bin/sh
set -e

echo "🔄 Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "❌ Migration failed"
  exit 1
fi

echo "🌱 Seeding achievements..."
if ! node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const achievements = [
  { slug: 'first-heartbeat', name: 'Initiated', description: 'Record your very first heartbeat.', xpReward: 100, icon: '🚀' },
  { slug: 'hour-1', name: 'Freshman', description: 'Complete 1 hour of coding.', xpReward: 500, icon: '🌱' },
  { slug: 'languages-3', name: 'Polyglot', description: 'Code in at least 3 different languages.', xpReward: 1000, icon: '🗣️' },
  { slug: 'streak-3', name: 'Consistent', description: 'Maintain a 3-day coding streak.', xpReward: 1500, icon: '🔥' },
  { slug: 'marathon', name: 'Marathoner', description: 'Record activity for 5 hours in a single day.', xpReward: 2000, icon: '🏁' }
];

(async () => {
  try {
    for (const a of achievements) {
      await prisma.achievement.upsert({ where: { slug: a.slug }, update: a, create: a });
    }
    console.log('✅ Achievements seeded');
  } catch (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
"; then
  echo "❌ Achievement seeding failed"
  exit 1
fi

echo "🚀 Starting DevMeter..."
exec "$@"
