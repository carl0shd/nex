import { useEffect } from 'react';
import { Columns2, Rows3 } from 'lucide-react';
import SettingsSection from '@/components/settings/settings-section';
import SettingField from '@/components/ui/setting-field';
import SettingRow from '@/components/ui/setting-row';
import SegmentedControl from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { useDiffViewStore, type DiffStyle } from '@/stores/diff-view.store';

const DIFF_STYLE_OPTIONS = [
  { value: 'split' as const, icon: Columns2, label: 'Split' },
  { value: 'unified' as const, icon: Rows3, label: 'Unified' }
];

function DiffPanel(): React.JSX.Element {
  const prefs = useDiffViewStore((s) => s.prefs);
  const loadPrefs = useDiffViewStore((s) => s.load);
  const setPref = useDiffViewStore((s) => s.setPref);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  return (
    <SettingsSection>
      <SettingField
        label="Default view"
        description="Side by side, or a single column with the changes inline."
      >
        <SegmentedControl<DiffStyle>
          value={prefs.diffStyle}
          options={DIFF_STYLE_OPTIONS}
          onChange={(style) => setPref('diffStyle', style)}
          className="w-fit"
        />
      </SettingField>

      <div className="flex flex-col gap-3">
        <SettingRow
          title="Show file tree"
          description="Keep the changed-files panel open."
          control={
            <Switch
              checked={prefs.treeVisible}
              onCheckedChange={(value) => setPref('treeVisible', value)}
            />
          }
        />
        <SettingRow
          title="Highlight word changes"
          description="Tint the changed tokens inside a modified line."
          control={
            <Switch
              checked={prefs.wordDiff}
              onCheckedChange={(value) => setPref('wordDiff', value)}
            />
          }
        />
        <SettingRow
          title="Ignore whitespace"
          description="Hide lines that only differ in indentation or spacing."
          control={
            <Switch
              checked={prefs.ignoreWhitespace}
              onCheckedChange={(value) => setPref('ignoreWhitespace', value)}
            />
          }
        />
      </div>
    </SettingsSection>
  );
}

export default DiffPanel;
