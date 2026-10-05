import { dataStore } from "./firestore.store";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../logger/logger";
import bcrypt from "bcryptjs";
import { GameDoc, UserDoc } from "./firestore.types";

export const getDbStatus = (): boolean => dataStore.getDbStatus();

const seedInitialData = async () => {
  // 1. Seed Super Admin
  const adminEmail = env_Constant.INITIAL_ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await dataStore.users.findOne((u) => u.email.toLowerCase() === adminEmail);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(env_Constant.INITIAL_ADMIN_PASSWORD, 10);
    const adminUser: UserDoc = {
      id: "admin-super-001",
      email: adminEmail,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dataStore.saveDocument("users", dataStore.users, adminUser);
    logger.info(`👑 Super Admin account seeded successfully: ${adminEmail}`);
  }

  // 2. Seed Default GDG Ranchi DevFest 2026 Games if empty
  const existingGames = await dataStore.games.getAll();
  if (existingGames.length === 0) {
    const defaultGames: GameDoc[] = [
      {
        id: "game-tech-quiz",
        title: "Tech Quiz",
        description:
          "Test your knowledge of technology, cloud computing, and programming languages.",
        gameType: "INDIVIDUAL",
        status: "ACTIVE",
        maxScore: 100,
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "game-coding-challenge",
        title: "Coding Challenge",
        description: "Solve algorithmic and real-world coding problems under timed conditions.",
        gameType: "INDIVIDUAL",
        status: "ACTIVE",
        maxScore: 100,
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "game-memory-game",
        title: "Memory Game",
        description: "Match tech icons, architecture patterns, and Google Cloud services fast.",
        gameType: "INDIVIDUAL",
        status: "UPCOMING",
        maxScore: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "game-puzzle-quest",
        title: "Puzzle Quest",
        description: "Solve logic riddles, reverse-engineering puzzles, and developer crosswords.",
        gameType: "INDIVIDUAL",
        status: "UPCOMING",
        maxScore: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "game-team-hackathon",
        title: "Team Hackathon Showcase",
        description: "Collaborative team building challenge using Google Cloud & AI APIs.",
        gameType: "TEAM",
        status: "ACTIVE",
        maxScore: 200,
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const game of defaultGames) {
      await dataStore.saveDocument("games", dataStore.games, game);
    }
    logger.info(`🎮 Seeded ${defaultGames.length} default DevFest 2026 games.`);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    await dataStore.testConnection();
    await seedInitialData();
  } catch (error) {
    logger.error("Error during Firestore connection initialization:", error);
  }
};

export const disconnectDB = async (): Promise<void> => {
  logger.info("Firestore connection closed gracefully.");
};
