import { describe, expect, it } from "vitest";
import {
  chooseInitialQuality,
  getQualitySettings,
} from "@/lib/rendering/quality";

describe("adaptive quality", () => {
  it("chooses low quality for narrow or low-core devices", () => {
    expect(chooseInitialQuality(390, 2)).toBe("low");
  });

  it("chooses balanced quality for normal laptop widths", () => {
    expect(chooseInitialQuality(1024, 8)).toBe("balanced");
  });

  it("keeps low quality render targets smaller", () => {
    expect(getQualitySettings("low").reflectionScale).toBeLessThan(
      getQualitySettings("high").reflectionScale,
    );
  });
});
