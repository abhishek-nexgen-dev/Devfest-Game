import { prisma, getPrismaStatus, disconnectPrisma } from "../src/core/database/prisma.client";

describe("Prisma ORM with PostgreSQL Client", () => {
  it("should initialize PrismaClient singleton", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.$disconnect).toBe("function");
    expect(typeof prisma.$queryRaw).toBe("function");
  });

  it("should have all required PostgreSQL domain models mapped on Prisma client", () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.participant).toBeDefined();
    expect(prisma.team).toBeDefined();
    expect(prisma.teamMember).toBeDefined();
    expect(prisma.game).toBeDefined();
    expect(prisma.gameRegistration).toBeDefined();
    expect(prisma.gameSubmission).toBeDefined();
    expect(prisma.gameResult).toBeDefined();
    expect(prisma.scoreUpdateLog).toBeDefined();
    expect(prisma.certificate).toBeDefined();
    expect(prisma.activityLog).toBeDefined();
  });

  it("should report Prisma connection status", () => {
    const status = getPrismaStatus();
    expect(typeof status).toBe("boolean");
  });

  it("should handle disconnectPrisma without error", async () => {
    await expect(disconnectPrisma()).resolves.not.toThrow();
  });
});
