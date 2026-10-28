import { NavArrowLeft, Computer, HalfMoon, SunLight } from "iconoir-react";
import { useNavigate } from "react-router";
import { IconButton } from "@/components/atoms/icon-button";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import {
  Actions,
  Identity,
  Inputs,
  Navigation,
  Overlays,
  Settings,
  Status,
} from "@/components/design-system/components";
import { Colors, ShapeAndElevation, Typography } from "@/components/design-system/foundations";
import { Shell, TaskCards } from "@/components/design-system/composites";
import { AgentBlocks, ConversationFlow, Markdown } from "@/components/design-system/agent-blocks";
import { ComposerMenus } from "@/components/design-system/composer-menus";
import { RichInput } from "@/components/design-system/rich-input";
import { Changes } from "@/components/design-system/changes";
import { Notes } from "@/components/design-system/notes";
import { Shell as ShellSection } from "@/components/design-system/shell";
import { Browser } from "@/components/design-system/browser";
import { TaskView } from "@/components/design-system/task-view";
import { Home } from "@/components/design-system/home";
import { NewTask } from "@/components/design-system/new-task";
import { Usage } from "@/components/design-system/usage";
import { Command } from "@/components/design-system/command";
import { Toasts } from "@/components/design-system/toasts";
import { SettingsPageSection } from "@/components/design-system/settings";
import { Onboarding } from "@/components/design-system/onboarding";
import { AddWorkspace } from "@/components/design-system/add-workspace";
import { Environments } from "@/components/design-system/environments";
import type { ThemePreference } from "@/lib/theme";
import { useSettingsStore } from "@/stores/settings.store";

const THEMES = ["system", "dark", "light"] as const satisfies readonly ThemePreference[];
const THEME_LABELS = { system: "System", dark: "Dark", light: "Light" };
const THEME_ICONS = { system: Computer, dark: HalfMoon, light: SunLight };

function DesignSystem(): React.JSX.Element {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-page">
      <main className="mx-auto flex max-w-[1280px] flex-col gap-14 px-10 pt-6 pb-20">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IconButton aria-label="Back" onClick={() => navigate("/")}>
              <NavArrowLeft width={16} height={16} strokeWidth={2} />
            </IconButton>
            <div className="flex flex-col">
              <h1 className="m-0 text-md font-semibold tracking-[-0.015em] text-ink">
                Design system
              </h1>
              <span className="text-xs text-ink-3">
                Tokens and components from the Nex 2 wireframes
              </span>
            </div>
          </div>
          <SegmentedControl
            options={THEMES}
            value={theme}
            onChange={setTheme}
            labels={THEME_LABELS}
            icons={THEME_ICONS}
          />
        </header>
        <Colors />
        <Typography />
        <ShapeAndElevation />
        <Actions />
        <Navigation />
        <Inputs />
        <Status />
        <Identity />
        <Overlays />
        <Settings />
        <Shell />
        <TaskCards />
        <AgentBlocks />
        <ConversationFlow />
        <Markdown />
        <ComposerMenus />
        <RichInput />
        <Changes />
        <Notes />
        <ShellSection />
        <Browser />
        <TaskView />
        <Home />
        <NewTask />
        <Usage />
        <Command />
        <Toasts />
        <SettingsPageSection />
        <Onboarding />
        <AddWorkspace />
        <Environments />
      </main>
    </div>
  );
}

export default DesignSystem;
