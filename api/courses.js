const REPO = "thp91/Studio-Meraki";
const FILE = "data/courses.json";
const GH_API = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const ghToken = process.env.GITHUB_TOKEN;
  if (!ghToken) return res.status(500).json({ error: "GITHUB_TOKEN non configuré" });

  // ── GET : lecture du fichier ──────────────────────────────────
  if (req.method === "GET") {
    const r = await fetch(GH_API, {
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
    return res.json({ sha: data.sha, content });
  }

  // ── PUT : écriture du fichier (authentifiée) ──────────────────
  if (req.method === "PUT") {
    const secret = process.env.ADMIN_SECRET;
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!secret || bearer !== secret) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const { content, sha } = req.body || {};
    if (!content || !sha) return res.status(400).json({ error: "content et sha requis" });

    const encoded = Buffer.from(content, "utf-8").toString("base64");
    const r = await fetch(GH_API, {
      method: "PUT",
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Admin: mise à jour des cours",
        content: encoded,
        sha,
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json({ sha: data.content.sha });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
