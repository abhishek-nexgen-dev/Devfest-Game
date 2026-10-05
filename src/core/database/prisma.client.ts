import { PrismaClient } from "@prisma/client";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../logger/logger";

declare global {
  var __prisma: PrismaClient | undefined;
}

let isPrismaConnected = false;

/**
 * Singleton instance of PrismaClient.
 * In development, hot-reloading (nodemon / ts-node) creates new instances without releasing old ones.
 * Storing the client in global prevents connection leaks.
 */
export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      env_Constant.NODE_ENV === "development"
        ? [
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "stdout", level: "error" }],
  });

if (env_Constant.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

/**
 * Returns current Prisma database connection status.
 */
export const getPrismaStatus = (): boolean => isPrismaConnected;

/**
 * Connects to PostgreSQL and verifies the database connection via Prisma.
 */
export const connectPrisma = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1;`;
    isPrismaConnected = true;
    logger.info("✅ Prisma ORM connected to PostgreSQL successfully.");
    return true;
  } catch (error: unknown) {
    isPrismaConnected = false;
    throw error;
  }
};

/**
 * Disconnects Prisma client gracefully.
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    isPrismaConnected = false;
    logger.info("Prisma ORM connection closed.");
  } catch (error) {
    logger.error("Error closing Prisma ORM connection:", error);
  }
};
