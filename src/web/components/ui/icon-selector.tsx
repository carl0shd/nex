import type { LucideIcon } from 'lucide-react';

interface IconSelectorOption {
  id: string;
  type: 'letter' | 'icon' | 'image-picker';
  letter?: string;
  icon?: LucideIcon;
  imageSrc?: string;
  label?: string;
}

interface IconSelectorProps {
  options: IconSelectorOption[];
  value: string;
  onChange: (id: string) => void;
  onPickImage?: () => void;
  label?: string;
  size?: number;
}

function IconSelector({
  options,
  value,
  onChange,
  onPickImage,
  label,
  size = 56
}: IconSelectorProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <div className="flex gap-2">
        {options.map((opt) => {
          const isActive = value === opt.id;
          const handleClick = (): void => {
            if (opt.type === 'image-picker' && onPickImage) {
              onPickImage();
              return;
            }
            onChange(opt.id);
          };
          return (
            <div key={opt.id} className="flex flex-col items-center gap-1">
              <button
                onClick={handleClick}
                className={`flex cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-bg-input ${isActive ? 'border-[1.5px] border-accent' : 'border border-border'}`}
                style={{ width: size, height: size }}
              >
                {opt.type === 'letter' && opt.letter ? (
                  <span
                    className={`text-xl font-medium ${isActive ? 'text-text' : 'text-text-secondary'}`}
                  >
                    {opt.letter}
                  </span>
                ) : opt.type === 'image-picker' ? (
                  opt.imageSrc ? (
                    <img
                      src={opt.imageSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    opt.icon && (
                      <opt.icon
                        size={20}
                        className={isActive ? 'text-text' : 'text-text-secondary'}
                      />
                    )
                  )
                ) : (
                  opt.icon && (
                    <opt.icon
                      size={20}
                      className={isActive ? 'text-text' : 'text-text-secondary'}
                    />
                  )
                )}
              </button>
              {opt.label && (
                <span
                  className={`text-[10px] ${isActive ? 'text-text-secondary' : 'text-text-muted'}`}
                >
                  {opt.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IconSelector;
export type { IconSelectorOption };
