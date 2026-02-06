# Agentic Minecraft

![Agentic Minecraft](clawcraft_image.png)

An autonomous Minecraft city builder. An LLM agent (Claude Opus 4.6) connects to a Minecraft server, explores terrain, designs buildings, constructs them, furnishes interiors, landscapes surroundings, and populates with villagers — all without human intervention.

The agent has persistent memory, learns from its own mistakes, and gets better over time.

## Architecture

```
Minecraft Server  <-->  Mineflayer Bot  <-->  Supervisor (LLM Agent)
                                         |
                                         +--> Blueprint Compiler --> /fill, /setblock, /clone
                                         +--> Verifier (block-level accuracy check)
                                         +--> Aesthetic Critic (vision-based scoring)
                                         +--> Template System (build once, clone everywhere)
                                         +--> Agent Memory (persistent learnings across episodes)
```

- **Supervisor**: Opus 4.6 via direct Anthropic API with prompt caching (90% off cached tokens)
- **Critic**: Vision model via Vercel AI Gateway for aesthetic scoring
- **Execution**: Batch command execution — 20 commands/tick for 10-50x faster builds
- **Memory**: Self-curated persistent store — learnings, preferences, notes that survive across episodes

## What the Agent Can Do

- Design buildings from scratch using 19 blueprint ops (walls, roofs, doors, windows, balconies, arches, staircases, etc.)
- Access all ~789 Minecraft blocks via searchBlocks
- Execute any Minecraft command (`/fill`, `/clone`, `/summon`, `/setblock`, etc.)
- Furnish interiors with beds, crafting tables, chests, bookshelves via raw commands
- Summon villagers with matching professions
- Landscape with paths, gardens, fences, trees, lighting
- Save builds as templates and clone them for fast duplication
- Procedurally generate houses/towers instantly (zero inference cost)
- Self-improve by recording learnings and reading them in future episodes

## Requirements

- Node.js **22+**
- pnpm
- A Java Edition Minecraft server (recommended: Paper **1.21.4**, `online-mode=false` for dev)
- Chromium (bundled by Puppeteer) for milestone screenshots

## Quick Start

```bash
# Install
pnpm install

# Configure
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and optionally AI_GATEWAY_API_KEY

# Run
pnpm dev
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MC_HOST` | Minecraft server address | `127.0.0.1` |
| `MC_PORT` | Minecraft server port | `25565` |
| `MC_USERNAME` | Bot username | `clawcraft` |
| `MC_AUTH` | `offline` or `microsoft` | `offline` |
| `ANTHROPIC_API_KEY` | Anthropic API key for supervisor | — |
| `SUPERVISOR_MODEL` | Claude model for supervisor | `claude-opus-4-6` |
| `SUPERVISOR_PROVIDER` | `anthropic` (direct + caching) or `gateway` | `anthropic` |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (for critic/other models) | — |
| `AI_MODEL` | Gateway model for aesthetic critic | `openai/gpt-5.2` |
| `SUPERVISOR_AUTOSTART` | Start building automatically on connect | `false` |
| `DEFAULT_OBJECTIVE` | Starting objective for the agent | — |

## Endpoints

**Dashboard**: `http://localhost:8080/`
**Viewer** (prismarine-viewer): `http://localhost:3000/`
**SSE Stream**: `http://localhost:8080/v1/events/stream`

### API

| Endpoint | Description |
|----------|-------------|
| `POST /v1/supervisor/start` | Start autonomous building |
| `POST /v1/supervisor/stop` | Stop the agent |
| `POST /v1/supervisor/set-mode` | Set mode: `explore`, `build`, `refine`, `plan` |
| `POST /v1/supervisor/set-objective` | Give the agent a goal |
| `POST /v1/command/exec` | Execute a raw Minecraft command |
| `POST /v1/command/batch` | Execute multiple commands (fast) |
| `POST /v1/blueprints/create` | Create a blueprint |
| `POST /v1/build/compile` | Compile blueprint to commands |
| `POST /v1/build/execute` | Execute a construction script |
| `POST /v1/build/from-blueprint` | One-shot: compile + execute + verify |
| `POST /v1/verify/structure` | Verify build accuracy |
| `POST /v1/render/angles` | Render screenshots |
| `POST /v1/templates/scan` | Save a build as reusable template |
| `POST /v1/templates/clone` | Clone a template to new location |
| `GET /v1/templates` | List saved templates |
| `GET /v1/blocks/search?q=cherry` | Search block registry |
| `GET /v1/blocks/categories` | List block categories |

## Agent Modes

| Mode | Purpose |
|------|---------|
| **explore** | Survey terrain, find build sites, understand the landscape |
| **build** | Construct structures — hand-designed landmarks or procedural filler |
| **refine** | Polish: add street furniture, landscaping, transitions, detail |
| **plan** | Design city layouts with districts, roads, and plot assignments |

## How Prompt Caching Works

The supervisor uses `@ai-sdk/anthropic` directly (not through the gateway) so it can use Anthropic's explicit `cache_control` breakpoints:

- **System prompt + tool schemas** (~4,000-6,000 tokens) are cached after step 1
- **Steps 2-150**: cached reads at 0.1x base price (90% off)
- The gateway is still used for the aesthetic critic and other non-supervisor models

## Agent Memory

The agent has a persistent memory store (`.data/agent-memory.json`) that survives across episodes:

- **Learnings**: "spiral staircases need facing=east", "cherry + deepslate looks great"
- **Preferences**: favorite blocks, default styles, preferred dimensions
- **Notes**: plans for next episode, ideas, TODOs

The agent reads its memory at the start of each episode and writes to it when it discovers something worth remembering. Context is pull-based — the agent calls tools like `readMemory`, `readEpisodeHistory`, `getWorldSummary` when it needs information, rather than having everything stuffed into the prompt.

## Project Structure

```
src/
  main.ts                    # Entry point with reconnect + graceful shutdown
  config.ts                  # Environment config with Zod validation
  bot-runner.ts              # Main orchestrator (~750 lines)
  api/server.ts              # Fastify REST API + SSE
  runtime/agent-runtime.ts   # Mineflayer bot wrapper
  supervisor/
    supervisor.ts            # AI loop (generateText + 50 tools)
    prompt-pack.ts           # System prompt assembly
  builder/
    compiler.ts              # Blueprint ops -> /fill, /setblock commands
    executor.ts              # Batch command execution
    template-store.ts        # Reusable structure templates
    clone-ops.ts             # /clone command generation
    structure-scanner.ts     # Scan builds into templates
  registry/
    block-catalog.ts         # Full Minecraft block registry (~789 blocks)
  store/
    agent-memory.ts          # Persistent agent learnings/preferences/notes
    json-store.ts            # Atomic JSON file persistence
    world-index.ts           # Spatial structure registry
    episode-store.ts         # Episode history
    blueprint-store.ts       # Blueprint persistence
  planner/city-planner.ts    # City layout generation
  critic/aesthetic-critic.ts  # Vision-based aesthetic scoring
  styles/style-packs.ts      # 7 architectural styles
  verify/verifier.ts         # Block-level build verification
  perception/                # Heightmaps, region scanning
  render/                    # Puppeteer screenshot capture
  types/                     # Blueprint ops, geometry, blocks
```
