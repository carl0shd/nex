import { describe, expect, it } from "vite-plus/test";
import { hasStage, parseDockerfile } from "@native/environments/dockerfile";

const HOCUSPOCUS = `# Define an alias for the specific node version used in this file.
FROM node:20-alpine AS node

FROM node AS node-build-stage
ARG APP_HOME=/app
WORKDIR \${APP_HOME}
COPY ./hocuspocus/package*.json ./hocuspocus/tsconfig.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY ./hocuspocus/ ./
RUN npm run build

FROM node AS node-run-stage
COPY --from=node-build-stage /app/dist ./dist
COPY --chown=node:node ["start.sh", "/start"]
ADD https://example.com/tool.tar.gz /opt/
RUN --mount=type=bind,source=uv.lock,target=uv.lock \\
    --mount=type=cache,target=/root/.cache/uv \\
    uv sync --frozen
CMD ["npm", "run", "start"]`;

describe("parseDockerfile", () => {
  it("reads stages, aliases included", () => {
    const parsed = parseDockerfile(HOCUSPOCUS);
    expect(parsed.stages).toEqual([
      { from: "node:20-alpine", name: "node" },
      { from: "node", name: "node-build-stage" },
      { from: "node", name: "node-run-stage" },
    ]);
    expect(hasStage(parsed, "NODE-RUN-STAGE")).toBe(true);
    expect(hasStage(parsed, "production")).toBe(false);
  });

  it("lists the files a build copies in from the context", () => {
    expect(parseDockerfile(HOCUSPOCUS).sources).toEqual([
      "./hocuspocus/package*.json",
      "./hocuspocus/tsconfig.json",
      "./hocuspocus/",
      "start.sh",
      "uv.lock",
    ]);
  });

  it("maps where each copy lands and keeps the last command", () => {
    const parsed = parseDockerfile(HOCUSPOCUS);
    expect(parsed.copies.find((copy) => copy.dest === "/start")?.sources).toEqual(["start.sh"]);
    expect(parsed.copies.some((copy) => copy.dest === "./dist")).toBe(false);
    expect(parsed.cmd).toBe("npm run start");
  });
});
