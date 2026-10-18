import { describe, it, expect } from "vitest";
function parseCommand(text: string) {
  const p = text.trim().split(/\s+/);
  if (p.length !== 4 || p[0].toUpperCase() !== "INIT") return null;
  return { trackerCode:p[1], plate:p[2], oneTimeCode:p[3] };
}
describe("tracker SMS command shape", () => {
  it("parses valid INIT command", () => {
    expect(parseCommand("INIT TRK-001 KDA123A RANDOMCODE123")).toEqual({trackerCode:"TRK-001",plate:"KDA123A",oneTimeCode:"RANDOMCODE123"});
  });
  it("rejects other commands", () => {
    expect(parseCommand("HELP")).toBeNull();
  });
});
