import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import SimpleBar from "simplebar-react";
import { Checkbox } from "@/components/ui/checkbox";
import Chip from "@/components/ui/chip";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { GithubRepo } from "@native/git/github";
import { Spinner } from "@/components/ui/spinner";

interface RepoStatus {
  label: string;
  tone: "muted" | "success" | "error";
}

interface RepoMultiSelectProps {
  repos: GithubRepo[] | null;
  selected: Set<string>;
  onToggle: (nameWithOwner: string) => void;
  statuses?: Record<string, RepoStatus>;
  disabled?: boolean;
  label?: string;
}

const STATUS_TONE: Record<RepoStatus["tone"], string> = {
  muted: "text-ink-3",
  success: "text-green",
  error: "text-red",
};

function RepoMultiSelect({
  repos,
  selected,
  onToggle,
  statuses,
  disabled = false,
  label = "// repositories",
}: RepoMultiSelectProps): React.JSX.Element {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!repos) return [];
    const q = query.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter(
      (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
    );
  }, [repos, query]);

  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        {selected.size > 0 && <span className="text-3xs text-ink-3">{selected.size} selected</span>}
      </div>

      <div className="flex flex-col overflow-hidden rounded-card bg-field shadow-hairline">
        <InputGroup className="rounded-none border-0 border-b border-line-soft bg-transparent focus-within:ring-0">
          <InputGroupAddon>
            <Search size={13} />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search repositories..."
            disabled={disabled || repos === null}
          />
        </InputGroup>

        <SimpleBar autoHide={false} style={{ maxHeight: 180 }}>
          {repos === null ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Spinner />
              <span className="text-2xs text-ink-3">loading repositories...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-2xs text-ink-3">
                {repos.length === 0 ? "no repositories found" : "no repositories match"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col py-1">
              {filtered.map((repo) => {
                const status = statuses?.[repo.nameWithOwner];
                return (
                  <button
                    key={repo.nameWithOwner}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(repo.nameWithOwner)}
                    className={cn(
                      "interactive flex h-8 cursor-pointer items-center gap-2.5 px-2.5 text-left select-none",
                      "hover:bg-hover-2 disabled:pointer-events-none",
                      disabled && "opacity-70",
                    )}
                  >
                    <Checkbox
                      checked={selected.has(repo.nameWithOwner)}
                      disabled={disabled}
                      className="pointer-events-none"
                      tabIndex={-1}
                    />
                    <span className="truncate text-sm text-ink">{repo.name}</span>
                    {repo.isPrivate && <Chip className="px-1.5 text-3xs">private</Chip>}
                    {repo.description && !status && (
                      <span className="min-w-0 flex-1 truncate text-3xs text-ink-3">
                        {repo.description}
                      </span>
                    )}
                    {status && (
                      <span className={cn("ml-auto shrink-0 text-3xs", STATUS_TONE[status.tone])}>
                        {status.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </SimpleBar>
      </div>
    </Field>
  );
}

export default RepoMultiSelect;
export type { RepoStatus };
