import type { LucideIcon } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { selectableVariants } from '@/components/ui/selectable';
import { cn } from '@/lib/utils';

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
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-2">
        {options.map((opt) => {
          const isActive = value === opt.id;
          const iconColor = isActive ? 'text-ink' : 'text-ink-2';
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
                type="button"
                onClick={handleClick}
                className={cn(
                  selectableVariants({ selected: isActive }),
                  'flex items-center justify-center overflow-hidden rounded-panel'
                )}
                style={{ width: size, height: size }}
              >
                {opt.type === 'letter' && opt.letter ? (
                  <span className={cn('text-xl font-medium', iconColor)}>{opt.letter}</span>
                ) : opt.type === 'image-picker' && opt.imageSrc ? (
                  <img
                    src={opt.imageSrc}
                    alt=""
                    className="size-full object-cover"
                    draggable={false}
                  />
                ) : (
                  opt.icon && <opt.icon size={20} className={iconColor} />
                )}
              </button>
              {opt.label && (
                <span className={cn('text-3xs', isActive ? 'text-ink-2' : 'text-ink-3')}>
                  {opt.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Field>
  );
}

export default IconSelector;
export type { IconSelectorOption };
