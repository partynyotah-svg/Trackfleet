import { createHash } from "node:crypto";
const value = process.argv[2];
if (!value || value.length < 8) {
  console.error("Usage: node scripts/hash-init-code.mjs <one-time-code-at-least-8-chars>");
  process.exit(1);
}
console.log(createHash("sha256").update(value).digest("hex"));
