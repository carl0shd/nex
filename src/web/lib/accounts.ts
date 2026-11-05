import type { AgentAccount } from "@native/db/types";

export const accountLabel = (account: AgentAccount) =>
  account.email ? account.name : (account.name.split("@")[0] ?? account.name);
