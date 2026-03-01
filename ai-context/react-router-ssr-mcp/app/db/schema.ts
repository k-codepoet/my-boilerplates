import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================
// Example domain: Asset Management
// Replace these tables with your own domain entities.
// The MCP server (mcp/tools/) reads from the same schema.
// ============================================================

export const portfolios = sqliteTable("portfolios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  currency: text("currency").notNull().default("KRW"),
  targetAllocation: text("target_allocation"), // JSON: { "stock": 60, "bond": 30, "cash": 10 }
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // stock | etf | bond | crypto | cash | real-estate
  currency: text("currency").notNull().default("KRW"),
  exchange: text("exchange"), // KRX, NYSE, NASDAQ
  sector: text("sector"),
  country: text("country"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const holdings = sqliteTable("holdings", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  quantity: real("quantity").notNull(),
  averageCost: real("average_cost").notNull(),
  targetWeight: real("target_weight"), // percentage
  notes: text("notes"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  type: text("type").notNull(), // buy | sell | dividend | split | transfer
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
  fee: real("fee").default(0),
  currency: text("currency").notNull().default("KRW"),
  executedAt: integer("executed_at", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const marketPrices = sqliteTable("market_prices", {
  id: text("id").primaryKey(),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("KRW"),
  source: text("source"), // manual | api | import
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
});
