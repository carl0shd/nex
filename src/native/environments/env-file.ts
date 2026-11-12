const LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)?$/;

function unquote(raw: string): string {
  const value = raw.trim();
  const quote = value[0];
  if (quote === '"' || quote === "'" || quote === "`") {
    const end = value.indexOf(quote, 1);
    const inner = end === -1 ? value.slice(1) : value.slice(1, end);
    return quote === '"' ? inner.replace(/\\n/g, "\n").replace(/\\(["\\])/g, "$1") : inner;
  }
  return value.replace(/\s+#.*$/, "");
}

export function parseEnvFile(text: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = LINE.exec(line);
    if (match?.[1]) vars[match[1]] = unquote(match[2] ?? "");
  }
  return vars;
}

export interface Interpolation {
  value: string;
  missing: string[];
}

function closingBrace(text: string, from: number): number {
  let depth = 1;
  for (let index = from; index < text.length; index++) {
    if (text[index] === "{") depth++;
    if (text[index] === "}" && --depth === 0) return index;
  }
  return -1;
}

export function interpolate(text: string, vars: Readonly<Record<string, string>>): Interpolation {
  const missing: string[] = [];
  let value = "";
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char !== "$") {
      value += char;
      continue;
    }
    const next = text[index + 1];
    if (next === "$") {
      value += "$";
      index++;
    } else if (next === "{") {
      const end = closingBrace(text, index + 2);
      if (end === -1) {
        value += text.slice(index);
        break;
      }
      const body = text.slice(index + 2, end);
      const match = /^([A-Za-z_][A-Za-z0-9_]*)(?:(:?[-?+])([\s\S]*))?$/.exec(body);
      if (!match?.[1]) {
        value += text.slice(index, end + 1);
      } else {
        const [, name, operator, fallback = ""] = match;
        const set = name in vars;
        const filled = set && vars[name] !== "";
        const inner = () => {
          const result = interpolate(fallback, vars);
          missing.push(...result.missing);
          return result.value;
        };
        if (operator === ":-") value += filled ? vars[name] : inner();
        else if (operator === "-") value += set ? vars[name] : inner();
        else if (operator === ":+") value += filled ? inner() : "";
        else if (operator === "+") value += set ? inner() : "";
        else if (set) value += vars[name];
        else missing.push(name);
      }
      index = end;
    } else {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(index + 1));
      if (!match) {
        value += "$";
        continue;
      }
      if (match[0] in vars) value += vars[match[0]];
      else missing.push(match[0]);
      index += match[0].length;
    }
  }
  return { value, missing };
}
