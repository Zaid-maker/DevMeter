import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL is missing. Production environment requires a valid PostgreSQL connection string.");
    }
    console.warn("DATABASE_URL is missing. Falling back to default connection settings (likely localhost).");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query"] : [],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
