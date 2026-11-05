import { useEffect, useRef, useState } from "react";
import {
  AddAccountDialog,
  type AddAccountStage,
  type SignedInAccount,
} from "@/components/onboarding/add-account-dialog";
import { Overlay } from "@/components/primitives/overlay";
import { notifyCompact } from "@/lib/notify";

const ACCOUNT_COLOR = "#3f6fb5";

export interface ReauthTarget {
  id: string;
  name: string;
}

export function AppAddAccount({
  reauth,
  onClose,
  onAdded,
}: {
  reauth?: ReauthTarget;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [stage, setStage] = useState<AddAccountStage>({ stage: reauth ? "waiting" : "intro" });
  const [url, setUrl] = useState<string | null>(null);
  const profileRef = useRef<string | null>(null);
  const waitingRef = useRef(false);

  useEffect(() => window.api.onSignInUrl(setUrl), []);
  useEffect(
    () => () => {
      if (waitingRef.current) void window.api.cancelSignIn();
      if (profileRef.current) void window.api.discardSignIn(profileRef.current);
    },
    [],
  );

  const signInAgain = async (target: ReauthTarget) => {
    waitingRef.current = true;
    const result = await window.api.reauthAccount(target.id);
    waitingRef.current = false;
    if (result.status === "cancelled") return;
    if (result.status === "failed") {
      setUrl(result.url);
      return setStage({ stage: "failed" });
    }
    await window.api.usage.refresh().catch(() => {});
    onAdded();
    onClose();
    notifyCompact(
      result.sameAccount
        ? { tone: "green", title: `Signed in to ${target.name} again` }
        : { tone: "orange", title: `${target.name} now signs in as ${result.email}` },
    );
  };

  const startedRef = useRef(false);
  useEffect(() => {
    if (!reauth || startedRef.current) return;
    startedRef.current = true;
    void signInAgain(reauth);
  });

  const signIn = async () => {
    if (reauth) {
      setUrl(null);
      setStage({ stage: "waiting" });
      return signInAgain(reauth);
    }
    setUrl(null);
    setStage({ stage: "waiting" });
    waitingRef.current = true;
    const result = await window.api.signInAccount();
    waitingRef.current = false;
    if (result.status === "cancelled") return;
    if (result.status === "failed") {
      setUrl(result.url);
      return setStage({ stage: "failed" });
    }
    const account: SignedInAccount = {
      name: result.status === "exists" ? result.name : (result.email.split("@")[0] ?? result.email),
      email: result.email,
      color: ACCOUNT_COLOR,
    };
    if (result.status === "exists") return setStage({ stage: "exists", account });
    profileRef.current = result.configDir;
    setStage({ stage: "signed-in", account });
  };

  const add = async (account: SignedInAccount & { isDefault: boolean }) => {
    const configDir = profileRef.current;
    if (!configDir) return;
    try {
      await window.api.finishSignIn({ configDir, ...account, name: account.name.trim() });
      profileRef.current = null;
      onAdded();
      onClose();
    } catch {
      notifyCompact({ tone: "red", title: "Couldn’t add the account" });
    }
  };

  const copyLink = url
    ? () => {
        void navigator.clipboard.writeText(url);
        notifyCompact({ tone: "green", title: "Link copied" });
      }
    : undefined;

  return (
    <Overlay fullWindow onClose={onClose}>
      <AddAccountDialog
        state={stage}
        onContinue={() => void signIn()}
        onOpenAgain={url ? () => void window.api.openExternalUrl(url) : undefined}
        onCopyLink={copyLink}
        onRetry={() => void signIn()}
        onAdd={(account) => void add(account)}
        onClose={onClose}
      />
    </Overlay>
  );
}
