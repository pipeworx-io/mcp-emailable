interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Emailable MCP — wraps the Emailable email verification API (emailable.com)
 *
 * Tools:
 * - emailable_verify: verify whether a single email address is deliverable —
 *   returns a deliverability state, a 0-100 quality score, and disposable/role/
 *   free flags plus typo ("did you mean") suggestions.
 *
 * BYO key only: every call requires _apiKey (the user's Emailable LIVE key,
 * format `live_...`). The key is read off the args, deleted, and passed as the
 * `api_key` query param. All requests are GET.
 *
 * Complements the Hunter pack with a stronger, dedicated verifier (Emailable's
 * SMTP-level check, accept-all detection, and typo suggestions).
 */


const BASE_URL = 'https://api.emailable.com/v1/verify';

const tools: McpToolExport['tools'] = [
  {
    name: 'emailable_verify',
    description:
      'Verify whether an email address is deliverable (`jane@stripe.com`) — deliverability state, quality score, disposable/role/free flags, and typo suggestions. Uses Emailable\'s SMTP-level check (state is one of deliverable/undeliverable/risky/unknown; score is 0-100). A slow SMTP check can take up to 10s — that is expected. Example: emailable_verify({ email: "jane@stripe.com", _apiKey: "live_..." })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        email: {
          type: 'string',
          description: 'Email address to verify, e.g. "jane@stripe.com"',
        },
        smtp: {
          type: 'boolean',
          description: 'Whether to run the live SMTP deliverability check (default true). Disable to return faster, lower-confidence results.',
        },
        accept_all: {
          type: 'boolean',
          description: 'Whether to run the accept-all (catch-all) detection check.',
        },
        timeout: {
          type: 'integer',
          description: 'SMTP timeout in seconds, 2-10 (default chosen by Emailable). A slow SMTP check can take up to 10s.',
          minimum: 2,
          maximum: 10,
        },
        _apiKey: {
          type: 'string',
          description: 'Your Emailable LIVE API key (format "live_..."). Get one at emailable.com. Use a `live_` key — `test_` keys return fake data.',
        },
      },
      required: ['email', '_apiKey'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string | undefined;
  delete args._apiKey;

  if (!apiKey) {
    throw new Error(
      'Emailable requires an API key. Pass your Emailable key via _apiKey (get one at emailable.com). Use a `live_` key — `test_` keys return fake data.',
    );
  }

  switch (name) {
    case 'emailable_verify':
      return verify(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

interface VerifyResponse {
  email?: string;
  state?: string;
  score?: number;
  reason?: string;
  disposable?: boolean;
  role?: boolean;
  free?: boolean;
  accept_all?: boolean;
  did_you_mean?: string | null;
  mx_record?: string | null;
  smtp_provider?: string | null;
}

async function verify(args: Record<string, unknown>, apiKey: string) {
  const email = args.email as string | undefined;
  if (!email) {
    throw new Error('Emailable emailable_verify requires an `email` (e.g. "jane@stripe.com").');
  }

  const params = new URLSearchParams({ email, api_key: apiKey });

  // smtp defaults to true upstream; only send the param when explicitly disabled.
  if (args.smtp === false) params.set('smtp', 'false');
  if (typeof args.accept_all === 'boolean') params.set('accept_all', String(args.accept_all));
  if (args.timeout !== undefined) params.set('timeout', String(args.timeout));

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Emailable verify error: HTTP ${res.status} — check your Emailable _apiKey (use a live_ key).`,
      );
    }
    throw new Error(`Emailable verify error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as VerifyResponse;

  return {
    email: data.email,
    state: data.state,
    score: data.score,
    reason: data.reason,
    disposable: data.disposable,
    role: data.role,
    free: data.free,
    accept_all: data.accept_all,
    did_you_mean: data.did_you_mean,
    mx_record: data.mx_record,
    smtp_provider: data.smtp_provider,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
