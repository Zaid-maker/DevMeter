#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "⚠️  No migrations to apply or migration failed (database may already be up to date)"

echo "🌱 Seeding achievements..."
node -e "
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
  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { slug: a.slug }, update: a, create: a });
  }
  console.log('✅ Achievements seeded');
  await prisma.\$disconnect();
})().catch(e => { console.error('Seed error:', e); });
" 2>/dev/null || echo "⚠️  Achievement seeding skipped"

echo "🚀 Starting DevMeter..."
exec "$@"
