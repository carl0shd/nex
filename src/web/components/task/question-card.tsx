import { useHotkeys, type Hotkey } from "@tanstack/react-hotkeys";
import { CircleQuestionMark } from "lucide-react";
import { Checkbox } from "@/components/atoms/checkbox";
import { SelectionMark } from "@/components/atoms/selection-mark";
import GlideMenu from "@/components/primitives/glide-menu";
import { cn } from "@/lib/utils";

export type QuestionOption = { value: string; label: string; hint?: string };

export interface Question {
  question: string;
  options: QuestionOption[];
  multiple?: boolean;
}

export function QuestionCard({
  questions,
  answers,
  onChange,
  onAnswer,
  onOther,
  answering = false,
}: {
  questions: Question[];
  answers: string[][];
  onChange: (index: number, values: string[]) => void;
  onAnswer?: () => void;
  onOther?: () => void;
  answering?: boolean;
}) {
  const pick = (index: number, value: string) => {
    const current = answers[index] ?? [];
    if (!questions[index].multiple) onChange(index, [value]);
    else if (current.includes(value))
      onChange(
        index,
        current.filter((item) => item !== value),
      );
    else onChange(index, [...current, value]);
  };
  const active = Math.max(
    0,
    questions.findIndex((_, index) => !answers[index]?.length),
  );
  const complete = questions.every((_, index) => answers[index]?.length);
  const longest = Math.max(...questions.map((question) => question.options.length));
  useHotkeys(
    questions[active].options.map((option, index) => ({
      hotkey: String(index + 1) as Hotkey,
      callback: () => pick(active, option.value),
    })),
  );

  return (
    <div className="flex flex-col gap-3.5 rounded-menu bg-surface-raised px-3.5 py-3 shadow-[0_0_0_1px_var(--ring-waiting)]">
      {questions.map((question, index) => (
        <div key={question.question} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-[9px]">
            <span className="flex w-3.5 shrink-0 justify-center text-orange">
              <CircleQuestionMark width={13} height={13} strokeWidth={2} />
            </span>
            <span className="text-sm font-medium text-ink">{question.question}</span>
          </div>
          <GlideMenu
            role={question.multiple ? "group" : "radiogroup"}
            className="flex flex-col gap-0.5"
          >
            {question.options.map((option) => {
              const selected = answers[index]?.includes(option.value) ?? false;
              return (
                <button
                  key={option.value}
                  type="button"
                  role={question.multiple ? "checkbox" : "radio"}
                  aria-checked={selected}
                  data-menu-row
                  onClick={() => pick(index, option.value)}
                  className={cn(
                    "interactive press-large relative flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-1.5 text-left select-none",
                    selected && "bg-field",
                  )}
                >
                  {question.multiple ? (
                    <Checkbox checked={selected} display />
                  ) : (
                    <SelectionMark selected={selected} />
                  )}
                  <span className="flex flex-col">
                    <span className="text-xs text-ink">{option.label}</span>
                    {option.hint && <span className="text-2xs text-ink-4">{option.hint}</span>}
                  </span>
                </button>
              );
            })}
          </GlideMenu>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!complete || answering}
          onClick={onAnswer}
          className="interactive press h-7 cursor-pointer rounded-full bg-accent px-3 text-xs font-medium text-on-accent select-none hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
        >
          Answer
        </button>
        <button
          type="button"
          disabled={answering}
          onClick={onOther}
          className="interactive press h-7 cursor-pointer rounded-full px-3 text-xs font-medium text-ink-3 select-none hover:text-ink-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Other…
        </button>
        <span className="ml-auto text-2xs text-ink-4">1–{longest} to pick</span>
      </div>
    </div>
  );
}
