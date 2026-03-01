/**
 * Shared query functions used by BOTH web routes AND MCP server.
 * Replace these with your own domain queries.
 */
import { eq } from "drizzle-orm";
import { db } from "~/db";
import {
  portfolios,
  assets,
  holdings,
  transactions,
  marketPrices,
} from "~/db/schema";

// ── Portfolios ──────────────────────────────────────────────

export function listPortfolios() {
  return db.select().from(portfolios).all();
}

export function getPortfolio(id: string) {
  return db.select().from(portfolios).where(eq(portfolios.id, id)).get();
}

export function getPortfolioWithHoldings(portfolioId: string) {
  const portfolio = getPortfolio(portfolioId);
  if (!portfolio) return null;

  const holdingRows = db
    .select({
      holding: holdings,
      asset: assets,
    })
    .from(holdings)
    .innerJoin(assets, eq(holdings.assetId, assets.id))
    .where(eq(holdings.portfolioId, portfolioId))
    .all();

  return { ...portfolio, holdings: holdingRows };
}

// ── Assets ──────────────────────────────────────────────────

export function listAssets() {
  return db.select().from(assets).all();
}

export function getAsset(id: string) {
  return db.select().from(assets).where(eq(assets.id, id)).get();
}

export function searchAssets(query: string) {
  // Simple LIKE search — replace with FTS5 if needed
  return db
    .select()
    .from(assets)
    .where(
      // drizzle doesn't have built-in LIKE with OR, use raw SQL for flexibility
      // For the boilerplate, we keep it simple
      eq(assets.symbol, query)
    )
    .all();
}

// ── Transactions ────────────────────────────────────────────

export function listTransactions(portfolioId?: string) {
  if (portfolioId) {
    return db
      .select({
        transaction: transactions,
        asset: assets,
      })
      .from(transactions)
      .innerJoin(assets, eq(transactions.assetId, assets.id))
      .where(eq(transactions.portfolioId, portfolioId))
      .all();
  }

  return db
    .select({
      transaction: transactions,
      asset: assets,
    })
    .from(transactions)
    .innerJoin(assets, eq(transactions.assetId, assets.id))
    .all();
}

// ── Market Prices ───────────────────────────────────────────

export function getLatestPrice(assetId: string) {
  return db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.assetId, assetId))
    .orderBy(marketPrices.recordedAt)
    .limit(1)
    .get();
}

// ── Summary (for MCP) ───────────────────────────────────────

export function getPortfolioSummary(portfolioId: string) {
  const portfolio = getPortfolioWithHoldings(portfolioId);
  if (!portfolio) return null;

  const holdingSummaries = portfolio.holdings.map((h) => ({
    symbol: h.asset.symbol,
    name: h.asset.name,
    type: h.asset.type,
    quantity: h.holding.quantity,
    averageCost: h.holding.averageCost,
    totalCost: h.holding.quantity * h.holding.averageCost,
    targetWeight: h.holding.targetWeight,
    currency: h.asset.currency,
  }));

  const totalCost = holdingSummaries.reduce((sum, h) => sum + h.totalCost, 0);

  return {
    id: portfolio.id,
    name: portfolio.name,
    currency: portfolio.currency,
    targetAllocation: portfolio.targetAllocation
      ? JSON.parse(portfolio.targetAllocation)
      : null,
    totalCost,
    holdingCount: holdingSummaries.length,
    holdings: holdingSummaries,
  };
}
