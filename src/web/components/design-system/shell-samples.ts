const DIM = "\x1b[90m";
const RESET = "\x1b[0m";
const PROMPT_GREEN = "\x1b[92m";
const BRANCH = "\x1b[32m";
const BLUE = "\x1b[34m";
const LINK = "\x1b[34;4m";
const WARN = "\x1b[33m";

export const SHELL_PROMPT = `${PROMPT_GREEN}❯${RESET} `;

const header = `${DIM}~/nex/.worktrees/${RESET}fix-login-redirect ${BRANCH}feat/fix-login-redirect${RESET}`;

const lines = (...rows: string[]) => rows.join("\r\n");

export const DEV_OUTPUT = lines(
  header,
  `${SHELL_PROMPT}\x1b[97myarn dev${RESET}`,
  "",
  `  ${PROMPT_GREEN}VITE${RESET} v7.1.3  ${DIM}ready in${RESET} 412 ms`,
  "",
  `  ${PROMPT_GREEN}➜${RESET}  Local:   ${LINK}http://localhost:5173/${RESET}`,
  `  ${DIM}➜  Network: use --host to expose${RESET}`,
  "",
  `${DIM}12:41:07${RESET} ${BLUE}[vite]${RESET} hmr update ${DIM}/src/auth/session.ts${RESET}`,
  `${DIM}12:41:52${RESET} ${BLUE}[vite]${RESET} hmr update ${DIM}/src/routes/login.tsx${RESET}`,
  `${DIM}12:43:10${RESET} ${BLUE}[vite]${RESET} hmr update ${DIM}/src/routes/logout.tsx${RESET}`,
  `${DIM}12:43:11${RESET} ${WARN}[vite] warning${RESET} logout.tsx: unused import "redirect"`,
  `${DIM}12:44:02${RESET} ${BLUE}[vite]${RESET} page reload ${DIM}src/lib/url.ts${RESET}`,
  "",
);

export const TEST_OUTPUT = lines(
  header,
  `${SHELL_PROMPT}\x1b[97myarn test --watch src/auth${RESET}`,
  "",
  ` ${PROMPT_GREEN}✓${RESET} src/auth/url.test.ts ${DIM}(4)${RESET}`,
  ` ${PROMPT_GREEN}✓${RESET} src/auth/session.test.ts ${DIM}(6)${RESET}`,
  "",
  ` Test Files  ${PROMPT_GREEN}2 passed${RESET} ${DIM}(2)${RESET}`,
  `      Tests  ${PROMPT_GREEN}10 passed${RESET} ${DIM}(10)${RESET}`,
  "",
  `${DIM} Waiting for file changes…${RESET}`,
  "",
);

export const ZSH_OUTPUT = lines(header, SHELL_PROMPT);
