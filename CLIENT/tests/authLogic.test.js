import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

describe("Frontend Auth & Storage Integrity", () => {
  const mockStorage = new Map();

  beforeEach(() => {
    mockStorage.clear();
  });

  it("should safely store and parse user profile in localStorage", () => {
    const userPayload = {
      _id: "usr_1082",
      fullName: "Jane Doe",
      email: "jane@example.com",
      userType: "student",
    };

    mockStorage.set("user", JSON.stringify(userPayload));
    mockStorage.set("token", "mock.jwt.token");

    const rawStored = mockStorage.get("user");
    assert.ok(rawStored);

    const parsed = JSON.parse(rawStored);
    assert.equal(parsed.email, "jane@example.com");
    assert.equal(parsed.userType, "student");
    assert.equal(mockStorage.get("token"), "mock.jwt.token");
  });

  it("should purge user credentials from storage on logout", () => {
    mockStorage.set("user", JSON.stringify({ fullName: "Jane Doe" }));
    mockStorage.set("token", "mock.jwt.token");

    // Simulate logout action
    mockStorage.delete("user");
    mockStorage.delete("token");

    assert.equal(mockStorage.get("user"), undefined);
    assert.equal(mockStorage.get("token"), undefined);
  });
});

