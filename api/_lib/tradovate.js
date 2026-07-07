// Minimal Tradovate REST client (Access Track) for the real-execution importer.
//
// Docs: https://api.tradovate.com  ·  base https://{live|demo}.tradovateapi.com/v1
// We only need auth + reading closed trades (fillPair/list joined with fill/list)
// and mapping contractId -> symbol. Files under api/_lib are not Vercel routes.

const base = (env) => `https://${env === "live" ? "live" : "demo"}.tradovateapi.com/v1`;

async function call(env, path, { token, body, method } = {}) {
  const res = await fetch(base(env) + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`Tradovate ${path} ${res.status}: ${json.errorText || json.message || text}`);
  return json;
}

// Exchange credentials for an access token. Surfaces the two common non-token
// responses: an error, or a rate-limit "penalty" ticket.
export async function accessToken(creds, env) {
  const j = await call(env, "/auth/accessTokenRequest", {
    body: {
      name: creds.name,
      password: creds.password,
      appId: creds.appId,
      appVersion: creds.appVersion || "1.0",
      cid: creds.cid != null && creds.cid !== "" ? Number(creds.cid) : undefined,
      sec: creds.sec,
      deviceId: creds.deviceId || "trademethod-server",
    },
  });
  if (j["p-ticket"]) throw new Error(`Tradovate rate-limit: retry in ${j["p-time"] || "?"}s (penalty ticket).`);
  if (j.errorText) throw new Error(j.errorText);
  if (!j.accessToken) throw new Error("No access token returned — check that API Access is enabled on the account.");
  return { accessToken: j.accessToken, expiresAt: j.expirationTime || null };
}

export async function renew(token, env) {
  const j = await call(env, "/auth/renewAccessToken", { token });
  return { accessToken: j.accessToken || token, expiresAt: j.expirationTime || null };
}

export const listAccounts = (token, env) => call(env, "/account/list", { token });
export const listFillPairs = (token, env) => call(env, "/fillPair/list", { token });
export const listFills = (token, env) => call(env, "/fill/list", { token });
export const contractItem = (token, env, id) => call(env, `/contract/item?id=${id}`, { token });
