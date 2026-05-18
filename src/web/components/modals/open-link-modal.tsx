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
        <h2 className="text-lg font-semibold text-text">Open external link?</h2>
        <p className="text-[13px] leading-[1.4] text-text-secondary">
          You&apos;re about to open this URL in your default browser.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-md border border-border-soft bg-bg-mute p-3">
        <span className="text-[11px] font-semibold text-text">{host}</span>
        <SimpleBar autoHide={false} style={{ maxHeight: 120 }}>
          <code className="mr-3 block font-mono text-[10px] break-all text-text-muted">{url}</code>
        </SimpleBar>
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={dismiss}>
          cancel
        </ModalButton>
        <ModalButton variant="primary" onClick={handleConfirm}>
          open in browser
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default OpenLinkModal;
