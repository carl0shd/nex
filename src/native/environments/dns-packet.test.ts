import { describe, expect, it } from "vite-plus/test";
import {
  answerQuery,
  errorReply,
  inDomain,
  ipv6Bytes,
  parseQuery,
  TYPE_A,
  TYPE_AAAA,
} from "@native/environments/dns-packet";

function query(name: string, type: number, { id = 0x1234, flags = 0x0100, edns = false } = {}) {
  const labels = name.split(".").filter(Boolean);
  const question = Buffer.concat([
    ...labels.map((label) => Buffer.concat([Buffer.from([label.length]), Buffer.from(label)])),
    Buffer.from([0, type >> 8, type & 0xff, 0, 1]),
  ]);
  const head = Buffer.alloc(12);
  head.writeUInt16BE(id, 0);
  head.writeUInt16BE(flags, 2);
  head.writeUInt16BE(1, 4);
  head.writeUInt16BE(edns ? 1 : 0, 10);
  const opt = Buffer.from([0, 0, 41, 0x10, 0, 0, 0, 0, 0, 0, 0]);
  return Buffer.concat([head, question, ...(edns ? [opt] : [])]);
}

const reply = (packet: Buffer) => {
  const parsed = parseQuery(packet);
  if (!parsed) throw new Error("not a query");
  return answerQuery(parsed, "nex");
};

const rcode = (packet: Buffer) => packet.readUInt16BE(2) & 0xf;
const answers = (packet: Buffer) => packet.readUInt16BE(6);

describe("nex dns", () => {
  it("reads the name and type of a query, lowercased", () => {
    const parsed = parseQuery(query("Web.Fix-Login.NEX", TYPE_A, { edns: true }));
    expect(parsed).toMatchObject({ id: 0x1234, name: "web.fix-login.nex", type: TYPE_A, klass: 1 });
  });

  it("answers A with 127.0.0.1 and AAAA with ::1 for every .nex name, 5 s TTL", () => {
    const a = reply(query("web.task.nex", TYPE_A));
    expect(a.readUInt16BE(0)).toBe(0x1234);
    expect(a.readUInt16BE(2) & 0x8000).toBe(0x8000);
    expect(rcode(a)).toBe(0);
    expect(answers(a)).toBe(1);
    expect([...a.subarray(-4)]).toEqual([127, 0, 0, 1]);
    expect(a.readUInt32BE(a.length - 10)).toBe(5);
    const aaaa = reply(query("task.nex", TYPE_AAAA));
    expect(answers(aaaa)).toBe(1);
    expect([...aaaa.subarray(-16)]).toEqual([...Array(15).fill(0), 1]);
  });

  it("answers with the addresses it's given, and no data when there are none", () => {
    const parsed = parseQuery(query("db.task.svc.nex", TYPE_A))!;
    const container = { v4: ["192.168.64.180"], v6: [] };
    const a = answerQuery(parsed, "nex", container);
    expect(answers(a)).toBe(1);
    expect([...a.subarray(-4)]).toEqual([192, 168, 64, 180]);
    const aaaa = answerQuery(parseQuery(query("db.task.svc.nex", TYPE_AAAA))!, "nex", container);
    expect(rcode(aaaa)).toBe(0);
    expect(answers(aaaa)).toBe(0);
  });

  it("writes IPv6 addresses", () => {
    expect([...ipv6Bytes("::1")!]).toEqual([...Array(15).fill(0), 1]);
    expect(ipv6Bytes("fd8e:39d0:ea3d:5689:f00b:37ff:fe86:43ae")?.toString("hex")).toBe(
      "fd8e39d0ea3d5689f00b37fffe8643ae",
    );
    expect(ipv6Bytes("fe80::1:2")?.toString("hex")).toBe("fe800000000000000000000000010002");
    expect(ipv6Bytes("1::2::3")).toBeNull();
    expect(ipv6Bytes("nope")).toBeNull();
  });

  it("answers other record types of .nex names with no data", () => {
    const https = reply(query("task.nex", 65));
    expect(rcode(https)).toBe(0);
    expect(answers(https)).toBe(0);
  });

  it("says a name outside .nex doesn't exist", () => {
    const other = reply(query("example.com", TYPE_A));
    expect(rcode(other)).toBe(3);
    expect(answers(other)).toBe(0);
    expect(rcode(reply(query("nex", TYPE_A)))).toBe(3);
  });

  it("refuses other opcodes and malformed packets", () => {
    expect(rcode(reply(query("task.nex", TYPE_A, { flags: 0x2900 })))).toBe(4);
    expect(parseQuery(Buffer.from([1, 2, 3]))).toBeNull();
    expect(parseQuery(query("task.nex", TYPE_A).subarray(0, 20))).toBeNull();
    expect(parseQuery(query("task.nex", TYPE_A, { flags: 0x8000 }))).toBeNull();
    expect(rcode(errorReply(Buffer.from([0, 1, 1, 0, 0])) as Buffer)).toBe(1);
  });

  it("matches only names inside the domain", () => {
    expect(inDomain("a.b.nex", "nex")).toBe(true);
    expect(inDomain("a.nex.", "nex")).toBe(true);
    expect(inDomain("annex", "nex")).toBe(false);
  });
});
