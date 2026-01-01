import fetch from "node-fetch";

export async function fetchSimplePrices({ ids, vs, apiKey }) {
    console.log(ids, "ids");
    console.log(ids.join(","), "joined ids");

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${
    ids.join(",")
  }&vs_currencies=${encodeURIComponent(vs)}&x_cg_demo_api_key=${apiKey}`;

  
  console.log(url, "url");
  const headers = {};
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;


  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`CoinGecko error: ${r.status}`);



  const json = await r.json();

  // normalize to { id: price }
  const out = {};
  for (const id of ids) {
    const p = json?.[id]?.[vs];
    if (typeof p !== "number") throw new Error(`Missing price for ${id}`);
    out[id] = p;
  }
  return out;
}
