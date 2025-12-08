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

export function profanity(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD") return next();
  if (!req.body || typeof req.body !== "object") return next();

  if (scanValue(req.body)) {
    return res.status(400).json({ error: "Profanity detected." });
  }

  next();
}