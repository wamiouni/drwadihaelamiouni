import { NextRequest } from "next/server";

// Proxies a remote thumbnail through our server, spoofing the referer to the
// image's own host — this bypasses hotlink protection (e.g. safiralchamal.com
// returns 403 to cross-site requests).
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new Response("bad protocol", { status: 400 });
  }

  try {
    const res = await fetch(target.href, {
      headers: {
        referer: `${target.protocol}//${target.host}/`,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        accept: "image/*,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });

    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.startsWith("image/")) {
      return new Response("not an image", { status: 404 });
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "content-type": ct,
        "cache-control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("fetch failed", { status: 404 });
  }
}
