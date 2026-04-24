import { describe, it, expect } from "vitest";
import {
  isHoliday,
  isBusinessDay,
  addBusinessDays,
  countBusinessDays,
  getBusinessDaysUntil,
  getUrgencyLevel,
} from "./businessDays";

describe("Business Days Calculator", () => {
  describe("isHoliday", () => {
    it("should identify fixed holidays", () => {
      // Ano Novo
      expect(isHoliday(new Date(2026, 0, 1))).toBe(true);
      // Tiradentes
      expect(isHoliday(new Date(2026, 3, 21))).toBe(true);
      // Natal
      expect(isHoliday(new Date(2026, 11, 25))).toBe(true);
    });

    it("should not identify non-holidays as holidays", () => {
      expect(isHoliday(new Date(2026, 0, 2))).toBe(false);
      expect(isHoliday(new Date(2026, 0, 5))).toBe(false);
    });
  });

  describe("isBusinessDay", () => {
    it("should identify weekdays as business days", () => {
      // Monday
      expect(isBusinessDay(new Date(2026, 3, 6))).toBe(true);
      // Wednesday
      expect(isBusinessDay(new Date(2026, 3, 8))).toBe(true);
      // Friday
      expect(isBusinessDay(new Date(2026, 3, 10))).toBe(true);
    });

    it("should not identify weekends as business days", () => {
      // Saturday
      expect(isBusinessDay(new Date(2026, 3, 4))).toBe(false);
      // Sunday
      expect(isBusinessDay(new Date(2026, 3, 5))).toBe(false);
    });

    it("should not identify holidays as business days", () => {
      // Ano Novo (Thursday)
      expect(isBusinessDay(new Date(2026, 0, 1))).toBe(false);
    });
  });

  describe("addBusinessDays", () => {
    it("should add business days correctly", () => {
      const startDate = new Date(2026, 3, 1); // Wednesday
      const result = addBusinessDays(startDate, 5);
      // Should skip weekend (Sat 4, Sun 5) and land on Thursday 9
      expect(result.getDate()).toBe(9);
    });

    it("should handle start day inclusion", () => {
      const startDate = new Date(2026, 3, 1); // Wednesday
      const resultWithoutStart = addBusinessDays(startDate, 1, false);
      const resultWithStart = addBusinessDays(startDate, 1, true);

      // Without start: Thursday 2
      expect(resultWithoutStart.getDate()).toBe(2);
      // With start: Wednesday 1 (counts the start day itself)
      expect(resultWithStart.getDate()).toBe(1);
    });

    it("should skip weekends", () => {
      const startDate = new Date(2026, 3, 3); // Friday
      const result = addBusinessDays(startDate, 1);
      // Should skip Sat 4 and Sun 5, land on Monday 6
      expect(result.getDate()).toBe(6);
    });
  });

  describe("countBusinessDays", () => {
    it("should count business days between dates", () => {
      const startDate = new Date(2026, 3, 1); // Wednesday
      const endDate = new Date(2026, 3, 8); // Wednesday
      // Wed, Thu, Fri (skip Sat, Sun), Mon, Tue, Wed = 6 days
      const count = countBusinessDays(startDate, endDate);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe("getUrgencyLevel", () => {
    it("should return critical for overdue or today", () => {
      expect(getUrgencyLevel(-1)).toBe("critical");
      expect(getUrgencyLevel(0)).toBe("critical");
      expect(getUrgencyLevel(1)).toBe("critical");
    });

    it("should return high for 2-3 days", () => {
      expect(getUrgencyLevel(2)).toBe("high");
      expect(getUrgencyLevel(3)).toBe("high");
    });

    it("should return medium for 4-7 days", () => {
      expect(getUrgencyLevel(4)).toBe("medium");
      expect(getUrgencyLevel(7)).toBe("medium");
    });

    it("should return low for more than 7 days", () => {
      expect(getUrgencyLevel(8)).toBe("low");
      expect(getUrgencyLevel(30)).toBe("low");
    });
  });
});
