import type { CodeToken } from "@/components/task/markdown";

const KEYWORDS = new Set(
  (
    "abstract as async await break case catch class const continue def default defer del do " +
    "elif else enum export extends false final finally fn for from func function go if impl " +
    "implements import in instanceof interface let match mod module mut new nil None not null " +
    "or package private protected pub public raise readonly return self static struct super " +
    "switch this throw true True False try type typeof undefined use var void where while with " +
    "yield select insert update delete into values create table alter drop join on group by " +
    "order limit and is echo fi then esac done local set unset"
  ).split(" "),
);

const HASH_COMMENTS = new Set([
  "bash",
  "sh",
  "zsh",
  "shell",
  "console",
  "python",
  "py",
  "ruby",
  "rb",
  "yaml",
  "yml",
  "toml",
  "dockerfile",
  "makefile",
  "r",
  "perl",
  "conf",
  "ini",
]);
const DASH_COMMENTS = new Set(["sql", "lua", "haskell", "hs"]);
const MARKUP = new Set(["html", "xml", "svg", "vue", "svelte", "htm"]);
const PLAIN = new Set(["", "text", "txt", "plain", "markdown", "md", "diff", "output", "log"]);

const NUMBER = /^(0x[\da-f]+|\d[\d_]*(\.\d+)?(e[+-]?\d+)?)/i;
const WORD = /^[A-Za-z_$][\w$]*/;

function lineComment(language: string): string[] {
  if (HASH_COMMENTS.has(language)) return ["#"];
  if (DASH_COMMENTS.has(language)) return ["--"];
  if (MARKUP.has(language)) return [];
  return ["//"];
}

function blockComment(language: string): [string, string] {
  return MARKUP.has(language) ? ["<!--", "-->"] : ["/*", "*/"];
}

export function codeTokens(source: string, lang: string): CodeToken[][] {
  const language = lang.toLowerCase();
  const lines = source.split("\n");
  if (PLAIN.has(language)) return lines.map((line) => [{ text: line }]);
  const comments = lineComment(language);
  const [blockStart, blockEnd] = blockComment(language);
  let inBlockComment = false;

  return lines.map((line) => {
    const tokens: CodeToken[] = [];
    const push = (text: string, kind?: CodeToken["kind"]) => {
      const last = tokens.at(-1);
      if (last && last.kind === kind) last.text += text;
      else tokens.push({ text, kind });
    };
    let i = 0;
    while (i < line.length) {
      const rest = line.slice(i);
      if (inBlockComment) {
        const end = rest.indexOf(blockEnd);
        const text = end < 0 ? rest : rest.slice(0, end + blockEnd.length);
        push(text, "comment");
        i += text.length;
        if (end >= 0) inBlockComment = false;
        continue;
      }
      if (comments.some((marker) => rest.startsWith(marker))) {
        push(rest, "comment");
        break;
      }
      if (rest.startsWith(blockStart)) {
        inBlockComment = true;
        continue;
      }
      const quote = rest[0];
      if (quote === '"' || quote === "'" || quote === "`") {
        let end = 1;
        while (end < rest.length && rest[end] !== quote) end += rest[end] === "\\" ? 2 : 1;
        const text = rest.slice(0, end + 1);
        push(text, "string");
        i += text.length;
        continue;
      }
      const previous = line[i - 1] ?? " ";
      const number = /[\w$]/.test(previous) ? null : rest.match(NUMBER);
      if (number) {
        push(number[0], "number");
        i += number[0].length;
        continue;
      }
      const word = rest.match(WORD);
      if (word) {
        push(word[0], KEYWORDS.has(word[0]) ? "keyword" : undefined);
        i += word[0].length;
        continue;
      }
      push(rest[0]);
      i += 1;
    }
    return tokens.length ? tokens : [{ text: "" }];
  });
}
