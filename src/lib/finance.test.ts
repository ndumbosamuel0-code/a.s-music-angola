import { describe, it, expect } from "vitest";
import { splitRevenue } from "./finance";

describe("splitRevenue", () => {
  it("A.S MUSIC recebe 10% do valor após a comissão do distribuidor e o artista 90%", () => {
    const r = splitRevenue(100000, 15, 10);
    expect(r.commission).toBe(15000);
    expect(r.afterCommission).toBe(85000);
    expect(r.platform).toBe(8500);
    expect(r.artist).toBe(76500);
  });

  it("sem comissão do distribuidor, a divisão aplica-se ao valor bruto", () => {
    const r = splitRevenue(1000, 0);
    expect(r.platform).toBe(100);
    expect(r.artist).toBe(900);
  });
});
