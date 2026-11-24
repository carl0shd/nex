export const DNS_TTL_SECONDS = 5;

export const TYPE_A = 1;
export const TYPE_AAAA = 28;
const CLASS_IN = 1;
const HEADER = 12;
const MAX_LABELS = 128;

const RCODE_FORMERR = 1;
const RCODE_NXDOMAIN = 3;
const RCODE_NOTIMP = 4;

export interface DnsQuestion {
  id: number;
  flags: number;
  name: string;
  type: number;
  klass: number;
  raw: Buffer;
}

export function parseQuery(packet: Buffer): DnsQuestion | null {
  if (packet.length < HEADER) return null;
  const flags = packet.readUInt16BE(2);
  if (flags & 0x8000 || packet.readUInt16BE(4) !== 1) return null;
  const labels: string[] = [];
  let offset = HEADER;
  for (;;) {
    if (offset >= packet.length || labels.length > MAX_LABELS) return null;
    const length = packet[offset] as number;
    if (length === 0) break;
    if (length > 63) return null;
    labels.push(packet.toString("latin1", offset + 1, offset + 1 + length));
    offset += 1 + length;
  }
  const end = offset + 1 + 4;
  if (end > packet.length) return null;
  return {
    id: packet.readUInt16BE(0),
    flags,
    name: labels.join(".").toLowerCase(),
    type: packet.readUInt16BE(offset + 1),
    klass: packet.readUInt16BE(offset + 3),
    raw: packet.subarray(HEADER, end),
  };
}

export const inDomain = (name: string, domain: string) =>
  name.replace(/\.$/, "").endsWith(`.${domain}`);

function header(id: number, queryFlags: number, rcode: number, answers: number): Buffer {
  const out = Buffer.alloc(HEADER);
  out.writeUInt16BE(id, 0);
  const opcode = queryFlags & 0x7800;
  const recursion = queryFlags & 0x0100;
  out.writeUInt16BE(0x8000 | opcode | 0x0400 | recursion | rcode, 2);
  out.writeUInt16BE(1, 4);
  out.writeUInt16BE(answers, 6);
  return out;
}

function answer(type: number, address: Buffer, ttl: number): Buffer {
  const out = Buffer.alloc(12 + address.length);
  out.writeUInt16BE(0xc000 | HEADER, 0);
  out.writeUInt16BE(type, 2);
  out.writeUInt16BE(CLASS_IN, 4);
  out.writeUInt32BE(ttl, 6);
  out.writeUInt16BE(address.length, 10);
  address.copy(out, 12);
  return out;
}

export interface DnsRecords {
  v4: readonly string[];
  v6: readonly string[];
}

export const LOOPBACK_RECORDS: DnsRecords = { v4: ["127.0.0.1"], v6: ["::1"] };

export function ipv4Bytes(address: string): Buffer | null {
  const parts = address.split(".").map(Number);
  const valid =
    parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part < 256);
  return valid ? Buffer.from(parts) : null;
}

export function ipv6Bytes(address: string): Buffer | null {
  const halves = address.toLowerCase().split("::");
  if (halves.length > 2) return null;
  const groups = (part: string | undefined) => (part ? part.split(":") : []);
  const [head, tail] = [groups(halves[0]), groups(halves[1])];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const all = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (!all.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
  const out = Buffer.alloc(16);
  all.forEach((group, index) => out.writeUInt16BE(Number.parseInt(group, 16), index * 2));
  return out;
}

function encoded(type: number, records: DnsRecords): Buffer[] {
  if (type === TYPE_A) return records.v4.flatMap((ip) => ipv4Bytes(ip) ?? []);
  if (type === TYPE_AAAA) return records.v6.flatMap((ip) => ipv6Bytes(ip) ?? []);
  return [];
}

export function errorReply(packet: Buffer): Buffer | null {
  if (packet.length < 4 || packet.readUInt16BE(2) & 0x8000) return null;
  const out = Buffer.alloc(HEADER);
  out.writeUInt16BE(packet.readUInt16BE(0), 0);
  out.writeUInt16BE(0x8000 | (packet.readUInt16BE(2) & 0x7900) | RCODE_FORMERR, 2);
  return out;
}

export function answerQuery(
  question: DnsQuestion,
  domain: string,
  records: DnsRecords = LOOPBACK_RECORDS,
  ttl = DNS_TTL_SECONDS,
): Buffer {
  const { id, flags, type, klass, raw, name } = question;
  if ((flags & 0x7800) !== 0) return Buffer.concat([header(id, flags, RCODE_NOTIMP, 0), raw]);
  if (!inDomain(name, domain)) return Buffer.concat([header(id, flags, RCODE_NXDOMAIN, 0), raw]);
  const addresses = klass === CLASS_IN ? encoded(type, records) : [];
  return Buffer.concat([
    header(id, flags, 0, addresses.length),
    raw,
    ...addresses.map((address) => answer(type, address, ttl)),
  ]);
}
