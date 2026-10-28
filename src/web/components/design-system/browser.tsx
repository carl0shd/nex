import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { BrowserMenuProps } from "@/components/browser/browser-menu";
import { BrowserPanel } from "@/components/browser/browser-panel";
import {
  AnnotateToolbar,
  ClaudeCursor,
  ElementHighlight,
  type AnnotateTool,
  type ElementBox,
  type ViewportDevice,
} from "@/components/browser/browser-viewport";
import { ElementCard } from "@/components/composer/attachments";
import { SampleSite } from "@/components/design-system/sample-site";
import { Section, Specimen } from "@/components/design-system/specimen";

const TABS = [{ id: "login", title: "Sign in · hub" }];
const URL = "https://monoku-fix-login.nex/login?next=/billing";

type PickedElement = { box: ElementBox; selector: string; name: string };

function useMenuState(): BrowserMenuProps {
  const [claudeCanUse, setClaudeCanUse] = useState(true);
  const [openTaskLinks, setOpenTaskLinks] = useState(true);
  return {
    externalBrowser: "Arc",
    viewport: "iPhone 16",
    claudeCanUse,
    openTaskLinks,
    keepCookies: "Until the task closes",
    onClaudeCanUseChange: setClaudeCanUse,
    onOpenTaskLinksChange: setOpenTaskLinks,
  };
}

function elementAt(frame: HTMLElement, target: EventTarget): PickedElement | null {
  if (!(target instanceof Element)) return null;
  const element = target.closest<HTMLElement>("[data-pick]");
  if (!element) return null;
  const frameRect = frame.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    box: {
      x: rect.left - frameRect.left - 2,
      y: rect.top - frameRect.top - 2,
      width: rect.width + 4,
      height: rect.height + 4,
    },
    selector: element.dataset.pick ?? "",
    name: element.textContent?.trim() || element.dataset.pick || "",
  };
}

function PickerDemo() {
  const menu = useMenuState();
  const [device, setDevice] = useState<ViewportDevice>("desktop");
  const [picking, setPicking] = useState(true);
  const [tool, setTool] = useState<AnnotateTool>("pick");
  const [hovered, setHovered] = useState<PickedElement | null>(null);
  const [picked, setPicked] = useState<PickedElement | null>(null);
  const [added, setAdded] = useState<PickedElement[]>([]);
  const frameRef = useRef<HTMLDivElement>(null);
  const shown = picked ?? hovered;

  const track = (event: MouseEvent) => {
    if (!picking || picked || !frameRef.current) return;
    setHovered(elementAt(frameRef.current, event.target));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-[640px] w-[784px] flex-col overflow-hidden rounded-card bg-surface shadow-card">
        <BrowserPanel
          tabs={TABS}
          activeTab="login"
          url={URL}
          device={device}
          onDeviceChange={setDevice}
          picking={picking}
          onPickingChange={(next) => {
            setPicking(next);
            setPicked(null);
            setHovered(null);
          }}
          menu={menu}
          overlay={
            picking && (
              <>
                {shown && <ElementHighlight box={shown.box} selector={shown.selector} />}
                <AnnotateToolbar
                  tool={tool}
                  onToolChange={setTool}
                  onAddToChat={() => {
                    if (shown) setAdded((list) => [...list, shown]);
                    setPicked(null);
                  }}
                  onStop={() => setPicking(false)}
                />
              </>
            )
          }
        >
          <div
            ref={frameRef}
            onMouseMove={track}
            onMouseLeave={() => setHovered(null)}
            onClick={(event) => {
              if (!picking || !frameRef.current) return;
              setPicked(elementAt(frameRef.current, event.target));
            }}
            className={picking ? "h-full cursor-crosshair" : "h-full"}
          >
            <SampleSite />
          </div>
        </BrowserPanel>
      </div>
      {added.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {added.map((element, index) => (
            <ElementCard
              key={`${element.selector}-${index}`}
              name={element.name}
              selector={element.selector}
              page="/login"
              onRemove={() => setAdded((list) => list.filter((_, item) => item !== index))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClaudeDrivingDemo() {
  const menu = useMenuState();
  const [device, setDevice] = useState<ViewportDevice>("desktop");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const target = frame?.querySelector<HTMLElement>('[data-pick="button.continue"]');
    if (!frame || !target) return;
    const frameRect = frame.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    setCursor({
      x: rect.left - frameRect.left + rect.width / 2,
      y: rect.top - frameRect.top + rect.height / 2,
    });
  }, [device]);

  return (
    <div className="flex h-[640px] w-[784px] flex-col overflow-hidden rounded-card bg-surface shadow-card">
      <BrowserPanel
        tabs={TABS}
        activeTab="login"
        url={URL}
        device={device}
        onDeviceChange={setDevice}
        picking={false}
        onPickingChange={() => {}}
        claudeStatus="checking where sign-in lands"
        menu={menu}
        overlay={cursor && <ClaudeCursor x={cursor.x} y={cursor.y} action="Click · Continue" />}
      >
        <div ref={frameRef} className="h-full">
          <SampleSite email="you@monoku.com" />
        </div>
      </BrowserPanel>
    </div>
  );
}

function PhoneDemo() {
  const menu = useMenuState();
  const [device, setDevice] = useState<ViewportDevice>("phone");
  return (
    <div className="flex h-[640px] w-[784px] flex-col overflow-hidden rounded-card bg-surface shadow-card">
      <BrowserPanel
        tabs={TABS}
        activeTab="login"
        url={URL}
        device={device}
        onDeviceChange={setDevice}
        picking={false}
        onPickingChange={() => {}}
        menu={menu}
      >
        <SampleSite />
      </BrowserPanel>
    </div>
  );
}

export function Browser() {
  return (
    <Section
      id="browser"
      title="Browser"
      description="The task's built-in browser: pick an element to add it to the chat, watch Claude test, switch to a phone viewport."
    >
      <Specimen name="Picking an element · hover, click, Add to chat" bare>
        <PickerDemo />
      </Specimen>
      <Specimen name="Claude is using the browser" bare>
        <ClaudeDrivingDemo />
      </Specimen>
      <Specimen name="Phone viewport · open ⋯ for the browser menu" bare>
        <PhoneDemo />
      </Specimen>
    </Section>
  );
}
