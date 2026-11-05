import { Extension, InputRule, Node, ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import { Fragment, Slice, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { LinkPillView } from "@/components/composer/inline-pill";
import { describeLink, splitLinks } from "@/lib/link-preview";

const TYPED_LINK = /(?:^|\s)(https?:\/\/\S+)\s$/;

export const LinkPillNode = Node.create({
  name: "linkPill",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { url: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "span[data-link-pill]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-link-pill": "" })];
  },
  renderText({ node }) {
    return String(node.attrs.url);
  },
  addNodeView() {
    return ReactNodeViewRenderer(LinkPillView);
  },
});

export const TypedLinkToPill = Extension.create({
  name: "typedLinkToPill",
  addInputRules() {
    return [
      new InputRule({
        find: TYPED_LINK,
        handler: ({ state, range, match }) => {
          const url = match[1];
          if (!describeLink(url)) return null;
          const start = range.from + match[0].indexOf(url);
          state.tr.replaceWith(start, range.to, [
            state.schema.nodes.linkPill.create({ url }),
            state.schema.text(" "),
          ]);
          return undefined;
        },
      }),
    ];
  },
});

export function pasteLinks(view: EditorView, text: string): boolean {
  const lines = text.split("\n").map(splitLinks);
  if (!lines.some((parts) => parts.some((part) => part.kind === "link"))) return false;
  const { schema } = view.state;
  const nodes: ProseMirrorNode[] = lines.flatMap((parts, index) => [
    ...(index > 0 ? [schema.nodes.hardBreak.create()] : []),
    ...parts.map((part) =>
      part.kind === "link"
        ? schema.nodes.linkPill.create({ url: part.url })
        : schema.text(part.text),
    ),
  ]);
  if (lines[lines.length - 1].at(-1)?.kind === "link") nodes.push(schema.text(" "));
  view.dispatch(
    view.state.tr.replaceSelection(new Slice(Fragment.fromArray(nodes), 0, 0)).scrollIntoView(),
  );
  return true;
}
