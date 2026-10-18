import SimpleBar from 'simplebar-react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import { useLinkStore } from '@/stores/link.store';

function getHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function OpenLinkModal(): React.JSX.Element {
  const pendingUrl = useLinkStore((s) => s.pendingUrl);
  const dismiss = useLinkStore((s) => s.dismiss);

  const open = !!pendingUrl;
  const url = pendingUrl ?? '';
  const host = getHost(url);

  const handleConfirm = (): void => {
    if (pendingUrl) void window.api.openExternalUrl(pendingUrl);
    dismiss();
  };

  return (
    <Modal open={open} onClose={dismiss} width={440}>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink">Open external link?</h2>
        <p className="text-sm leading-[1.4] text-ink-2">
          You&apos;re about to open this URL in your default browser.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-md border border-line-soft bg-muted p-3">
        <span className="text-2xs font-semibold text-ink">{host}</span>
        <SimpleBar autoHide={false} style={{ maxHeight: 120 }}>
          <code className="mr-3 block font-mono text-3xs break-all text-ink-3">{url}</code>
        </SimpleBar>
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="outline" onClick={dismiss}>
          cancel
        </ModalButton>
        <ModalButton variant="default" onClick={handleConfirm}>
          open in browser
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default OpenLinkModal;
