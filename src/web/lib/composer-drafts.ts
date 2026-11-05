import type { JSONContent } from "@tiptap/react";
import type { Attachment } from "@/components/composer/attachments";

export interface ComposerDraft {
  content?: JSONContent;
  attachments: Attachment[];
}

const drafts = new Map<string, ComposerDraft>();

export function readDraft(key: string): ComposerDraft | undefined {
  return drafts.get(key);
}

export function saveDraft(key: string, change: Partial<ComposerDraft>): void {
  drafts.set(key, { attachments: [], ...drafts.get(key), ...change });
}
