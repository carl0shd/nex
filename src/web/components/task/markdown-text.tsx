import { Fragment, useMemo, type ReactNode } from "react";
import { marked, type Token, type Tokens } from "marked";
import { InlineCode } from "@/components/atoms/inline-code";
import { codeTokens } from "@/lib/code-tokens";
import {
  CodeBlock,
  MdDel,
  MdDivider,
  MdEm,
  MdQuote,
  MdHeading,
  MdLink,
  MdList,
  MdParagraph,
  MdStrong,
  MdTable,
} from "@/components/task/markdown";

const TAIL_START = "\uE000";
const CARET = "\uE001";
const MARKERS = /[\uE000\uE001]/g;

const plain = (value: string) => value.replace(MARKERS, "");

function streamed(value: string): ReactNode {
  if (!value.includes(TAIL_START) && !value.includes(CARET)) return value;
  const [head, rest = ""] = value.split(TAIL_START);
  const [tail, after = ""] = rest.split(CARET);
  const hasCaret = value.includes(CARET);
  return (
    <>
      {plain(head)}
      {value.includes(TAIL_START) && tail && <span className="stream-tail">{plain(tail)}</span>}
      {hasCaret && <span aria-hidden className="stream-caret is-streaming" />}
      {plain(after)}
    </>
  );
}

function inline(tokens: readonly Token[] | undefined): ReactNode {
  return tokens?.map((token, index) => {
    switch (token.type) {
      case "strong":
        return <MdStrong key={index}>{inline((token as Tokens.Strong).tokens)}</MdStrong>;
      case "em":
        return <MdEm key={index}>{inline((token as Tokens.Em).tokens)}</MdEm>;
      case "del":
        return <MdDel key={index}>{inline((token as Tokens.Del).tokens)}</MdDel>;
      case "codespan":
        return <InlineCode key={index}>{plain((token as Tokens.Codespan).text)}</InlineCode>;
      case "link": {
        const link = token as Tokens.Link;
        return (
          <MdLink key={index} href={link.href}>
            {inline(link.tokens)}
          </MdLink>
        );
      }
      case "br":
        return <br key={index} />;
      case "text": {
        const text = token as Tokens.Text;
        return (
          <Fragment key={index}>{text.tokens ? inline(text.tokens) : streamed(text.text)}</Fragment>
        );
      }
      default:
        return (
          <Fragment key={index}>
            {streamed("text" in token ? String(token.text) : token.raw)}
          </Fragment>
        );
    }
  });
}

function listItem(item: Tokens.ListItem): ReactNode {
  return item.tokens.map((token, index) =>
    token.type === "text" || token.type === "paragraph" ? (
      <Fragment key={index}>{inline((token as Tokens.Text).tokens ?? [token])}</Fragment>
    ) : (
      <Fragment key={index}>{block(token)}</Fragment>
    ),
  );
}

function block(token: Token): ReactNode {
  switch (token.type) {
    case "paragraph":
      return <MdParagraph>{inline((token as Tokens.Paragraph).tokens)}</MdParagraph>;
    case "heading": {
      const heading = token as Tokens.Heading;
      return <MdHeading level={heading.depth <= 2 ? 2 : 3}>{inline(heading.tokens)}</MdHeading>;
    }
    case "list": {
      const list = token as Tokens.List;
      return <MdList ordered={list.ordered} items={list.items.map(listItem)} />;
    }
    case "code": {
      const code = token as Tokens.Code;
      return (
        <CodeBlock
          file=""
          language={code.lang || "text"}
          lines={codeTokens(plain(code.text), code.lang ?? "")}
        />
      );
    }
    case "table": {
      const table = token as Tokens.Table;
      return (
        <MdTable
          head={table.header.map((cell) => plain(cell.text))}
          rows={table.rows.map((row) => row.map((cell) => inline(cell.tokens)))}
        />
      );
    }
    case "hr":
      return <MdDivider />;
    case "blockquote":
      return (
        <MdQuote>
          {(token as Tokens.Blockquote).tokens.map((child, index) => (
            <Fragment key={index}>{block(child)}</Fragment>
          ))}
        </MdQuote>
      );
    case "space":
      return null;
    default:
      return <MdParagraph>{streamed(token.raw)}</MdParagraph>;
  }
}

function streamSource(text: string, tail: string): string {
  const visible = `${text}${tail}`.trimEnd();
  const head = visible.slice(0, Math.min(text.length, visible.length));
  return `${head}${TAIL_START}${visible.slice(head.length)}${CARET}`;
}

export function MarkdownText({ text, streamTail }: { text: string; streamTail?: string }) {
  const source = streamTail === undefined ? text : streamSource(text, streamTail);
  const tokens = useMemo(() => marked.lexer(source), [source]);
  return (
    <div className="flex flex-col gap-2.5">
      {tokens.map((token, index) => (
        <Fragment key={index}>{block(token)}</Fragment>
      ))}
    </div>
  );
}
