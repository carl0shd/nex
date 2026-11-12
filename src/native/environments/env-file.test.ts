import { describe, expect, it } from "vite-plus/test";
import { interpolate, parseEnvFile } from "@native/environments/env-file";

describe("parseEnvFile", () => {
  it("reads plain, exported, quoted and commented lines", () => {
    expect(
      parseEnvFile(
        [
          "# comment",
          "PLAIN=value",
          "export EXPORTED=yes",
          'DOUBLE="a b\\nc"',
          "SINGLE='$NOT_EXPANDED'",
          "INLINE=value # trailing",
          "EMPTY=",
          "",
        ].join("\n"),
      ),
    ).toEqual({
      PLAIN: "value",
      EXPORTED: "yes",
      DOUBLE: "a b\nc",
      SINGLE: "$NOT_EXPANDED",
      INLINE: "value",
      EMPTY: "",
    });
  });
});

describe("interpolate", () => {
  const vars = { USER: "app", EMPTY: "" };

  it("fills braces, bare names and defaults", () => {
    expect(interpolate("${USER}:$USER", vars).value).toBe("app:app");
    expect(interpolate("${PORT:-8000}", vars).value).toBe("8000");
    expect(interpolate("${EMPTY:-fallback}", vars).value).toBe("fallback");
    expect(interpolate("${EMPTY-fallback}", vars).value).toBe("");
    expect(interpolate("${USER:+set}", vars).value).toBe("set");
  });

  it("resolves nested defaults and escapes", () => {
    expect(interpolate("${A:-${USER:-x}}", vars).value).toBe("app");
    expect(interpolate("$${USER}", vars).value).toBe("${USER}");
  });

  it("reports names that aren't set", () => {
    expect(interpolate("postgres://${DB_USER}@db/${DB_NAME:-app}", vars)).toEqual({
      value: "postgres://@db/app",
      missing: ["DB_USER"],
    });
  });
});
