import { Bell, LayoutGrid, Search, Settings } from 'lucide-react';
import ShowcaseSection from '@/components/design-system/showcase-section';
import Specimen from '@/components/design-system/specimen';
import SpecimenItem from '@/components/design-system/specimen-item';
import SpecimenRow from '@/components/design-system/specimen-row';
import TokenRow from '@/components/design-system/token-row';
import TokenSwatch from '@/components/design-system/token-swatch';
import TokenTile from '@/components/design-system/token-tile';
import {
  COLOR_GROUPS,
  EASINGS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  RADII,
  SHADOWS,
  TEXT_COLORS,
  TYPE_SCALE
} from '@/components/design-system/tokens';
import { Button } from '@/components/ui/button';
import GlideHighlight from '@/components/ui/glide-highlight';
import IconButton from '@/components/ui/icon-button';
import { Kbd } from '@/components/ui/kbd';
import { Shimmer } from '@/components/ui/shimmer';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';

const SAMPLE_TEXT = 'Worktree sessions, side by side';
const GLIDE_ROWS = ['feat/design-system', 'fix/terminal-resize', 'chore/bump-electron'];

function ColorTokens(): React.JSX.Element {
  const theme = useSettingsStore((s) => s.resolvedTheme);
  const styles = getComputedStyle(document.documentElement);

  return (
    <ShowcaseSection
      title="Color"
      description={`Resolved for the ${theme} theme. Utility = bg-/text-/border-/ring- + token name.`}
    >
      {COLOR_GROUPS.map((group) => (
        <Specimen key={group.title} name={group.title} source="styles/globals.css">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
            {group.tokens.map((t) => (
              <TokenSwatch
                key={t.variable}
                name={t.name}
                variable={t.variable}
                value={styles.getPropertyValue(t.variable).trim()}
              />
            ))}
          </div>
        </Specimen>
      ))}
    </ShowcaseSection>
  );
}

function GlassAndMotion(): React.JSX.Element {
  return (
    <ShowcaseSection
      title="Glass & motion"
      description="Glass is for floating chrome over the aurora. Menus and dialogs stay solid."
    >
      <Specimen name="Glass on aurora" source="glass · glass-panel · aurora">
        <div className="relative isolate h-64 overflow-hidden rounded-panel bg-page">
          <div aria-hidden className="aurora" style={{ position: 'absolute', opacity: 1 }} />
          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="glass flex w-fit items-center gap-1 rounded-full p-1">
              <Button variant="ghost" size="sm" className="bg-surface text-ink shadow-glass">
                Sessions
              </Button>
              <Button variant="ghost" size="sm">
                Diff
              </Button>
              <Button variant="ghost" size="sm">
                Notes
              </Button>
              <span className="mx-1 h-4 w-px bg-line" />
              <IconButton icon={Bell} size={14} />
              <IconButton icon={LayoutGrid} size={14} />
              <IconButton icon={Settings} size={14} />
            </div>
            <div className="flex items-end gap-4">
              <div className="glass-panel flex w-64 flex-col gap-1 rounded-panel p-4">
                <span className="eyebrow">glass-panel</span>
                <span className="text-sm font-medium text-ink">Frosted, mostly opaque</span>
                <span className="text-xs text-ink-3">For large surfaces with dense content.</span>
              </div>
              <div className="glass flex h-9 flex-1 items-center gap-2 rounded-full pr-1.5 pl-3.5">
                <Search size={13} className="text-ink-3" />
                <span className="flex-1 text-sm text-ink-4">Ask the agent…</span>
                <Kbd>⌘K</Kbd>
              </div>
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen name="Motion" source="interactive · press · glide · shimmer">
        <SpecimenRow label="press">
          <SpecimenItem label="active:scale(0.97)">
            <Button>Press me</Button>
          </SpecimenItem>
          <SpecimenItem label="secondary">
            <Button variant="secondary">Press me</Button>
          </SpecimenItem>
        </SpecimenRow>
        <SpecimenRow label="glide">
          <GlideHighlight className="flex w-64 flex-col gap-px rounded-card bg-surface-raised p-1 shadow-overlay">
            {GLIDE_ROWS.map((row) => (
              <button
                key={row}
                type="button"
                data-glide-row
                className="relative flex h-8 cursor-pointer items-center rounded-[7px] px-2 text-left text-sm text-ink-2 outline-none hover:text-ink"
              >
                {row}
              </button>
            ))}
          </GlideHighlight>
        </SpecimenRow>
        <SpecimenRow label="shimmer">
          <Shimmer className="text-sm font-medium">Working on the diff…</Shimmer>
        </SpecimenRow>
        <SpecimenRow label="easing">
          <div className="flex flex-col gap-1">
            {EASINGS.map((e) => (
              <TokenRow key={e.name} name={e.name} aside={e.usage}>
                <span className="text-xs text-ink-2">150–220ms for UI, 280ms for layout</span>
              </TokenRow>
            ))}
          </div>
        </SpecimenRow>
      </Specimen>
    </ShowcaseSection>
  );
}

