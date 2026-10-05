import { connectDB, disconnectDB, getDbStatus } from "../src/core/database/db.config";

describe("Database Connection Lifecycle", () => {
  it("should handle offline database connection gracefully in non-production", async () => {
    // In test environment, connectDB should not throw when DB is offline
    await expect(connectDB()).resolves.not.toThrow();
  });

  it("should report database status boolean", () => {
    const status = getDbStatus();
    expect(typeof status).toBe("boolean");
  });

  it("should handle disconnectDB cleanly", async () => {
    await expect(disconnectDB()).resolves.not.toThrow();
  });
});
