import { describe, expect, it } from "vite-plus/test";
import { createPortDetector, findPort } from "@native/pty/port-detector";

describe("findPort", () => {
  it.each([
    ["  ➜  Local:   http://localhost:5173/", 5173],
    ["Local: http://127.0.0.1:3000/", 3000],
    ["listening on port 8080", 8080],
    ["Server listening on :4000", 4000],
    ["Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)", 8000],
    ["* Listening on tcp://127.0.0.1:3000", 3000],
    ["Starting server on [::]:9000", 9000],
    ["ready - started server on 0.0.0.0:3001, url: http://localhost:3001", 3001],
    ["Angular Live Development Server is listening on localhost:4200", 4200],
    ["Open http://app.localhost:1355 in your browser", 1355],
  ])("finds the port in %j", (line, port) => {
    expect(findPort(line)).toBe(port);
  });

  it.each([
    "Port 5173 is in use, trying another one...",
    "Error: listen EADDRINUSE: address already in use :::3000",
    "  ➜  Network: http://192.168.1.20:5173/",
    "[vite] http proxy error: connect ECONNREFUSED 127.0.0.1:8080",
    "compiled 120 modules in 3000 ms",
    "pnpm dev --port 4000",
    "http://localhost:99999",
  ])("ignores %j", (line) => {
    expect(findPort(line)).toBeNull();
  });
});

describe("createPortDetector", () => {
  it("joins lines split across chunks and strips colors", () => {
    const ports: number[] = [];
    const detector = createPortDetector((port) => ports.push(port));
    detector.push("  \x1b[32m➜\x1b[39m  \x1b[1mLocal\x1b[22m:   \x1b[36mhttp://localhost:");
    expect(ports).toEqual([]);
    detector.push("\x1b[1m5174\x1b[22m/\x1b[39m\r\n");
    expect(ports).toEqual([5174]);
  });

  it("reports a port once and again when it changes", () => {
    const ports: number[] = [];
    const detector = createPortDetector((port) => ports.push(port));
    detector.push("Local: http://localhost:3000\nGET http://localhost:3000/ 200\n");
    detector.push("listening on port 3002\n");
    expect(ports).toEqual([3000, 3002]);
  });
});
