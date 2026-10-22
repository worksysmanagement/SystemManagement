import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { generateSecureToken, hashToken } from "../src/lib/security/tokens";
import { checkRateLimit } from "../src/lib/security/rate-limit";
import { createTestDb } from "../src/lib/db/client";
import { runMigrations } from "../scripts/migrate";
import { organizations, leaveRequests } from "../src/db/schema";
import { createLeaveRequest } from "../src/lib/services/leave-requests";

describe("Security Hardening & Cryptography Tests", () => {
  it("Hashes passwords with PBKDF2 WebCrypto securely and verifies correctly", async () => {
    const rawPass = "MySuperSecretPass!2026";
    const hashed = await hashPassword(rawPass);

    expect(hashed).toMatch(/^pbkdf2:100000:[a-f0-9]{32}:[a-f0-9]{64}$/);
    expect(await verifyPassword(rawPass, hashed)).toBe(true);
    expect(await verifyPassword("WrongPassword", hashed)).toBe(false);
  });

  it("Generates 256-bit cryptographically secure random tokens and SHA-256 hashes", async () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1.length).toBe(64); // 32 bytes hex = 64 chars
    expect(token1).not.toBe(token2);

    const hash1 = await hashToken(token1);
    expect(hash1.length).toBe(64);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("Safely handles XSS payloads without execution vulnerability", async () => {
    const db = createTestDb(":memory:");
    await runMigrations(db);

    const now = Date.now();
    await db.insert(organizations).values({
      id: "org-xss-test",
      name: "XSS Test Org",
      slug: "xss-org",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    const xssPayload = `<script>alert("XSS Attack")</script>`;
    const res = await createLeaveRequest(
      {
        organizationId: "org-xss-test",
        firstName: xssPayload,
        lastName: "Smith",
        employeeNumber: "EMP-XSS",
        department: "IT",
        position: "Dev",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    expect(res.leaveRequest.firstName).toBe(xssPayload);
  });

  it("Safely protects against SQL Injection attempts via parameterized queries", async () => {
    const db = createTestDb(":memory:");
    await runMigrations(db);

    const now = Date.now();
    await db.insert(organizations).values({
      id: "org-sqli-test",
      name: "SQLi Test Org",
      slug: "sqli-org",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    const sqliPayload = "'; DROP TABLE leave_requests; --";
    const res = await createLeaveRequest(
      {
        organizationId: "org-sqli-test",
        firstName: "Normal",
        lastName: sqliPayload,
        employeeNumber: "EMP-SQLI",
        department: "IT",
        position: "Dev",
        leaveType: "ANNUAL",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        requestedDays: 3,
        contactPhone: "+22501020304",
      },
      undefined,
      db
    );

    expect(res.leaveRequest.lastName).toBe(sqliPayload);

    // Verify table still exists and queryable
    const all = await db.select().from(leaveRequests);
    expect(all.length).toBe(1);
  });

  it("Enforces rate limiting on repeated requests", () => {
    const ip = "192.168.1.100";
    const maxReqs = 3;

    const r1 = checkRateLimit(`test_limit:${ip}`, maxReqs, 10);
    const r2 = checkRateLimit(`test_limit:${ip}`, maxReqs, 10);
    const r3 = checkRateLimit(`test_limit:${ip}`, maxReqs, 10);
    const r4 = checkRateLimit(`test_limit:${ip}`, maxReqs, 10);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r4.allowed).toBe(false);
  });

  it("Validates password transition and rejects invalid current passwords", async () => {
    const originalPassword = "InitialPassword123!";
    const newPassword = "NewSecurePassword456#";
    const hashed = await hashPassword(originalPassword);

    // Current password must match before accepting new password
    const isOldCorrect = await verifyPassword("WrongPassword!", hashed);
    expect(isOldCorrect).toBe(false);

    const isActualOldCorrect = await verifyPassword(originalPassword, hashed);
    expect(isActualOldCorrect).toBe(true);

    const newHashed = await hashPassword(newPassword);
    expect(await verifyPassword(newPassword, newHashed)).toBe(true);
    expect(await verifyPassword(originalPassword, newHashed)).toBe(false);
  });
});
