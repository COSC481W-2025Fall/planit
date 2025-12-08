import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function profanity(req, res, next) {
  // Ignore GET and HEAD
  if (req.method === "GET" || req.method === "HEAD") {
    return next();
  }

  // If body doesn't exist, skip
  if (!req.body || typeof req.body !== "object") {
    return next();
  }

  for (const [k, v] of Object.entries(req.body)) {
    if (typeof v === "string" && matcher.hasMatch(v)) {
      return res.status(400).json({ error: "Profanity detected." });
    }
  }

  next();
}