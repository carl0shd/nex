import { describe, expect, it } from "vite-plus/test";
import { ipcErrorMessage } from "@/lib/ipc-error";

describe("ipcErrorMessage", () => {
  it("drops Electron's remote method prefix", () => {
    const error = new Error(
      "Error invoking remote method 'work:start': Error: fatal: invalid reference: main2",
    );
    expect(ipcErrorMessage(error)).toBe("fatal: invalid reference: main2");
  });

  it("keeps a plain message", () => {
    expect(ipcErrorMessage(new Error("Project not found"))).toBe("Project not found");
    expect(ipcErrorMessage("")).toBe("Something went wrong");
  });
});
