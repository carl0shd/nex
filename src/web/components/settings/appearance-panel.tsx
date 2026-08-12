import SettingsSection from '@/components/settings/settings-section';
import ThemePicker from '@/components/settings/theme-picker';
import SettingField from '@/components/ui/setting-field';
import SettingRow from '@/components/ui/setting-row';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/stores/settings.store';
import { useSidebarStore } from '@/stores/sidebar.store';

function AppearancePanel(): React.JSX.Element {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const sidebarCollapsed = useSidebarStore((s) => s.collapsed.full);
  const toggleSidebar = useSidebarStore((s) => s.toggleFull);

  return (
    <SettingsSection>
      <SettingField label="Theme" description="Nex does not follow the system appearance.">
        <ThemePicker value={theme} onChange={setTheme} />
      </SettingField>

      <SettingRow
        title="Show sidebar"
        description="Workspaces, projects and active tasks."
        control={<Switch checked={!sidebarCollapsed} onCheckedChange={toggleSidebar} />}
      />
    </SettingsSection>
  );
}

export default AppearancePanel;