function Typography(): React.JSX.Element {
  return (
    <ShowcaseSection
      title="Typography"
      description="Inter with tight tracking (-0.01em, cv11, ss01). Numbers use tabular figures."
    >
      <Specimen name="Size scale" source="@theme --text-*" className="gap-3">
        {TYPE_SCALE.map((t) => (
          <TokenRow key={t.name} name={t.name} aside={t.usage}>
            <span className={cn('text-ink', t.className)}>{SAMPLE_TEXT}</span>
          </TokenRow>
        ))}
      </Specimen>

      <div className="grid grid-cols-2 gap-3">
        <Specimen name="Weights" source="Inter Variable" className="gap-2">
          {FONT_WEIGHTS.map((w) => (
            <TokenRow key={w.name} name={w.name}>
              <span className={cn('text-sm text-ink', w.className)}>{SAMPLE_TEXT}</span>
            </TokenRow>
          ))}
        </Specimen>

        <Specimen name="Families" source="main.tsx · @fontsource-variable" className="gap-2">
          {FONT_FAMILIES.map((f) => (
            <TokenRow key={f.name} name={f.usage}>
              <span className={cn('text-base text-ink', f.className)}>{f.name}</span>
            </TokenRow>
          ))}
        </Specimen>
      </div>

      <Specimen name="Text colors" source="text-ink · ink-2 · ink-3 · ink-4">
        <div className="flex flex-col gap-2">
          {TEXT_COLORS.map((t) => (
            <TokenRow key={t.name} name={t.name}>
              <span className={cn('text-sm', t.className)}>{t.usage}</span>
            </TokenRow>
          ))}
        </div>
      </Specimen>
    </ShowcaseSection>
  );
}

function Shape(): React.JSX.Element {
  return (
    <ShowcaseSection
      title="Shape & elevation"
      description="Outlines are rings, not borders: elevation graduates by how far a surface floats."
    >
      <Specimen name="Radius" source="--radius-*">
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <TokenTile key={r.name} name={r.name} usage={r.usage}>
              <span className={cn('h-14 w-full bg-muted shadow-hairline', r.className)} />
            </TokenTile>
          ))}
        </div>
      </Specimen>

      <Specimen name="Elevation" source="--shadow-*">
        <div className="flex flex-wrap gap-6 p-2">
          {SHADOWS.map((s) => (
            <TokenTile key={s.name} name={s.name} usage={s.usage}>
              <span className={cn('h-16 w-full rounded-card bg-surface-raised', s.className)} />
            </TokenTile>
          ))}
        </div>
      </Specimen>
    </ShowcaseSection>
  );
}

function FoundationsShowcase(): React.JSX.Element {
  return (
    <>
      <GlassAndMotion />
      <ColorTokens />
      <Typography />
      <Shape />
    </>
  );
}

export default FoundationsShowcase;
