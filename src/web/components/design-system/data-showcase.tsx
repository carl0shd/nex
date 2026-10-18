import { useState } from "react";
import {
  SAMPLE_RANKED,
  SAMPLE_SPARKLINE,
  SAMPLE_STACKED_BARS,
} from "@/components/design-system/samples";
import ShowcaseSection from "@/components/design-system/showcase-section";
import Specimen from "@/components/design-system/specimen";
import SpecimenItem from "@/components/design-system/specimen-item";
import SpecimenRow from "@/components/design-system/specimen-row";
import MeterBar from "@/components/ui/meter-bar";
import RankedBarList from "@/components/ui/ranked-bar-list";
import Sparkline from "@/components/ui/sparkline";
import StackedBarChart from "@/components/ui/stacked-bar-chart";
import StatTile from "@/components/ui/stat-tile";
import { formatCompactUsd } from "@/lib/usage-format";

const METER_TONES = [
  { tone: "normal", percent: 42 },
  { tone: "warning", percent: 78 },
  { tone: "critical", percent: 96 },
  { tone: "cost", percent: 60 },
  { tone: "muted", percent: 30 },
] as const;

const STAT_SIZES = ["default", "compact"] as const;
const STAT_SURFACES = ["panel", "menu"] as const;

function MeterSpecimen(): React.JSX.Element {
  return (
    <Specimen name="MeterBar" source="ui/meter-bar.tsx">
      <SpecimenRow>
        {METER_TONES.map(({ tone, percent }) => (
          <SpecimenItem key={tone} label={`${tone} · ${percent}%`} className="w-32 items-stretch">
            <MeterBar tone={tone} percent={percent} />
          </SpecimenItem>
        ))}
      </SpecimenRow>
    </Specimen>
  );
}

function StatTileSpecimen(): React.JSX.Element {
  return (
    <Specimen name="StatTile" source="ui/stat-tile.tsx">
      {STAT_SURFACES.map((surface) => (
        <SpecimenRow key={surface} label={`surface=${surface}`}>
          {STAT_SIZES.map((size) => (
            <div key={size} className="flex gap-2">
              <StatTile
                surface={surface}
                size={size}
                variant="hero"
                label="Today"
                value="$12.40"
                sublabel={`${size} · hero`}
              />
              <StatTile
                surface={surface}
                size={size}
                label="Sessions"
                value="18"
                sublabel={`${size} · compact`}
              />
            </div>
          ))}
        </SpecimenRow>
      ))}
    </Specimen>
  );
}

function ChartsSpecimen(): React.JSX.Element {
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  return (
    <Specimen
      name="Sparkline · StackedBarChart · RankedBarList"
      source="ui/sparkline · stacked-bar-chart · ranked-bar-list"
    >
      <div className="grid grid-cols-2 gap-6">
        <SpecimenItem label="sparkline (hover)" className="items-stretch">
          <Sparkline
            points={SAMPLE_SPARKLINE}
            focusedKey={focusedKey}
            onFocusChange={setFocusedKey}
            ariaLabel="Daily cost"
          />
        </SpecimenItem>
        <SpecimenItem label="ranked-bar-list" className="items-stretch">
          <RankedBarList
            items={SAMPLE_RANKED}
            formatValue={formatCompactUsd}
            emptyLabel="No usage yet"
          />
        </SpecimenItem>
        <SpecimenItem label="stacked-bar-chart" className="items-stretch">
          <StackedBarChart
            data={SAMPLE_STACKED_BARS}
            formatValue={formatCompactUsd}
            highlightLabel="Claude"
            restLabel="Other"
            emptyLabel="No data"
          />
        </SpecimenItem>
        <SpecimenItem label="stacked-bar-chart · empty" className="items-stretch">
          <StackedBarChart
            data={[]}
            formatValue={formatCompactUsd}
            highlightLabel="Claude"
            restLabel="Other"
            emptyLabel="No usage in this period"
          />
        </SpecimenItem>
      </div>
    </Specimen>
  );
}

function DataShowcase(): React.JSX.Element {
  return (
    <>
      <ShowcaseSection title="Metrics" description="Usage numbers and limit meters.">
        <MeterSpecimen />
        <StatTileSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Charts" description="cost = chart-cost; categories = chart-1..5.">
        <ChartsSpecimen />
      </ShowcaseSection>
    </>
  );
}

export default DataShowcase;
