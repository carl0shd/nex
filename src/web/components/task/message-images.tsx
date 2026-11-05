export function MessageImages({
  images,
  onOpen,
}: {
  images: readonly string[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 self-end">
      {images.map((src, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Open image ${index + 1}`}
          onClick={() => onOpen(index)}
          className="interactive press-large h-[60px] w-[86px] cursor-pointer overflow-hidden rounded-control bg-inset shadow-[0_0_0_1px_var(--line-strong)] select-none hover:shadow-[0_0_0_1px_var(--ink-5)]"
        >
          <img src={src} alt="" className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}
