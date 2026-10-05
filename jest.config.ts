import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};

export default config;
