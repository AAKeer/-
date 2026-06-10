import { describe, expect, it } from "vitest";
import { formatCost, formatInteger, formatPercent, formatTokenWan } from "../src/renderer/formatters";

describe("formatters", () => {
  it("把 token 换算成万", () => {
    expect(formatTokenWan(41000)).toBe("4.10 万");
    expect(formatTokenWan(440000)).toBe("44.00 万");
  });

  it("格式化消费金额", () => {
    expect(formatCost(4.01567)).toBe("$4.0157");
    expect(formatCost(null)).toBe("-");
  });

  it("格式化整数和百分比", () => {
    expect(formatInteger(1227)).toBe("1,227");
    expect(formatPercent(35.678)).toBe("35.7%");
    expect(formatPercent(null)).toBe("-");
  });
});
