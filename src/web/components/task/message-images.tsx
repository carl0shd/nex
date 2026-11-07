export function MessageImages({
  images,
  names = [],
  onOpen,
}: {
  images: readonly string[];
  names?: readonly (string | undefined)[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 self-end">
      {images.map((src, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Open ${names[index] ?? `image ${index + 1}`}`}
          title={names[index]}
          onClick={() => onOpen(index)}
          className="interactive press-large h-[60px] w-[86px] cursor-pointer overflow-hidden rounded-control bg-inset shadow-[0_0_0_1px_var(--line-strong)] select-none hover:shadow-[0_0_0_1px_var(--ink-5)]"
        >
          <img src={src} alt="" className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}
