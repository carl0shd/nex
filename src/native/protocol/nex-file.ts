import { protocol, net } from 'electron';
import { join } from 'path';

const SCHEME = 'nex-file';
const NEX_DIR = join(process.env.HOME!, '.nex');

export function registerScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { bypassCSP: true, supportFetchAPI: true } }
  ]);
}

export function registerHandler(): void {
  protocol.handle(SCHEME, (request) => {
    const filePath = decodeURIComponent(request.url.replace(`${SCHEME}://`, ''));
    if (!filePath.startsWith(NEX_DIR)) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(`file://${filePath}`);
  });
}
