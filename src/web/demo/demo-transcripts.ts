const now = Date.now();
const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

let counter = 0;
const uuid = () => `demo-${++counter}`;

const user = (content: unknown, minutesAgo: number, extra: object = {}) => ({
  type: "user",
  uuid: uuid(),
  timestamp: at(minutesAgo),
  message: { role: "user", content },
  ...extra,
});

const assistant = (content: unknown[], minutesAgo: number) => ({
  type: "assistant",
  uuid: uuid(),
  timestamp: at(minutesAgo),
  message: { role: "assistant", content },
});

const say = (text: string, minutesAgo: number) => assistant([{ type: "text", text }], minutesAgo);

const tool = (id: string, name: string, input: object, minutesAgo: number) =>
  assistant([{ type: "tool_use", id, name, input }], minutesAgo);

const result = (id: string, content: string, data: object, minutesAgo: number) =>
  user([{ type: "tool_result", tool_use_id: id, content, is_error: false }], minutesAgo, {
    toolUseResult: data,
  });

const todos = (items: [string, "completed" | "in_progress" | "pending"][]) => ({
  todos: items.map(([content, status]) => ({ content, status, activeForm: content })),
});

export const APPLE_PAY = [
  user(
    "Add Apple Pay to the checkout. Use the Stripe Payment Request Button and keep the card form as the fallback.",
    14,
  ),
  say(
    "I'll add an Apple Pay button above the card form, backed by Stripe's Payment Request API, and only show it when the browser supports it.",
    14,
  ),
  tool(
    "ap-plan",
    "TodoWrite",
    todos([
      ["Add the payment request endpoint", "completed"],
      ["Render the Apple Pay button in checkout", "completed"],
      ["Confirm the payment and reuse the order flow", "in_progress"],
      ["Cover it with tests", "pending"],
    ]),
    13,
  ),
  tool(
    "ap-read",
    "Read",
    { file_path: "/demo/worktrees/apple-pay/src/checkout/payment-form.tsx" },
    12,
  ),
  result(
    "ap-read",
    "ok",
    { type: "text", file: { filePath: "src/checkout/payment-form.tsx", numLines: 184 } },
    12,
  ),
  tool(
    "ap-edit",
    "Edit",
    {
      file_path: "/demo/worktrees/apple-pay/src/checkout/payment-form.tsx",
      old_string: "",
      new_string: "",
    },
    9,
  ),
  result(
    "ap-edit",
    "The file has been updated.",
    {
      filePath: "/demo/worktrees/apple-pay/src/checkout/payment-form.tsx",
      structuredPatch: [
        {
          oldStart: 41,
          newStart: 41,
          lines: [
            "   return (",
            "     <form onSubmit={submit} className={styles.form}>",
            "+      {paymentRequest && (",
            "+        <PaymentRequestButtonElement options={{ paymentRequest }} />",
            "+      )}",
            '+      {paymentRequest && <Divider label="Or pay with card" />}',
            "       <CardElement options={cardOptions} />",
          ],
        },
      ],
    },
    9,
  ),
  say(
    "The button now shows on Safari with a card in Wallet. Next I'm wiring the confirmation into the existing order flow.",
    6,
  ),
  tool(
    "ap-test",
    "Bash",
    { command: "pnpm vitest run src/checkout", description: "Run the checkout tests" },
    2,
  ),
];

export const CART_TOTALS = [
  user("The cart totals test fails about one run in ten on CI. Find out why and fix it.", 26),
  say(
    "The test builds prices with floats and compares the rounded total to a fixed string. Running it a few times should show which case drifts.",
    25,
  ),
  tool("ct-grep", "Grep", { pattern: "toFixed\\(2\\)", path: "src/cart" }, 24),
  result(
    "ct-grep",
    "3 matches",
    {
      mode: "files_with_matches",
      numFiles: 3,
      filenames: ["src/cart/totals.ts", "src/cart/discounts.ts", "src/cart/tax.ts"],
    },
    24,
  ),
  say(
    "Discounts round each line before summing while tax rounds the total, so two orders of the same items can differ by a cent. I'll keep amounts in cents end to end.",
    20,
  ),
  tool(
    "ct-repeat",
    "Bash",
    {
      command: "pnpm vitest run src/cart --repeat 50",
      description: "Run the cart tests 50 times",
    },
    1,
  ),
];

export const RATE_LIMIT = [
  user("Rate limit the public API: 100 requests a minute per key, with the usual headers.", 58),
  say(
    "I'll add a sliding window limiter in Redis as middleware on the public router, and return `X-RateLimit-*` headers plus `Retry-After` on 429.",
    57,
  ),
  tool(
    "rl-plan",
    "TodoWrite",
    todos([
      ["Sliding window limiter on Redis", "completed"],
      ["Middleware on the public router", "completed"],
      ["Rate limit headers and 429 response", "completed"],
      ["Tests for the window and the headers", "completed"],
    ]),
    56,
  ),
  tool(
    "rl-test",
    "Bash",
    { command: "pnpm test src/middleware", description: "Run the middleware tests" },
    41,
  ),
  result(
    "rl-test",
    "ok",
    {
      stdout:
        " ✓ src/middleware/rate-limit.test.ts (9 tests) 212ms\n\n Test Files  1 passed (1)\n      Tests  9 passed (9)",
      stderr: "",
    },
    40,
  ),
  say(
    "Done. Every key gets 100 requests per rolling minute; past that the API answers 429 with `Retry-After`. The limiter lives in `src/middleware/rate-limit.ts` and all 9 tests pass.",
    40,
  ),
];

export const ONBOARDING_EMAILS = [
  user("Send a welcome email when someone signs up, with the template from the design folder.", 95),
  say(
    "I'll render the template with React Email and queue the send from the sign up handler, so a slow mail provider never delays the response.",
    94,
  ),
  tool(
    "oe-plan",
    "TodoWrite",
    todos([
      ["Port the template to React Email", "completed"],
      ["Queue the send after sign up", "completed"],
      ["Preview it in Mailpit", "in_progress"],
    ]),
    90,
  ),
  say(
    "The welcome email lands in Mailpit at http://mailpit.welcome-email.nex. Want me to add the plain text version too?",
    72,
  ),
];
