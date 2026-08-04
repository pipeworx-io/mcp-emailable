# mcp-emailable

Emailable MCP — wraps the Emailable email verification API (emailable.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `emailable_verify` | Verify whether an email address is deliverable (`jane@stripe.com`) — deliverability state, quality score, disposable/role/free flags, and typo suggestions. Uses Emailable's SMTP-level check (state is one of deliverable/undeliverable/risky/unknown; score is 0-100). A slow SMTP check can take up to 10s — that is expected. Example: emailable_verify({ email: "jane@stripe.com", _apiKey: "live_..." }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "emailable": {
      "url": "https://gateway.pipeworx.io/emailable/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Emailable data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
