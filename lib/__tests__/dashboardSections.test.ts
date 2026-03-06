import { describe, expect, it } from "vitest";
import {
  dashboardSections,
  getVisibleSectionIds,
  isSectionId,
} from "@/app/components/dashboardSections";

describe("dashboardSections", () => {
  it("keeps overview plus the expected content sections", () => {
    expect(dashboardSections.map((section) => section.id)).toEqual([
      "overview",
      "current-state",
      "market-context",
      "setup-readiness",
      "execution",
      "chart",
    ]);
  });

  it("expands overview into all content sections", () => {
    expect(getVisibleSectionIds("overview")).toEqual([
      "current-state",
      "market-context",
      "setup-readiness",
      "execution",
      "chart",
    ]);
  });

  it("returns a single visible section for direct navigation", () => {
    expect(getVisibleSectionIds("execution")).toEqual(["execution"]);
  });

  it("validates section identifiers", () => {
    expect(isSectionId("chart")).toBe(true);
    expect(isSectionId("unknown")).toBe(false);
  });
});
