import { protocol, net } from 'electron';
import { getNexDir } from '@native/paths';

const SCHEME = 'nex-file';

export function registerScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { bypassCSP: true, supportFetchAPI: true } }
  ]);
}

export function registerHandler(): void {
  protocol.handle(SCHEME, (request) => {
    const filePath = decodeURIComponent(request.url.replace(`${SCHEME}://`, ''));
    if (!filePath.startsWith(getNexDir())) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(`file://${filePath}`);
  });
}
