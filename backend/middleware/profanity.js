export function profanity(req, res, next) {
  const skipProfanityPaths = [
    "/placesAPI/search",
    "/placesAPI/cityAutocomplete",
    "/activities/create",
    "/activities/delete",
    "/activities/update",
  ];

  const cleanUrl = req.originalUrl.split("?")[0];

  if (skipProfanityPaths.some((p) => cleanUrl.startsWith(p))) {
    return next();
  }

  if (req.method === "GET" || req.method === "HEAD") return next();
  if (!req.body || typeof req.body !== "object") return next();

  const bodyToScan = structuredClone(req.body);

  const ignoredKeys = ["customPhoto", "photo", "pfp"];
  removeKeys(bodyToScan, ignoredKeys);

  if (scanValue(bodyToScan)) {
    return res.status(400).json({ error: "Profanity detected." });
  }

  next();
}