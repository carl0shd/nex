export const TASK_NOTES = `## Login redirect

Support says people **land on the home page** after signing in from a shared link. Repro: open a task link while signed out, sign in, the \`?next=\` param is gone.

### Before merging

- [x] Keep \`next\` through the OAuth round-trip
- [x] Reject absolute and \`//\` urls
- [ ] Same fix in logout
- [ ] Ask Ana to try it on staging

### Links

- NEX-123 · Redirect drops next param
- \`src/auth/session.ts\`

Staging deploy is Thursday
`;
