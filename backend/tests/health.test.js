const request = require("supertest");
const express = require("express");

const Database = require("better-sqlite3");

// Export a real app instance with a dummy DB connection to prevent real db locks
const dbInstance = new Database(":memory:");
const dbProxy = require("../db");
dbProxy.setTestDb(dbInstance);

const app = require("../index");

describe("GET /api/health", () => {
  it("should return 200 with status and timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "Backend running");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should return a valid ISO timestamp", async () => {
    const res = await request(app).get("/api/health");
    const ts = new Date(res.body.timestamp);
    expect(!isNaN(ts.getTime())).toBe(true);
  });
});
