import { cva } from 'class-variance-authority';

const selectableVariants = cva(
  'interactive press cursor-pointer select-none rounded-card disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      selected: {
        true: 'bg-primary-tint shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ring)_55%,transparent)]',
        false:
          'bg-field shadow-hairline hover:bg-hover-2 hover:shadow-[0_0_0_1px_var(--line-strong)]'
      }
    },
    defaultVariants: { selected: false }
  }
);

export { selectableVariants };
