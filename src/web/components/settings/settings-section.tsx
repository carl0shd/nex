import type { ReactNode } from "react";

export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-settings-section={id} className="flex scroll-mt-6 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="m-0 text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        <p className="m-0 text-sm text-ink-3">{description}</p>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
