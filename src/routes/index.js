import express from "express";
import { fetchSimplePrices } from "../services/coingecko.js";
import { getCache, setCache } from "../utils/cache.js";

const router = express.Router();

// Your basket (fixed quantities)
const BASKET = [
  { id: "bitcoin", amount: 0.001 },
  { id: "ethereum", amount: 0.02 },
  { id: "solana", amount: 1 },
];

function computeBasketValue(prices) {
  return BASKET.reduce((sum, a) => sum + prices[a.id] * a.amount, 0);
}


router.get("/health", (req, res) => res.json({ ok: true }));

router.get("/prices", async (req, res, next) => {
  try {
    console.log(req.query.ids);
    const vs = (req.query.vs || "usd").toLowerCase();
    const ids = String(req.query.ids || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) return res.status(400).json({ error: "ids is required" });

    const cacheKey = `prices:${vs}:${ids.join(",")}`;
    const ttl = Number(process.env.CACHE_TTL_MS || 60000);

    const cached = getCache(cacheKey);
    if (cached) return res.json({ ts: Date.now(), vs, prices: cached, cached: true });

    const prices = await fetchSimplePrices({
      ids,
      vs,
      apiKey: process.env.COINGECKO_KEY,
    });

    setCache(cacheKey, prices, ttl);
    res.json({ ts: Date.now(), vs, prices, cached: false });
  } catch (e) {
    next(e);
  }
});

router.get("/index", async (req, res, next) => {
  try {
    const vs = (req.query.vs || "usd").toLowerCase();
    const ids = BASKET.map((b) => b.id);

    const cacheKey = `index:${vs}:${ids.join(",")}`;
    const ttl = Number(process.env.CACHE_TTL_MS || 60000);

    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const prices = await fetchSimplePrices({
      ids,
      vs,
      apiKey: process.env.COINGECKO_KEY,
    });

    const basketValue = computeBasketValue(prices);

    const payload = {
      ts: Date.now(),
      vs,
      basket: Object.fromEntries(BASKET.map((x) => [x.id, x.amount])),
      prices,
      basketValue,
      cached: false,
    };

    setCache(cacheKey, payload, ttl);
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

export default router;
