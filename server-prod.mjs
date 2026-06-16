import { createServer } from "node:http";

process.env.NODE_ENV = "production";

const port = parseInt(process.env.PORT ?? "5000", 10);

const { default: app } = await import("./dist/server/server.js");

const server = createServer(async (req, res) => {
  const fwdProto = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(fwdProto)
    ? fwdProto[0]
    : (fwdProto ?? "").split(",")[0].trim() || "https";

  const host = req.headers.host ?? "localhost";
  const url = `${proto}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      for (const v of val) headers.append(key, v);
    } else {
      headers.set(key, val);
    }
  }

  const method = req.method ?? "GET";
  let body = null;
  if (method !== "GET" && method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  const request = new Request(url, {
    method,
    headers,
    body,
    ...(body ? { duplex: "half" } : {}),
  });

  try {
    const response = await app.fetch(request, {}, {});

    res.statusCode = response.status;

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") continue;
      res.setHeader(key, value);
    }

    const cookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
    if (cookies.length > 0) res.setHeader("set-cookie", cookies);

    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
  } catch (err) {
    console.error("[server-prod] unhandled error:", err);
    if (!res.headersSent) res.statusCode = 500;
    res.write("Internal Server Error");
  } finally {
    res.end();
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[server-prod] listening on http://0.0.0.0:${port}`);
});
