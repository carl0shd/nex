interface ShowcaseSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function ShowcaseSection({
  title,
  description,
  children,
}: ShowcaseSectionProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5 select-none">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="text-2xs text-ink-3">{description}</p>}
      </header>
      {children}
    </section>
  );
}

export default ShowcaseSection;
