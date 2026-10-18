import { describe, it, expect } from "vitest";
import { isValidEmail, normalizePhone } from "@/lib/validation";
describe("shared input validation", () => {
  it("accepts a normal email and rejects invalid input", () => {
    expect(isValidEmail("ops@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
  it("normalizes Kenyan local mobile numbers to E.164", () => {
    expect(normalizePhone("0712345678")).toBe("+254712345678");
    expect(normalizePhone("+254712345678")).toBe("+254712345678");
    expect(normalizePhone("bad")).toBeNull();
  });
});
