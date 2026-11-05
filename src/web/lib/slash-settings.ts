import type { Effort } from "@/components/composer/effort";
import type { ModelOption } from "@/components/composer/model-menu";

const EFFORTS: readonly Effort[] = ["low", "medium", "high", "xhigh", "max"];

export function slashSettings(
  text: string,
  models: readonly ModelOption[],
): { model?: string; effort?: Effort } | null {
  const [command, value = ""] = text.trim().toLowerCase().split(/\s+/);
  if (command === "/effort" && EFFORTS.includes(value as Effort))
    return { effort: value as Effort };
  if (command === "/model") {
    const model = models.find(
      (option) => option.short.toLowerCase() === value || option.id === value,
    );
    if (model) return { model: model.id };
  }
  return null;
}
