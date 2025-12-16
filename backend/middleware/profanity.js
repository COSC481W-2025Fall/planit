import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

function scanValue(value) {
  if (typeof value === "string") {
    return matcher.hasMatch(value);
  }

  if (Array.isArray(value)) {
    return value.some((v) => scanValue(v));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((v) => scanValue(v));
  }

  return false;
}

function removeKeys(obj, keys) {
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    obj.forEach((v) => removeKeys(v, keys));
    return;
  }

  keys.forEach((k) => {
    delete obj[k];
  });

  Object.values(obj).forEach((v) => removeKeys(v, keys));
}

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