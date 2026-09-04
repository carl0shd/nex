export type ModelSpeed = 'standard' | 'fast';

export interface TokenCounts {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  webSearches: number;
}

interface Rate {
  input: number;
  output: number;
}

interface PricedModel {
  match: RegExp;
  standard: Rate;
  fast?: Rate;
  introRate?: Rate;
  introUntil?: string;
}

// Derived from the input rate: writes carry a premium for the TTL they buy,
// reads are a tenth of full price. Uniform across every model.
const CACHE_WRITE_5M_MULTIPLIER = 1.25;
const CACHE_WRITE_1H_MULTIPLIER = 2;
const CACHE_READ_MULTIPLIER = 0.1;

const WEB_SEARCH_USD = 0.01;

const PER_MILLION = 1_000_000;

// Matched in order, so narrower ids come before the family fallbacks.
const MODELS: PricedModel[] = [
  { match: /fable-5|mythos-5|mythos-preview/, standard: { input: 10, output: 50 } },
  {
    match: /opus-5/,
    standard: { input: 5, output: 25 },
    fast: { input: 10, output: 50 }
  },
  {
    match: /opus-4-8/,
    standard: { input: 5, output: 25 },
    fast: { input: 10, output: 50 }
  },
  { match: /opus-4-[567]/, standard: { input: 5, output: 25 } },
  { match: /opus-4|opus-3|3-opus/, standard: { input: 15, output: 75 } },
  {
    match: /sonnet-5/,
    standard: { input: 3, output: 15 },
    introRate: { input: 2, output: 10 },
    introUntil: '2026-08-31'
  },
  { match: /sonnet/, standard: { input: 3, output: 15 } },
  { match: /haiku-4-5/, standard: { input: 1, output: 5 } },
  { match: /3-5-haiku/, standard: { input: 0.8, output: 4 } },
  { match: /haiku/, standard: { input: 0.25, output: 1.25 } }
];

const FALLBACK: PricedModel = { match: /./, standard: { input: 5, output: 25 } };

function resolveModel(model: string): PricedModel {
  const id = model.toLowerCase();
  return MODELS.find((entry) => entry.match.test(id)) ?? FALLBACK;
}

export function isKnownModel(model: string): boolean {
  const id = model.toLowerCase();
  return MODELS.some((entry) => entry.match.test(id));
}

function rateFor(entry: PricedModel, speed: ModelSpeed, isoTimestamp: string): Rate {
  if (speed === 'fast' && entry.fast) return entry.fast;
  if (entry.introRate && entry.introUntil && isoTimestamp.slice(0, 10) <= entry.introUntil) {
    return entry.introRate;
  }
  return entry.standard;
}

export function costOf(
  model: string,
  speed: ModelSpeed,
  tokens: TokenCounts,
  isoTimestamp: string
): number {
  const { input, output } = rateFor(resolveModel(model), speed, isoTimestamp);

  const tokenCost =
    tokens.input * input +
    tokens.output * output +
    tokens.cacheWrite5m * input * CACHE_WRITE_5M_MULTIPLIER +
    tokens.cacheWrite1h * input * CACHE_WRITE_1H_MULTIPLIER +
    tokens.cacheRead * input * CACHE_READ_MULTIPLIER;

  return tokenCost / PER_MILLION + tokens.webSearches * WEB_SEARCH_USD;
}

export function emptyTokens(): TokenCounts {
  return {
    input: 0,
    output: 0,
    cacheWrite5m: 0,
    cacheWrite1h: 0,
    cacheRead: 0,
    webSearches: 0
  };
}

export function addTokens(target: TokenCounts, source: TokenCounts): void {
  target.input += source.input;
  target.output += source.output;
  target.cacheWrite5m += source.cacheWrite5m;
  target.cacheWrite1h += source.cacheWrite1h;
  target.cacheRead += source.cacheRead;
  target.webSearches += source.webSearches;
}

export function totalTokens(tokens: TokenCounts): number {
  return (
    tokens.input + tokens.output + tokens.cacheWrite5m + tokens.cacheWrite1h + tokens.cacheRead
  );
}
