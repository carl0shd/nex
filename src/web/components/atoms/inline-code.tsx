export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] bg-hover-2 px-[5px] py-px font-mono text-xs text-ink">
      {children}
    </code>
  );
}
