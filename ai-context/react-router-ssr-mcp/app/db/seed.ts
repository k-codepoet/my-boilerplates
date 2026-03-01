/**
 * Seed script: populates the database with example data.
 * Run with: npx tsx app/db/seed.ts
 *
 * Safe to run multiple times — existing data is cleared first.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH || "./data/app.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

// Clear existing data (order matters due to foreign keys)
db.delete(schema.chatMessages).run();
db.delete(schema.chatSessions).run();
db.delete(schema.marketPrices).run();
db.delete(schema.transactions).run();
db.delete(schema.holdings).run();
db.delete(schema.assets).run();
db.delete(schema.portfolios).run();

const now = new Date();

// Portfolios
db.insert(schema.portfolios)
  .values([
    {
      id: "pf-1",
      name: "Main Portfolio",
      description: "Primary investment portfolio",
      currency: "KRW",
      targetAllocation: JSON.stringify({
        stock: 60,
        etf: 20,
        bond: 10,
        cash: 10,
      }),
      createdAt: now,
      updatedAt: now,
    },
  ])
  .run();

// Assets
db.insert(schema.assets)
  .values([
    {
      id: "asset-1",
      symbol: "005930",
      name: "Samsung Electronics",
      type: "stock",
      currency: "KRW",
      exchange: "KRX",
      sector: "Technology",
      country: "KR",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "asset-2",
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "stock",
      currency: "USD",
      exchange: "NASDAQ",
      sector: "Technology",
      country: "US",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "asset-3",
      symbol: "VOO",
      name: "Vanguard S&P 500 ETF",
      type: "etf",
      currency: "USD",
      exchange: "NYSE",
      sector: "Broad Market",
      country: "US",
      createdAt: now,
      updatedAt: now,
    },
  ])
  .run();

// Holdings
db.insert(schema.holdings)
  .values([
    {
      id: "hold-1",
      portfolioId: "pf-1",
      assetId: "asset-1",
      quantity: 100,
      averageCost: 72000,
      targetWeight: 30,
      updatedAt: now,
    },
    {
      id: "hold-2",
      portfolioId: "pf-1",
      assetId: "asset-2",
      quantity: 10,
      averageCost: 180,
      targetWeight: 30,
      updatedAt: now,
    },
    {
      id: "hold-3",
      portfolioId: "pf-1",
      assetId: "asset-3",
      quantity: 20,
      averageCost: 450,
      targetWeight: 20,
      updatedAt: now,
    },
  ])
  .run();

// Transactions
db.insert(schema.transactions)
  .values([
    {
      id: "tx-1",
      portfolioId: "pf-1",
      assetId: "asset-1",
      type: "buy",
      quantity: 100,
      price: 72000,
      fee: 7200,
      currency: "KRW",
      executedAt: now,
      createdAt: now,
    },
    {
      id: "tx-2",
      portfolioId: "pf-1",
      assetId: "asset-2",
      type: "buy",
      quantity: 10,
      price: 180,
      fee: 1,
      currency: "USD",
      executedAt: now,
      createdAt: now,
    },
  ])
  .run();

// Chat Sessions
db.insert(schema.chatSessions)
  .values([
    {
      id: "chat-1",
      title: "Portfolio Review",
      createdAt: now,
      updatedAt: now,
    },
  ])
  .run();

db.insert(schema.chatMessages)
  .values([
    {
      id: "msg-1",
      sessionId: "chat-1",
      role: "user",
      content: "Can you summarize my main portfolio?",
      createdAt: new Date(now.getTime()),
    },
    {
      id: "msg-2",
      sessionId: "chat-1",
      role: "assistant",
      content:
        "Your Main Portfolio has 3 holdings: Samsung Electronics (100 shares), Apple (10 shares), and Vanguard S&P 500 ETF (20 shares). Total cost basis is approximately 7,209,000 KRW.",
      createdAt: new Date(now.getTime() + 1000),
    },
    {
      id: "msg-3",
      sessionId: "chat-1",
      role: "user",
      content: "Is the allocation balanced?",
      createdAt: new Date(now.getTime() + 2000),
    },
  ])
  .run();

console.log("Seed data inserted successfully. (existing data was cleared first)");
sqlite.close();
