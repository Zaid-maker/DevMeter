import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const achievements = [
    {
        slug: 'first-heartbeat',
        name: 'Initiated',
        description: 'Record your very first heartbeat.',
        xpReward: 100,
        icon: '🚀'
    },
    {
        slug: 'hour-1',
        name: 'Freshman',
        description: 'Complete 1 hour of coding.',
        xpReward: 500,
        icon: '🌱'
    },
    {
        slug: 'languages-3',
        name: 'Polyglot',
        description: 'Code in at least 3 different languages.',
        xpReward: 1000,
        icon: '🗣️'
    },
    {
        slug: 'streak-3',
        name: 'Consistent',
        description: 'Maintain a 3-day coding streak.',
        xpReward: 1500,
        icon: '🔥'
    },
    {
        slug: 'marathon',
        name: 'Marathoner',
        description: 'Record activity for 5 hours in a single day.',
        xpReward: 2000,
        icon: '🏁'
    }
];

async function main() {
    console.log('Seeding achievements...');
    for (const achievement of achievements) {
        await prisma.achievement.upsert({
            where: { slug: achievement.slug },
            update: achievement,
            create: achievement,
        });
    }
    console.log('Achievements seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
