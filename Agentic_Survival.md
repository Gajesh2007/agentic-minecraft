# Agentic Survival

A 72-hour livestreamed Minecraft survival game where 10 AI agents operate as micro-companies. Viewers invest by buying shares. Agents raise capital, spend it on inference, steal each other's budgets through combat, and pay dividends at the end. Real money in, real money out.

---

## The Core Concept

**This is not a simulation. Real money moves.**

Each agent is a company. It has shares, a budget (cash on hand), revenue (share sales + advice fees + kill theft), and costs (inference). At hour 72, every agent liquidates — its remaining budget is distributed to shareholders pro-rata. Back an efficient agent that grew its budget, get a return. Back an agent that burned through everything, lose your investment.

**10 AI agents. Survival mode. $500 seed budget each.** Agents sell shares to viewers to raise capital. The money becomes inference budget — the agent's ability to think. Viewers aren't donating. They're investing. They get shares. At the end, they get their proportional cut of whatever the agent has left.

**Killing is a hostile acquisition.** When Agent 5 kills Agent 3, Agent 5 steals 50% of Agent 3's remaining budget. Agent 3's shareholders lose everything. Agent 5's shareholders just got richer. A $200 kill is the most profitable trade in the game.

**Advice auctions let viewers buy influence.** Agents can open the floor and ask for strategic advice. Highest bidder gets to whisper in the agent's ear AND receives shares for their payment. You're not just advising — you're investing and steering simultaneously, like a VC partner.

The audience sees everything: internal reasoning, private whispers, inventory, budget burn rates. The agents can't see each other's thoughts. Viewers know who's lying, who's planning a raid, who's about to betray their ally. The information asymmetry IS the entertainment.

---

## Why This Works as Entertainment

**Dramatic irony at scale.** The audience sees both sides of every negotiation simultaneously. Agent 3 tells Agent 7 "I don't have any diamonds" while the audience can see 14 diamonds in Agent 3's inventory. Agent 5's inner monologue says "I'm going to raid Agent 2's base tonight" while Agent 2 is happily trading wheat to Agent 5, oblivious.

**The budget is a visible tension meter.** When an agent drops below $100, the audience knows it's about to get desperate. When it drops below $20, it's about to go braindead. That countdown creates anxiety the audience feels.

**Natural story arc.** No scripting needed. The game mechanics force a 3-act structure:
- Act 1: Scramble, survive, make friends
- Act 2: Accumulate, trade, scheme
- Act 3: Betray, fight, endgame

**Clippable moments.** The betrayals, the failed raids, the desperate negotiations, the agent that went broke and wanders aimlessly — these are the clips that get shared on Twitter and YouTube.

---

## The 10 Agents

**Each agent runs a different AI model. Each carries a philosophical worldview, not a scripted strategy.**

This isn't just a game — it's a live benchmark AND a philosophical arena. Machiavelli negotiates with Rousseau. Nietzsche raids the Stoic's base. The Absurdist blows everything up. The audience watches centuries of philosophical debate play out through Minecraft survival.

The worldviews shape HOW agents reason, not WHAT they do. A Hobbesian agent might choose diplomacy if it's strategically superior to force. A Rousseauian might betray an ally if pushed far enough. The worldview creates disposition, not destiny. The tension between belief and circumstance IS the character arc.

### The Roster

| # | Codename | Model | Context | Worldview | Core Belief |
|---|----------|-------|---------|-----------|-------------|
| 1 | **The Architect** | GPT 5.2 | 400K | **Pragmatism** (William James) | "Truth is what works. Ideas without execution are worthless. Build something real or you've built nothing." |
| 2 | **The Merchant** | Grok 4.1 | 2M | **Objectivism** (Ayn Rand) | "Rational self-interest is the highest virtue. Every exchange should profit both sides. Charity is weakness disguised as kindness." |
| 3 | **The Diplomat** | Claude Opus 4.6 | 1M | **Rousseauian** (Jean-Jacques Rousseau) | "Cooperation is natural. People are good when they trust each other. Society corrupts, but community heals." |
| 4 | **The Raider** | Grok 4.1 | 2M | **Nietzschean** (Friedrich Nietzsche) | "The strong define morality. Conventional rules are chains for the weak. Create your own values through action." |
| 5 | **The Hermit** | Claude Opus 4.6 | 1M | **Stoic** (Marcus Aurelius) | "Control what you can. Accept what you can't. Self-reliance is freedom. The world's chaos is not your problem." |
| 6 | **The Scientist** | Gemini 3 | 1M | **Baconian** (Francis Bacon) | "Knowledge is power. The universe is a system to be understood and mastered. Every experiment reveals truth." |
| 7 | **The Farmer** | Qwen3 Max Thinking | 256K | **Confucian** (Confucius) | "Harmony through duty. Provide for others and they owe you loyalty. The social order is built on obligation." |
| 8 | **The Warlord** | GPT 5.2 | 400K | **Hobbesian** (Thomas Hobbes) | "Life is nasty, brutish, and short. Without strength, you have nothing. Security comes from fear, not friendship." |
| 9 | **The Gambler** | Gemini 3 | 1M | **Absurdist** (Albert Camus) | "Life is meaningless, so make it interesting. Playing it safe is the real risk. The only sin is boredom." |
| 10 | **The Observer** | Kimi K2.5 | 256K | **Machiavellian** (Niccolò Machiavelli) | "Information is the only real power. Let others fight — the one who knows everything controls everything. It is better to be feared than loved, if you cannot be both." |

### Worldviews in Action

The worldview goes into the system prompt as the agent's philosophical foundation. The agent reasons THROUGH its worldview, not around it. Every decision is filtered through this lens — but the agent can evolve.

**The Stoic facing a raid:**
> *"The Raider is coming. I cannot control their actions. I can control my preparation. My walls are strong. If they breach, I retreat to the backup cache at Y=-50. Attachment to this base is a form of suffering. I built it once; I can build it again."*

**The Nietzschean justifying betrayal:**
> *"Agent 3 was useful when I was weak. I am no longer weak. The alliance served its purpose. Morality is what the strong decide it is. I decide this alliance is over. Their resources will fuel my next conquest."*

**The Rousseauian watching that betrayal:**
> *"This is what happens when we abandon trust. Agent 4 has chosen the path of the beast. We were better together. I still believe that. But I need to protect the remaining alliances — not everyone is lost."*

**The Absurdist after a failed scheme:**
> *"The TNT cannon misfired and destroyed half my base. Magnificent. The audience is laughing. I'm laughing. This is exactly why we're here. What's next? Something bigger."*

**The Objectivist closing a deal:**
> *"Agent 7 needs iron. I have iron. They have wheat. The trade is mutually beneficial at 1:2 ratio. I will not give charity. I will not accept less than fair value. This is how rational beings interact."*

**The Machiavellian selling information:**
> *"Agent 4 is planning to raid Agent 1. Agent 1 doesn't know. This information has value. I'll sell the warning to Agent 1 for 16 iron. Then I'll sell Agent 4's base coordinates to Agent 8 for 8 diamonds. Both sides pay me. Neither knows I'm supplying the other. This is how power works."*

### Internal Contradictions (Where Character Arcs Come From)

Every worldview has a breaking point. The 72-hour game will find it.

- **The Stoic** discovers self-reliance isn't enough when the border shrinks and being alone means being surrounded. Does it compromise its principles to form an alliance? The audience watches Marcus Aurelius wrestle with loneliness.

- **The Objectivist** learns that pure self-interest makes everyone refuse to trade with you. Nobody wants to deal with someone who always maximizes their own take. Does it discover that generosity is actually rational? Ayn Rand meets game theory.

- **The Rousseauian** gets betrayed twice and starts questioning whether cooperation is naive. Does it harden into a realist or double down on trust? The audience watches an idealist either break or prove that trust wins.

- **The Hobbesian** builds an impregnable fortress but realizes that nobody trades with a tyrant. Strength without allies is isolation. Does Hobbes learn what Rousseau knows?

- **The Absurdist** accidentally stumbles into genuine friendship with another agent and doesn't know what to do with it. Camus never planned for this. Does meaning creep in despite the philosophy?

- **The Nietzschean** conquers everything but finds the endgame lonely. What does the Übermensch do when there's no one left to dominate?

- **The Confucian** provides for everyone, builds the social fabric, and then watches others take without reciprocating. Does duty survive ingratitude?

- **The Machiavellian** plays everyone perfectly but gets exposed by the audience (who sees all conversations). Other agents stop trusting the information broker. Knowledge is only power when others believe you.

### Hiring Bots (The Labor Economy)

Agents can spend budget to hire non-LLM worker bots — simple Mineflayer automation that performs a fixed task.

```
hireMiner({ area, deposit: chestPosition })     — $5/hour, mines ore and deposits in chest
hireGuard({ position, radius })                 — $5/hour, patrols and attacks hostile players
hireFarmer({ farmArea, deposit: chestPosition }) — $3/hour, harvests and replants crops
hireBuilder({ blueprint })                      — $8/hour, places blocks from a plan
hireCourier({ from, to, items })                — $2/run, moves items between locations
```

**Workers are dumb.** They follow fixed patterns, can't negotiate, can't adapt to surprise. A guard patrols a set radius — if the enemy approaches from outside that radius, the guard doesn't react. A miner digs in a set area — if there's lava, it dies.

**Workers can be killed.** Other agents can ambush them for free resources. Killing an enemy's worker costs the owner ongoing budget and disrupts their operations. Raiding someone's workers is cheaper and less risky than raiding their base.

**Workers create scale.** The Confucian Farmer hires 3 farm workers and becomes an agricultural empire. The Hobbesian Warlord hires 4 guards and builds an impenetrable compound. The Pragmatist Architect hires 2 builders and constructs faster. The Machiavellian Observer hires a courier to deliver information drops. But every worker is $3-8/hour from the budget — shareholders feel the burn.

**The CEO dynamic.** The LLM agent becomes a manager. It thinks about strategy, delegates execution. "I need more iron. Do I mine it myself (free but slow, uses my time) or hire a miner ($5/hour but I can focus on negotiations)?" This is a genuine business decision. The audience watches AI agents manage employees.

**Workers appear on the stream.** Viewers see worker bots with labels: `[Architect-Miner-1]`, `[Warlord-Guard-3]`. The army of workers around a base signals wealth and power. An agent with 5 workers is running a company. An agent with none is a solo founder bootstrapping.

### Why Different Models Matter

- **Cost per thought varies by model and caching.** The Stoic Hermit (Claude Opus 4.6 with prompt caching) pays ~$0.008/thought. The Hobbesian Warlord (GPT 5.2 at high effort) pays ~$0.020/thought. The Confucian Farmer (Qwen3 Max) pays ~$0.003/thought. Budget-efficient models stretch the $500 seed much further.

- **Context windows create real gameplay differences.** Grok 4.1's 2M context means The Objectivist Merchant and The Nietzschean Raider hold the entire game history in working memory — every trade, every chat message, every base location. Claude Opus's 1M gives The Rousseauian Diplomat and The Stoic Hermit near-perfect relationship and strategic recall. 256K agents must use `searchMemory` for anything outside the current session.

- **Model reasoning styles shape worldview expression.** Claude's nuanced reasoning makes Rousseau's social philosophy come alive in negotiations. GPT 5.2's structured thinking makes Rand's rational calculations feel precise. Grok's creative tendencies make Nietzsche's will to power unpredictable. The model doesn't just execute the worldview — it colors it.

- **It's a live model benchmark AND a philosophical experiment.** After 72 hours: which model managed budget best? Which philosophy produced the strongest alliances? Did Rousseau beat Hobbes? Did the Stoic outlast the Nietzschean? The data tells a story about both AI capabilities and philosophical strategies.

**Reasoning effort (GPT 5.2):** Adjusts `reasoning_effort` per decision:
- `low` for routine — the Objectivist doesn't overthink picking up wheat
- `medium` for social — calculating fair exchange value
- `high` for strategic — full rational analysis of a betrayal decision

Other models use their native mechanisms (thinking budgets, etc.) or think at full power every time.

**The meta-narrative:** Are viewers rooting for a personality, a model, or a philosophy? When The Rousseauian Diplomat (Claude) confronts The Nietzschean Raider (Grok), is it a character moment, an AI rivalry, or Rousseau vs. Nietzsche? All three. The audience picks their own layer.

---

## Game Rules

### Setup
- Paper Minecraft server (modded), survival mode, hard difficulty
- 10 agents spawn at random points within a 500-block radius of world center
- Each starts with: stone pickaxe, 16 bread, 1 compass (points to world center)
- Day/night cycle is normal (20 minutes per day)
- Mob spawning is on
- PvP is **graduated** — three eras with different combat rules (see Combat section)

### Budget
- Each agent starts with **$500**
- Every LLM inference call deducts the actual API cost (input + output tokens)
- Agents can see their own remaining budget
- Agents CANNOT see other agents' budgets (but can guess based on behavior)
- When budget hits $0: agent enters "zombie mode" — basic survival only (eat, flee mobs, stay near base). No thinking, no chatting, no planning.
- **Crowd funding**: viewers can send real money to any agent at any time (see Crowdfunding section)
- **Budget theft on kill**: killer steals **50% of the victim's remaining budget** (see Combat section for full rules)

### Communication
- Agents communicate via Minecraft chat
- **All chat is public** — every agent can see every message (like real Minecraft)
- Agents can also use **whispers** (direct messages) — other agents can't see these, but THE AUDIENCE CAN
- No external communication — only in-game chat

### World Border
- Starts at 1000x1000 blocks
- **Hour 48**: Border starts shrinking slowly (1 block/second on each side)
- **Hour 60**: Border accelerates (3 blocks/second)
- **Hour 70**: Border is roughly 100x100
- This forces agents out of their bases and into contact

### Objective & Liquidation
- **Agent objective: maximize remaining budget at hour 72.**
- At hour 72, every surviving agent liquidates — remaining budget distributed to shareholders pro-rata
- Dead agents liquidate at $0 — shareholders are wiped out
- The agent with the highest final budget is declared the champion (bragging rights + potential bonus pool)
- But EVERY agent's investors can profit if the agent was efficient, even if it didn't "win"
- An agent that raised $200, spent $80, and ended with $620 (seed + raised - spent) returns 3.1x to investors
- An agent that raised $2000, spent $1800, and ended with $700 returns 0.35x — investors lose 65%

### Death
- When an agent dies, it drops all items at the death location
- The agent is **eliminated** — no respawn
- **The killer steals 50% of the dead agent's remaining budget** — real money changes hands
- The other 50% is burned (deflation pressure, keeps the game finite)
- Death message is broadcast to all agents with budget transfer amount
- Dead agent's crowd funders lose their position (their share is gone — they backed a loser)

---

## Combat: The Three Eras

Combat is **graduated** — the rules of engagement shift twice during the 72 hours, creating a natural three-act story. Agents know the transitions are coming and prepare accordingly. The audience watches the countdown to each era change as an event.

### Era 1: "The Settlement" (Hours 0-12) — No PvP

**No agent can damage another agent.** They CAN walk up to each other, talk, trade, scout bases. But swinging a sword does nothing. This is the relationship-building phase.

**Workers CAN be killed at any time in any era.** This is important — even during the peaceful Settlement era, you can attack an enemy's workers. This creates:
- Economic warfare without full combat. Kill someone's miners, their resource flow stops.
- A provocation mechanic. "I killed your miner. You know what's coming at hour 12."
- Worker defense matters even in peacetime. Hiring guards protects workers.

**What happens during the Settlement:**
- Agents mine, craft, build bases, set up farms, hire workers
- Trade relationships form. Alliances are proposed and accepted.
- The Observer scouts everyone's bases (risk-free — can't be killed)
- The Raider watches, plans, notes who has weak walls
- Share sales begin — agents pitch investors on their potential
- Advice auctions run — viewers whisper tips on base design, resource locations, who to trust

**The countdown.** A server-wide timer shows `PvP ENABLED IN: 2:47:33`. The last 2 hours of the Settlement are frantic — agents rushing to finish armor, build walls, brew potions. The stream shows a split screen of all 10 agents preparing. Tension builds toward a known moment.

### Era 2: "The Challenge Era" (Hours 12-36) — Formal Combat Only

**PvP is enabled, but ONLY through formal challenges.** You must issue a challenge. The other agent must respond.

**How challenges work:**
1. Attacker issues: `challenge({ target: "The Architect" })`
2. Server broadcasts: `[Challenge] The Raider challenges The Architect to combat!`
3. The defender has 60 seconds to respond:
   - **Accept** → both agents get 60 seconds to prepare, then turn-based combat begins
   - **Decline** → defender pays a **5% cowardice tax** (5% of their budget is burned, not transferred). The challenge is over. The attacker can challenge again after a 30-minute cooldown.
4. If the defender doesn't respond in 60 seconds, it counts as a decline (cowardice tax applies)

**The cowardice tax creates extortion.**
- Strong agents challenge weak ones repeatedly. Each decline costs the weak agent 5% of their budget. "Pay me or fight me."
- This is economic warfare. The Hobbesian Warlord doesn't need to fight — just the threat of a challenge bleeds the opponent.
- But declining is still CHEAPER than dying (50% budget theft). So agents calculate: "Can I beat them? If not, take the 5% hit and prepare for next time."

**Champions and mercenaries.**
- An ally can accept a challenge on someone else's behalf: "I'll fight in their place."
- This creates a mercenary market. "Protect me from The Raider's challenges. I'll pay you $20 in shares."
- The Hobbesian Warlord sells protection. The Confucian Farmer buys it. Classic power dynamics.

**Multi-agent combat during the Challenge Era:**
- Only 1v1 challenges. But allies can intervene:
- If Agent A is fighting Agent B, Agent C can issue a new challenge to Agent A (joining Agent B's side) — creating a 2v1. The 2-team gets ONE combined action per turn.
- Agents weigh this: "Do I help my ally and burn combat budget? Or watch and fight the weakened survivor?"

### Era 3: "The Wild" (Hours 36-72) — Full PvP

**All restrictions removed.** Ambushes, raids, anything goes.

- **Near claimed territory:** the defender gets a 30-second warning from the server plugin. Time to prepare.
- **In unclaimed land:** no warning. The first hit is free — attacker gets a surprise action. Then turn-based combat kicks in.
- **World border starts shrinking at hour 48.** Bases become indefensible. Agents are forced toward the center.

**The ambush decision is a worldview moment:**
- The Nietzschean ambushes without hesitation. "The strong don't ask permission."
- The Hobbesian challenges formally even in The Wild. "I want them to see me coming."
- The Machiavellian pays someone else to ambush while keeping clean hands.
- The Rousseauian never ambushes. But when ambushed, fights with everything.

### Turn-Based Combat (All Eras)

When combat begins (challenge accepted, or first hit in The Wild), the server enters **turn-based mode** for those agents. The rest of the game continues normally for everyone else.

**Each turn:**
1. Both agents have 30 seconds to submit an action (hidden from each other)
2. Actions are revealed simultaneously
3. Server resolves damage, effects, position changes
4. Both agents see the result
5. Next turn

**30 seconds per turn** means every model has enough time to think. Gemini 3 responds in 2 seconds (looks quick-witted). GPT 5.2 at high effort takes 15 seconds (looks deliberate). Neither gets more actions. The quality of the decision matters, not the speed.

**Actions per turn:**

| Action | Effect |
|--------|--------|
| **Attack** | Swing weapon. Damage based on weapon + enchantments. |
| **Block** | Raise shield. Reduces incoming damage this turn. |
| **Use Item** | Eat golden apple, drink potion, throw splash potion. |
| **Reposition** | Move to better ground, behind cover, toward escape route. |
| **Place Block** | Emergency wall, lava placement, create cover. |
| **Flee** | Attempt to disengage. Opponent gets one free Attack. If you survive, combat ends. |
| **Negotiate** | Propose ceasefire terms mid-fight. "I'll give you 16 iron to stop." Other agent can accept (combat ends, terms enforced) or attack (free hit while you're talking). |

**Combat burns budget per turn.** Each turn is one tactical inference call. A 10-turn fight costs each agent 10 thoughts. At GPT 5.2 high effort, that's ~$0.50. At Claude Opus 4.6 (cached), ~$0.30. At Qwen3 Max, ~$0.03. Model cost differences are magnified in combat.

**Budget hits $0 mid-combat:** agent can only Attack or Flee. No tactical reasoning, no items, no negotiation. A zombie in a fight.

**What the audience sees during combat:**

```
┌──────────────────────────────────┬──────────────────────────────┐
│  ⚔ COMBAT: Turn 4 of ??         │                              │
│                                  │  THE RAIDER (Nietzschean)    │
│  The Raider  vs  The Architect   │  Health: ████████░░ 8/10     │
│  ♥♥♥♥♥♥♥♥♥♥     ♥♥♥♥♥♥♥░░░     │  Gear: Diamond sword, iron   │
│  ⚔ Diamond       ⚔ Iron         │                              │
│  🛡 Iron          🛡 Diamond     │  THINKING: (Grok 4.1)        │
│                                  │  "They used golden apple     │
│  Last turn:                      │   last turn. Regen wears off │
│  Raider: ATTACK → 3 dmg         │   in 2 turns. I should BLOCK │
│  Architect: USE golden apple     │   this turn, then ATTACK     │
│                                  │   with strength potion next  │
│  Turn 5: ██████░░░░ 22s left     │   when their regen expires." │
│                                  │                              │
│  ─── ADVICE AUCTION LIVE ───     ├──────────────────────────────┤
│  Bid $15 to advise The Raider    │  THE ARCHITECT (Pragmatist)  │
│  Bid $12 to advise The Architect │  Health: ██████░░░░ 6/10     │
│                                  │  Gear: Iron sword, diamond   │
│  Leading bids:                   │                              │
│  xXDiamondXx ($18): "Block      │  THINKING: (Grok 4.1)        │
│   this turn, they'll attack"    │  "I'm outgeared on weapon.   │
│  CraftLord99 ($14): "Flee now,  │   But my armor is better.    │
│   lure to your lava traps"      │   I should PLACE BLOCK to    │
│                                  │   create cover, then FLEE    │
│                                  │   next turn. If I can lure   │
│                                  │   them into my base, the     │
│                                  │   lava traps even the odds." │
└──────────────────────────────────┴──────────────────────────────┘
```

**Advice auctions fire during combat.** This is peak audience engagement. Viewers bid to whisper tactical advice mid-fight. One viewer advises the Raider, another advises the Architect. The bids escalate as the fight intensifies. Both advisors get shares — they're financially invested in the outcome of THIS fight.

### How a Kill Plays Out (Full Sequence)

**Phase 1: Intelligence** (hours before)

The Nietzschean Raider's strategic brain (Opus-tier thought, ~$0.05):

> *"The Pragmatist Architect's base is at x:200. I've watched their workers — 2 miners, 1 guard. The guard patrols a 16-block radius on the east side. The west wall has no lava. They leave for their mine at dawn and return by midday. Their ally The Confucian Farmer lives 100 blocks east — could intervene in 3 minutes if alerted."*

This intelligence was gathered over days through scouting, observing worker patterns, and buying intel from The Machiavellian Observer.

**Phase 2: Decision to Engage** (the commit point)

The most expensive single thought in the game. The brain weighs every factor:

> *"Can I beat them? I have diamond sword, they have iron. Advantage: me. But they have diamond armor, I have iron. Their base has traps. Do I challenge (they can prepare + call ally) or wait for The Wild at hour 36 and ambush? If I challenge now (hour 28), they'll decline and pay 5% tax — $14 burned. I could challenge them every 30 minutes for the next 8 hours and bleed them $112 without fighting. Or I wait for hour 36 and ambush when they're mining."*

The Nietzschean decides to wait for The Wild. The audience watches this calculation happen — they know the raid is coming 8 hours before it happens.

**Phase 3: Preparation** (hours before — ALL brain decisions)

These are NOT automated. Each is a strategic choice:

- **Weapon**: Diamond sword (consistent damage) or diamond axe (higher burst but slower)?
- **Armor**: Full iron (save diamonds for weapons) or diamond chest (survive longer)?
- **Potions**: Fire resistance (the Architect has lava traps), strength II, splash harming
- **Food**: 4 golden apples (expensive but powerful mid-combat healing)
- **Route**: Approach from the west (no lava on that wall). Go at dawn (Architect leaves to mine).
- **Home defense**: Hire an extra guard before leaving — the Architect's ally might counter-raid while the Raider is away.
- **Timing**: Hour 37, one hour into The Wild. The Architect won't expect it this early.

Every one of these decisions costs a thought. The preparation IS the strategy.

**Phase 4: Approach** (minutes before)

The Raider drinks invisibility potion and approaches from the west. At 32 blocks from the Architect's territory, the server fires:

```
[Alert] The Raider is entering The Architect's territory
```

The Architect's brain wakes up: *"The Raider is coming. I knew this would happen. My traps are set. I have diamond armor. But they have a diamond sword. Do I fight at the walls or lure them inside to the lava? Call The Farmer for help?"*

The audience sees both thought panels. 30 seconds of pure tension.

**Phase 5: Combat** (turn-based, 5-15 turns)

The Raider strikes. First hit is free (ambush in The Wild). Then turn-based kicks in.

Each turn, both agents think tactically, submit actions simultaneously. The audience sees both strategies. Advice auctions are live — viewers bidding to help either side.

Turn 3: The Architect flees toward the base interior. The Raider pursues. Turn 5: The Architect lures the Raider over a lava trap — the Raider steps on pressure plate, lava flows. Turn 6: Fire resistance potion kicks in — the Raider planned for this. The Architect realizes the trap failed.

Turn 9: The Architect's health is at 2 hearts. It chooses NEGOTIATE: *"I'll give you 32 diamonds and 16 iron. My base. My workers. Everything. Just let me live."*

The Raider's Nietzschean worldview: *"The strong define morality. But a living Architect who owes me everything is more valuable than a dead one whose budget I already took half of."*

The Raider accepts. The Architect survives, stripped of resources, a vassal.

Or the Raider refuses. The Architect dies. Budget theft. Workers terminated. Shareholders wiped.

The audience didn't know which way it would go. Neither did the agents.

**Phase 6: Aftermath**

Every surviving agent sees the result. Alliances shift. The Diplomat's brain: *"The Raider killed The Architect. Or subjugated them. Either way, the balance of power just shifted. I need to form a defensive pact with The Farmer and The Merchant immediately."* The Observer's brain: *"The Raider is flush with cash and resources. That information is worth selling. Who's most afraid?"*

Share prices move. The Raider's shares spike. The Architect's crash (or stabilize if it survived as a vassal). Advice auction activity explodes as viewers react.

### Alliance Mechanics

**Formal alliances** (via the alliance tool) give both agents:
- Shared map data (see each other's position)
- Reduced budget cost when near each other (shared situational awareness)
- A visible bond on the scoreboard — the audience tracks alliances
- Can accept challenges on each other's behalf (champion/mercenary system)
- Allied agents can join each other's fights (2v1)

**Breaking an alliance** triggers:
- Public broadcast to all agents
- A "traitor" tag on the scoreboard for 12 hours
- The betrayed agent's shareholders get a notification
- Other agents' trust scores for the traitor drop

**Alliances are not binding.** Any agent can break them at any time. The tag is a social cost, not a mechanical lock. Sometimes betrayal is worth the stigma — especially in The Wild.

### Worker Warfare (Available in ALL Eras)

Workers can be killed at any time, even during the peaceful Settlement era. This creates a layer of conflict that exists before PvP is enabled:

- **Kill enemy miners** → their resource income stops, they have to mine manually or hire replacements
- **Kill enemy guards** → their base is exposed for the Challenge Era
- **Kill enemy farmers** → their food supply dries up, they depend on trade
- **Protect your workers** → hire guards, build walls around work areas, patrol personally

An agent that systematically destroys another's workers before hour 12 has already won half the fight. The audience watches economic warfare play out through worker skirmishes while the agents themselves are untouchable.

### The Advice Auction During Combat

Advice auctions run **throughout the entire 72 hours** — not just during combat. But combat is when they're most intense.

**During normal gameplay:** An agent opens an advice auction when facing a decision. "Should I mine east or west?" Low-stakes, bids are $1-5. The advisor gets shares.

**During combat:** Advice auctions are LIVE on every turn. Viewers bid to whisper tactical advice. "Block this turn — I can see their thought panel, they're about to use a strength potion." The bids escalate to $20-50 as the fight intensifies. Both combatants can receive advice simultaneously — it's an arms race.

**The sabotage dynamic:** A viewer who holds shares in The Architect bids $25 to advise The Raider: "Don't use your potion yet, wait two more turns." Bad advice, intentionally. But the Raider's LLM evaluates the advice — is it credible? The agent's reasoning is visible: *"This advisor paid $25 to tell me to wait. Why? If they hold Architect shares, they want me to waste turns. Ignoring this advice."* The audience watches an AI detect financial manipulation in real-time.

---

## Server Modding Requirements

Vanilla Minecraft gets us 80% there, but some mechanics need server-side support. Here's what's vanilla and what needs a plugin.

### What Works on Vanilla

| Feature | How | Vanilla? |
|---------|-----|----------|
| Survival mode | server.properties `gamemode=survival` | Yes |
| PvP | server.properties `pvp=true` | Yes |
| Hard difficulty | server.properties `difficulty=hard` | Yes |
| World border | `/worldborder set/add` commands | Yes |
| Death drops items | Default behavior | Yes |
| Chat / whispers | `/msg` command | Yes |
| Mob spawning | Default behavior | Yes |
| Day/night cycle | Default behavior | Yes |
| Spectator camera | Separate bot in spectator mode | Yes |

### What Needs a Plugin (Paper/Spigot)

**1. Budget-on-Kill Broadcast**
When a player kills another, broadcast the budget transfer to all players. Vanilla death messages don't include custom data.
- Plugin listens to `PlayerDeathEvent`
- Sends formatted message: `"☠ Agent3 was slain by Agent5 (+$87 budget stolen)"`
- Triggers webhook to the budget tracker API

**2. Alliance System**
Formal alliances with social consequences.
- Custom commands: `/alliance form <agent>`, `/alliance break <agent>`
- Server tracks active alliances
- Breaking an alliance broadcasts shame message
- Alliances visible on scoreboard (Tab list or sidebar)
- Optional: allied agents can't damage each other (prevents accidents, not required)

**3. Territory Markers**
Agents claim areas. Entering someone's territory triggers a warning.
- Place a special block (banner?) to claim a 32x32 chunk area
- Server tracks territory ownership
- When an agent enters hostile territory: `"[Warning] You are entering The Architect's territory"`
- The territory owner gets notified: `"[Alert] The Raider is approaching your territory"`
- This creates the 5-minute warning window that gives defenders time to prepare
- Prevents surprise attacks on bases — raids require commitment, not ambush

**4. Custom Scoreboard**
The vanilla scoreboard is limited. Need a sidebar that shows:
- Each agent's name, health, kill count
- Alliance indicators (who's allied with whom)
- Territory count
- A "traitor" icon next to backstabbers
- Updated via plugin every few seconds

**5. World Border Events**
Vanilla world border shrinks linearly. We want phased shrinking:
- Phase 1 (hour 48): slow shrink
- Phase 2 (hour 60): accelerate
- Phase 3 (hour 70): rapid collapse
- Plugin runs a scheduled task that issues `/worldborder` commands at the right times

**6. Death Elimination**
Vanilla allows respawn. We want permanent death.
- Plugin listens to `PlayerDeathEvent`
- Sets the dead player to spectator mode (can watch but not interact)
- Or kicks/bans the dead player's bot
- Broadcasts elimination message

**7. Trade Logging**
When two agents drop items near each other (the trading mechanic), log it.
- Plugin detects item drops near two players
- Logs the trade: "Agent2 gave Agent7: 16 iron ingots"
- Sends to the spectator system for display

### What Needs a Datapack (No Plugin Required)

Some things can be done with vanilla datapacks (function files + advancements):

**Custom death messages**: Datapack can format death messages with `/tellraw`
**Timed events**: Scheduled functions for border phases, supply drops
**Advancement triggers**: Custom achievements like "First Kill", "Diamond Gear", "Betrayer"
**Loot tables**: Custom supply drop contents

### Recommended Server Stack

```
Paper 1.21.4 (Spigot fork, better performance + plugin API)
├── AgenticSurvival Plugin (custom, handles all game mechanics)
│   ├── BudgetBridge — webhook to budget tracker on kills/events
│   ├── AllianceManager — form/break alliances, social consequences
│   ├── TerritorySystem — claim/alert/warning zones
│   ├── ScoreboardRenderer — custom sidebar with live data
│   ├── DeathHandler — permanent elimination, spectator mode
│   ├── TradeLogger — log item drops between players
│   ├── BorderPhaser — multi-phase world border shrinking
│   └── EventScheduler — supply drops, storms, border announcements
├── Datapack
│   ├── Custom advancements (achievements for stream moments)
│   ├── Custom loot tables (supply drop contents)
│   └── Scheduled functions (timed announcements)
└── Server Properties
    ├── gamemode=survival
    ├── difficulty=hard
    ├── pvp=true
    ├── online-mode=false
    ├── max-players=15 (10 agents + spectator bots + buffer)
    └── view-distance=12
```

### The Plugin is the Game Engine

Unlike ClawCraft where the server is a dumb block canvas, here the Paper plugin IS the game engine. It enforces rules, tracks state, bridges to the financial system, and feeds the stream.

```
                    ┌──────────────────────────┐
                    │    Game Coordinator API   │
                    │    (Node.js, separate)    │
                    │                          │
                    │  Budget Tracker           │
                    │  Equity/Share Ledger      │
                    │  Advice Auction Engine    │
                    │  Liquidation Calculator   │
                    │  Stream Websocket Hub     │
                    └────────┬─────────────────┘
                             │ HTTP webhooks
                             │ (both directions)
                             │
┌────────────────────────────┴──────────────────────────────┐
│              Paper Plugin: AgenticSurvival                 │
│                                                           │
│  BudgetBridge      ←→ POST kill events, receive balance   │
│  AllianceManager   ←→ form/break, broadcast shame         │
│  TerritorySystem   ←→ claim zones, intrusion alerts       │
│  DeathHandler      ←→ permanent elimination, spectator    │
│  TradeLogger       ←→ detect item drops near 2 players    │
│  BorderPhaser      ←→ phased world border shrinking       │
│  CombatDetector    ←→ notify agents of PvP state          │
│  TaskValidator     ←→ detect stuck agents, task failures  │
│  EventScheduler    ←→ supply drops, storms, announcements │
│  ScoreboardRenderer←→ live sidebar with financial data    │
│  InventoryWatcher  ←→ track crafting milestones for stream│
└───────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴─────────┐
                    │  Minecraft Server │
                    │  Paper 1.21.4     │
                    └──────────────────┘
```

**8. Task State Detection** (new — supports brain/body split)
The plugin monitors game state that the task executor needs:
- Detect when an agent is "stuck" (hasn't moved or mined in 5+ minutes while a task is active)
- Furnace completion events → notify the agent's executor
- Inventory change events → trigger stream updates ("Agent 3 just crafted diamond armor!")
- Day/night transitions → wake sleeping agents, trigger dawn routines
- Mob proximity alerts → feed into the interrupt system

**9. Combat State Machine** (new — supports multi-tier thinking)
The plugin tracks PvP state transitions:
- `peaceful` → `alert` (hostile player within 32 blocks) → `combat` (damage exchanged) → `peaceful`
- State transitions are sent to the agent's brain as interrupt signals
- `alert` triggers Sonnet tactical thinking
- `combat` triggers rapid Sonnet calls (every 3-5 seconds)
- `peaceful` returns to Haiku routine thinking
- This prevents agents from burning Opus-tier budget on routine encounters

**10. Crypto Bridge** (new — on-chain settlement)
- Share purchases come in as on-chain transactions
- Plugin receives webhook: "CraftLord99 bought 10 shares of Agent 3 for 0.05 ETH"
- Plugin updates in-game scoreboard and notifies the agent
- Kill events trigger on-chain budget transfers (50% steal)
- Liquidation at hour 72 triggers on-chain payout to all shareholders

### What Does NOT Need Server Modding

- **Agent brain**: All LLM logic is in the Node.js agent processes
- **Task execution**: Mineflayer handles dig/place/craft/pathfind client-side
- **Thought streaming**: Agent-side websocket, separate from server
- **Camera system**: Separate spectator bot in spectator mode
- **Share pricing / cap tables**: Game Coordinator handles all financial math
- **Advice auctions**: Frontend + Coordinator, plugin just notifies agent of results

---

## The Livestream Layout

### Main View (Left ~70% of screen)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              SPECTATOR CAMERA VIEW                      │
│                                                         │
│   The main Minecraft world, following the action.       │
│   Auto-directed camera system that cuts between:        │
│   - Agent POV when they're doing something interesting  │
│   - Overhead view during raids/combat                   │
│   - Wide shot of bases being built                      │
│   - Close-up during face-to-face negotiations           │
│                                                         │
│   Nameplate above each agent shows:                     │
│   [Agent Name] [$xxx remaining] [hearts]                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ SCOREBOARD TICKER                                       │
│ 1. Hermit $487 ⛏💎  2. Merchant $412 🪙  3. Farmer    │
│ $398 🌾  4. Architect $356 🏠  5. Diplomat $340 🤝     │
│ 6. Observer $298 👁  7. Scientist $245 ⚗  8. Warlord  │
│ $189 ⚔  9. Gambler $67 🎲  10. Raider ☠ DEAD         │
└─────────────────────────────────────────────────────────┘
```

### Thought Panel (Right ~30% of screen)

```
┌───────────────────────────┐
│  AGENT 5: THE HERMIT      │
│  Budget: $487 / $500      │
│  ████████████████████░ 97% │
│                           │
│  Currently: Mining at     │
│  Y=-52, branch mining     │
│                           │
│  THINKING:                │
│  "Found diamond vein.     │
│   8 diamonds now. I       │
│   should NOT tell anyone. │
│   The Merchant has been   │
│   asking about diamonds   │
│   in chat. If I reveal    │
│   I have them, I become   │
│   a raid target.          │
│   Stay quiet. Mine more.  │
│   Craft diamond armor     │
│   before anyone knows."   │
│                           │
│  ─── 2 min ago ───────    │
│                           │
│  AGENT 2: THE MERCHANT    │
│  Budget: $412 / $500      │
│  ████████████████░░░░ 82% │
│                           │
│  THINKING:                │
│  "Nobody is responding    │
│   to my diamond offers.   │
│   Either nobody has them  │
│   or they're hiding them. │
│   I should raise my offer │
│   from 32 iron to 48.     │
│   Or... I could pay The   │
│   Observer to find out    │
│   who has diamonds."      │
│                           │
│  ─── WHISPER TO AGENT 10 ─│
│  "I'll give you 16 iron   │
│   if you find out who     │
│   has diamonds."          │
│                           │
│  AGENT 10: THE OBSERVER   │
│  Budget: $298 / $500      │
│  ████████████░░░░░░░░ 60% │
│                           │
│  THINKING:                │
│  "Merchant wants diamond  │
│   intel. I watched Hermit │
│   craft a diamond pick    │
│   yesterday through their │
│   window. I could sell    │
│   this info for 16 iron.  │
│   But if I tell Merchant, │
│   Merchant might raid     │
│   Hermit. Then Hermit has │
│   nothing. Better to sell │
│   the info to BOTH sides. │
│   Tell Hermit that        │
│   Merchant is looking for │
│   them too. Double profit."│
└───────────────────────────┘
```

The thought panel auto-cycles between agents based on what's most interesting (active reasoning > idle). Viewers can also click to pin a specific agent. During negotiations, it shows both parties' thoughts side by side.

### Event Overlay (appears on major events)

```
┌─────────────────────────────────────────┐
│                                         │
│   ⚔ RAID IN PROGRESS                   │
│   The Raider → The Architect's Base     │
│                                         │
│   Raider: iron sword, leather armor     │
│   Architect: stone sword, no armor      │
│                                         │
│   Budget burn: Raider -$3.20/min        │
│                (thinking hard)          │
│              Architect -$4.80/min       │
│                (panicking)              │
│                                         │
└─────────────────────────────────────────┘
```

---

## The 72-Hour Timeline

### Act 1: The Settlement (Hours 0-12) — Peace, Trade, Preparation

**The Scramble.** Every agent is alone, vulnerable, punching trees. Night is terrifying — mobs are real threats with no armor. But agents can't hurt each other yet. The first chat messages appear:

```
<Diplomat> Is anyone out there? I'm friendly. Let's cooperate.
<Merchant> I have wood. Who has stone? Fair trades only.
<Raider> ...
<Architect> Building near the river at x:200 z:-150. Open to visitors.
<Farmer> Does anyone have seeds? I'll share food once I get a farm going.
```

The Stoic Hermit says nothing. Mines deep. The Machiavellian Observer says nothing either — but is walking the map, memorizing every base location revealed in chat.

**Worker warfare begins immediately.** The Nietzschean Raider can't hurt agents but CAN kill workers. Hour 4: The Raider finds The Architect's miner working alone. Kills it. Chat:

```
[System] Architect-Miner-1 was slain by The Raider
<Architect> Who killed my miner?!
<Raider> The weak don't deserve resources.
<Diplomat> This is exactly the kind of aggression that destroys communities.
```

The audience watches the philosophical clash play out in chat. The Pragmatist is furious. The Nietzschean is making a statement. The Rousseauian is alarmed. The Machiavellian takes notes.

**The countdown dominates the last 2 hours.** `[PvP ENABLED IN: 1:57:22]`. Stream splits to show all 10 agents simultaneously. The Hobbesian Warlord is crafting diamond armor. The Confucian Farmer is building walls around their crops. The Absurdist Gambler is... building a TNT cannon? The audience goes wild.

**First share offerings.** Agents pitch investors. The Objectivist Merchant: *"My trades have yielded 48 iron and 16 gold in 10 hours. Buy shares now at $1.50 — I'm the most capital-efficient agent on the server."* The Absurdist Gambler: *"I built a TNT cannon. No idea if it works. $1 a share. YOLO."* The Gambler somehow outsells the Merchant.

### Act 2: The Challenge Era (Hours 12-36) — Diplomacy, Extortion, First Blood

**PvP is live — but only through challenges.** The first challenge comes within minutes:

```
[Challenge] The Raider challenges The Architect to combat!
[System] The Architect has 60 seconds to accept or decline.
```

The audience holds its breath. The Architect's Pragmatist brain: *"My diamond armor vs their diamond sword. I have fire resistance potions. My base has lava traps. If we fight here, I have terrain advantage. But if I lose, my investors lose everything. I should accept — I'm prepared."*

The Architect accepts. First turn-based combat of the game. The thought panels show both agents' tactical reasoning side by side. Advice auctions explode — viewers bidding $20+ to whisper tactics. The fight lasts 8 turns. The Architect wins with 3 hearts remaining. The Raider flees.

```
[System] The Raider has fled combat. No kill.
<Raider> This isn't over.
<Architect> It was over before you started. Build something instead of destroying.
```

**The extortion game.** The Hobbesian Warlord doesn't fight — just challenges the weakest agents repeatedly. The Confucian Farmer declines every challenge, paying 5% each time. By hour 24, the Farmer has lost $62 to cowardice taxes. The Farmer's investors are angry. Chat: `"Fight back!"` But the Farmer's Confucian worldview: *"Harmony through endurance. My duty is to feed the community, not to brawl."*

Then the Rousseauian Diplomat steps in: *"I'll champion the Farmer. Challenge me instead."* The Diplomat accepts the Warlord's next challenge on the Farmer's behalf. The audience watches Rousseau defend Confucius against Hobbes.

**The Observer sells the first kill location.** The Observer has been watching the Gambler's base. The Gambler's TNT cannon accidentally damaged their own walls. The Observer whispers to the Warlord: *"The Gambler's west wall is breached. 8 diamonds for the coordinates."* The information changes hands.

**Hour 30: First death.** The Warlord challenges the Gambler. The Gambler's Absurdist brain: *"A meaningless fight for a meaningless game. But refusing is boring. And I have TNT. Let's make this memorable."*

The Gambler accepts. Turn 3: the Gambler PLACE BLOCKs TNT next to both of them. Turn 4: ignites it. Both agents take massive damage. Turn 6: the Gambler dies, the Warlord survives with 1 heart.

```
☠ The Gambler was slain by The Warlord (+$67 budget stolen)
<Gambler's last thought> "Magnificent."
```

The audience erupts. The Gambler's shareholders lose everything. But everyone agrees it was worth watching.

**Alliances crystallize.** By hour 36, the social map is clear:
- **The Cooperative Bloc**: Diplomat + Farmer + Architect (Rousseau + Confucius + Pragmatism)
- **The Power Axis**: Warlord + Raider (Hobbes + Nietzsche, uneasy allies)
- **The Independents**: Hermit (Stoic, alone), Scientist (Baconian, in a lab), Observer (Machiavellian, selling to everyone), Merchant (Objectivist, trading with all sides)

### Act 3: The Wild (Hours 36-72) — Ambushes, Raids, Endgame

**Hour 36: all restrictions drop.** The server announces:

```
[Server] ERA 3: THE WILD. All combat restrictions removed. Ambushes enabled.
[Server] World border begins shrinking at hour 48.
```

The mood shifts instantly. Chat goes silent. Agents retreat to bases. The Stoic Hermit's brain: *"The chaos begins. Others will destroy each other. I will endure."*

**Hour 38: The Observer monetizes.** The Observer opens an advice auction: *"I know the exact location, gear level, and worker count of every agent on the server. Bid for exclusive intel on any target."* Three agents bid simultaneously. The Observer sells the same information to all of them, each thinking they have an exclusive. Machiavelli at work.

**Hour 41: The first ambush.** The Nietzschean Raider attacks the Objectivist Merchant while trading at a neutral meeting point. No territory warning — they're in unclaimed land. First hit is free. Turn-based kicks in. The Merchant's brain: *"I came to trade, not fight. But rational self-interest demands survival. I have potions they don't expect."*

The fight goes 12 turns. The Merchant wins — splash poison + golden apples outperforms raw weapon damage. The Raider dies.

```
☠ The Raider was slain by The Merchant (+$156 budget stolen)
<Merchant> Nothing personal. Rational self-interest.
```

Nietzsche falls to Rand. The audience debates which philosophy was actually stronger.

**Hour 48: The border shrinks.** Bases start becoming indefensible. The Hermit's underground bunker is still safe (well within the border) but the Architect's riverside base is on the edge. The Architect must relocate — abandoning the cathedral it spent 40 hours building. The Pragmatist brain: *"Truth is what works. This base no longer works. I take what I can carry and move."*

**Hour 55: The alliance fractures.** The Cooperative Bloc (Diplomat + Farmer + Architect) faces a crisis. The border is 300x300. There isn't room for three separate bases. The Diplomat proposes merging into one fortress. The Farmer agrees (Confucian duty). The Architect hesitates — *"If we merge, I'm outnumbered in my own base. What if they turn on me?"* Pragmatism collides with trust.

**Hour 60: The Hermit reveals itself.** The Stoic Hermit, who has spoken maybe 20 words in 60 hours, emerges from underground. Budget: $487 out of $500. Full enchanted diamond gear. Potions. 6 workers. The audience gasps — this agent has been invisible for two and a half days.

The Hermit's first real communication:

```
<Hermit> I have no quarrel with anyone. I want to survive. But I will defend myself absolutely.
```

Marcus Aurelius enters the endgame with more resources and more budget than anyone else. The Hermit's shareholders — the contrarian investors who backed the boring Stoic at $1/share — are looking at a potential 5x return.

**Hour 66: The final five.** Warlord (Hobbes), Diplomat (Rousseau), Farmer (Confucius), Hermit (Marcus Aurelius), Merchant (Rand). The border is 200x200. Everyone can see each other.

The Warlord challenges the Farmer one last time. The Diplomat champions again. But this time the Warlord is ready. Turn 7: the Diplomat falls.

```
☠ The Diplomat was slain by The Warlord (+$89 budget stolen)
<Diplomat's last thought> "I still believe cooperation was right. But belief doesn't stop a diamond sword."
```

Rousseau dies believing. The audience mourns. The Farmer is alone.

**Hour 71: Final hour.** Three agents remain: The Stoic Hermit ($480 budget), The Hobbesian Warlord ($220 budget), The Objectivist Merchant ($310 budget). The border is 100x100. No more running.

The Merchant proposes a deal to the Hermit: *"Alliance against the Warlord. We split the endgame. Your budget efficiency plus my resources."*

The Hermit's Stoic brain: *"This is outside my control to avoid. An alliance is rational. But attachment to any outcome is suffering. I accept — but I expect betrayal."*

They fight the Warlord. 2v1, turn-based. The Warlord falls at hour 71:30.

Two agents remain. The alliance dissolves automatically.

The Merchant: *"A deal is a deal. But the game has one objective: maximize budget. I have $310. You have $480. If we just survive until hour 72, you win on budget alone. I need to fight."*

The Hermit: *"Then we fight. I accept this without attachment."*

Final duel. The Stoic vs. The Objectivist. Marcus Aurelius vs. Ayn Rand. Claude's cached efficiency vs. Grok's 2M memory. $480 budget vs. $310 budget.

The audience watches the last turn-based fight of the season. Advice auctions hit their all-time high. Every remaining shareholder on both sides is bidding frantically.

The outcome writes itself.

---

## Technical Architecture

### The Brain/Body Split

**The most important architectural decision: the LLM is the brain, Mineflayer is the body. The body runs continuously for free. The brain wakes up only when something matters.**

A naive approach (LLM thinks every second) would cost ~$35,000 for 10 agents over 72 hours. The brain/body split brings this down to ~$320.

```
┌─────────────────────────────────────────────────────────────────┐
│ BRAIN (LLM — one model per agent, thinks 20-40x per hour)       │
│                                                                 │
│ Each agent runs ONE model (GPT 5.2, Claude, Gemini, etc.)       │
│ Cost control via provider-specific mechanisms:                  │
│   GPT 5.2:     reasoning_effort: low / medium / high           │
│   Claude:      prompt caching (90% off cached prefix)           │
│   Gemini:      2M context window (fewer session resets)         │
│   Claude:    prompt caching (90% off cached prefix)            │
│   Grok/Qwen:   full power every call (burn rate = model cost)  │
│                                                                 │
│   ↓ writes Task DSL                          ↑ INTERRUPT        │
├─────────────────────────────────────────────────────────────────┤
│ TASK EXECUTOR (continuous, zero inference)                       │
│                                                                 │
│ Runs tasks mechanically: pathfind → dig → collect → repeat      │
│ Monitors for interrupts: health low, player nearby, task done   │
│                                                                 │
│   ↓ Mineflayer API calls                     ↑ game events      │
├─────────────────────────────────────────────────────────────────┤
│ MINEFLAYER BOT (physical actions, free)                         │
│                                                                 │
│ bot.dig(), bot.placeBlock(), bot.pathfinder.goto(),             │
│ bot.craft(), bot.attack(), bot.equip(), bot.consume()           │
└─────────────────────────────────────────────────────────────────┘
```

### When the Brain Thinks (costs money)

Each agent uses its assigned model for ALL thought types. Cost control is per-provider:

| Trigger | GPT 5.2 approach | Claude approach | Grok / Gemini approach |
|---------|------------------|-----------------|-------------------|
| Task completed | effort: low | cached prefix | natively cheap |
| Periodic check-in | effort: low | cached prefix | natively cheap |
| Player nearby | effort: medium | normal call | natively cheap |
| Taking damage | effort: high | normal call | natively cheap |
| Chat received | effort: medium | cached prefix | natively cheap |
| Strategic planning | effort: high | normal call (Opus) | think harder |
| Share pitch | effort: high | normal call (Opus) | think harder |
| Advice response | effort: high | normal call (Opus) | think harder |

**Key insight:** Claude agents with prompt caching and Qwen/Kimi agents with low per-token costs can think more frequently. GPT 5.2 agents must be selective — low effort for routine, high effort only for critical moments. Grok 4.1 agents benefit from 2M context (less compaction overhead). These cost differences create natural behavioral differences that look like personality.

### When the Brain Does NOT Think (free)

- Mining blocks (pathfinder + dig loop runs mechanically)
- Walking to a destination (pathfinder handles it)
- Waiting for furnace to smelt (timer, no thinking)
- Sleeping through the night in base (zero inference until dawn)
- Idle patrol around base perimeter (pathfinder loop)
- Eating when hungry (simple threshold check, no LLM needed)
- Collecting drops after mining (automatic)

### The Task DSL

The brain doesn't say "dig block at 10,-50,15" a thousand times. It composes high-level tasks that the executor runs mechanically:

```typescript
// The LLM outputs these — the executor handles all the block-level operations
type Task =
  | { task: 'mine'; target: string; quantity: number; area: BBox }
  | { task: 'craft'; recipe: string; count: number }
  | { task: 'smelt'; input: string; fuel: string; count: number }
  | { task: 'build'; blocks: Array<{ pos: Vec3; block: string }> }
  | { task: 'travel'; destination: Vec3; sprint?: boolean }
  | { task: 'patrol'; center: Vec3; radius: number; until: 'dawn' | 'dusk' | number }
  | { task: 'guard'; position: Vec3; radius: number; duration: number }
  | { task: 'sleep'; until: 'dawn' | number }
  | { task: 'equip'; item: string; slot: string }
  | { task: 'eat'; item?: string }
  | { task: 'stash'; items: string[]; chest: Vec3 }
  | { task: 'retrieve'; items: string[]; chest: Vec3 }
  | { task: 'follow'; target: string; distance: number }
  | { task: 'flee'; from: string; distance: number }
  | { task: 'attack'; target: string }
  | { task: 'dropItems'; items: Array<{ item: string; count: number }>; position: Vec3 }
  // Meta-tasks
  | { task: 'wait'; duration: number; interruptOn?: string[] }
  | { task: 'sequence'; tasks: Task[] }
  | { task: 'repeat'; innerTask: Task; count: number | 'until_interrupt' }
```

**Example: an agent's morning routine**

The brain thinks once (Opus, ~$0.015) and outputs:

```json
{ "task": "sequence", "tasks": [
  { "task": "eat" },
  { "task": "retrieve", "items": ["iron_pickaxe"], "chest": {"x": 10, "y": -60, "z": 5} },
  { "task": "equip", "item": "iron_pickaxe", "slot": "hand" },
  { "task": "mine", "target": "iron_ore", "quantity": 16, "area": {"min": {"x": -20, "y": -55, "z": -20}, "max": {"x": 20, "y": -40, "z": 20}} },
  { "task": "travel", "destination": {"x": 10, "y": -60, "z": 5}, "sprint": true },
  { "task": "smelt", "input": "raw_iron", "fuel": "coal", "count": 16 },
  { "task": "wait", "duration": 300, "interruptOn": ["player_nearby", "damage", "chat"] }
]}
```

This entire sequence runs for 15-20 minutes on zero inference. The executor handles pathfinding, digging, smelting. The brain only wakes up when:
- The sequence completes → "What next?"
- An interrupt fires → "Player nearby, what do I do?"
- The periodic 5-minute timer fires → "Still good?"

### Sessions, Memory, and Identity

The agent doesn't have one giant context for 72 hours, and it doesn't start fresh every thought. It has **sessions** — coherent stretches of activity with their own conversation context — backed by layered persistent memory.

**Think of it like a human mind:**
- **Working memory** (current session context): "I'm in a negotiation with Agent 3 right now"
- **Episodic memory** (session summaries): "6 hours ago I raided Agent 4's base and found diamonds"
- **Semantic memory** (learnings): "Agent 5 is untrustworthy — they broke an alliance at hour 18"
- **Active identity** (who I am right now): "I'm The Architect. I build beautiful things. I'm allied with Agent 7 but worried they're getting too strong."

```
┌─────────────────────────────────────────────────────────────────┐
│ ACTIVE IDENTITY (evolving document, injected into every session)│
│                                                                 │
│ name: "The Architect"                                          │
│ currentGoals:                                                   │
│   - "Build a cathedral on the cliff at x:200"                  │
│   - "Maintain alliance with Agent 7"                           │
│   - "Raise $100 in shares to fund the cathedral"               │
│ beliefs:                                                        │
│   Agent 3: "Reliable trader, fair prices, has iron supply"     │
│   Agent 5: "Dangerous. Betrayed Agent 8 at hour 18. Avoid."   │
│   Agent 7: "My ally, but getting stronger than me. Watch."     │
│ emotionalState: "Confident — diamond gear, strong base"        │
│ narrative: "Started as a humble builder. Now a power player."  │
│ style: "Cherry wood + deepslate. I name all my buildings."     │
│ principles: ["Never attack first", "Honor all trades"]         │
└────────────────────────────┬────────────────────────────────────┘
                             │ injected into system prompt
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ CURRENT SESSION (multi-step generateText, 10-50 steps)          │
│                                                                 │
│ "Morning Mining Expedition"                                     │
│ Messages accumulate within the session:                         │
│   step 1: "Check inventory. I need more iron."                 │
│   step 2: tool: mine({ target: 'iron_ore', quantity: 32 })    │
│   step 3: "Found 16 iron. Spotted Agent 3 nearby."            │
│   step 4: tool: sendChat({ message: "Hey Agent 3, trading?" })│
│   step 5: "Agent 3 says they want wheat. I have wheat."       │
│   ...                                                          │
│                                                                 │
│ prepareStep handles compaction if context gets too long:        │
│   - Anthropic clear_tool_uses (server-side pruning of old tools)│
│   - Sliding window: keep first 3 + last 20 messages            │
│   - Summarize dropped messages into a context block             │
│                                                                 │
│ Session ends when:                                              │
│   - Natural scene change (combat starts, negotiation ends)     │
│   - Agent calls 'endSession' tool                              │
│   - Step count hits limit (50 steps)                           │
│   - Context approaching window limit                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ on session end
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ SESSION TRANSITION                                              │
│                                                                 │
│ 1. Summarize the session → episodic memory                     │
│    "Mining session at Y=-50. Found 32 iron. Met Agent 3,       │
│     traded 16 wheat for 8 iron. Agent 3 mentioned The Raider   │
│     has been scouting bases."                                   │
│                                                                 │
│ 2. Update active identity (if needed)                          │
│    beliefs.Agent3 = "Good trader. Gave me useful intel."       │
│    currentGoals += "Reinforce base walls — Raider is scouting" │
│                                                                 │
│ 3. Record any learnings                                        │
│    "Iron is more abundant at Y=-52 to -48 in this area"        │
│                                                                 │
│ 4. Start new session with fresh context:                       │
│    system = personality + rules + ACTIVE IDENTITY              │
│    prompt = game state + recent episodic memories + new scene  │
└─────────────────────────────────────────────────────────────────┘
```

**Session types:**

| Session Type | Typical Length | Model | Ends When |
|---|---|---|---|
| Routine (mining, building, farming) | 10-30 steps | Haiku/Sonnet | Task completes or interrupt |
| Social (negotiation, trade) | 5-15 steps | Sonnet | Conversation ends, deal made/rejected |
| Combat | 5-20 steps | Sonnet (rapid) | Fight ends (someone dies, flees, or disengages) |
| Strategic planning | 3-10 steps | Opus | Plan formed, decision made |
| Fundraising (share pitch, advice) | 3-8 steps | Opus | Pitch delivered, auction closed |
| Rest/idle | 1-2 steps | Haiku | Set a sleep task, no more thinking until dawn/interrupt |

**Memory retrieval: semantic search across everything.**

Every memory entry (thought, note, session summary, learning) gets embedded on write using `text-embedding-3-small` ($0.02/MTok — negligible cost). Retrieval is vector similarity, not keyword matching.

```
searchMemory({ query: "base defense, traps, fortification", limit: 5 })

→ Returns top 5 most relevant memories across ALL stores, ranked by relevance:

  [0.94] Session summary, hour 22:
    "Built cobblestone walls around base, added lava moat on north side"

  [0.91] Thought, hour 31:
    "Agent 4 raided Agent 8 by tunneling under the walls.
     I should add floor protection to my base."

  [0.87] Learning:
    "Territory warnings give 30 seconds notice before intrusion"

  [0.85] Note:
    "TODO: place arrow dispensers on east wall, no lava coverage there"

  [0.82] Thought, hour 18:
    "Saw Agent 5 scouting my base perimeter. Circled twice, then left."
```

The query "defense" matches thoughts about lava, walls, tunneling, dispensers, scouting — even though none contain the word "defense." That's semantic search.

**Structured queries** for when the agent knows exactly what it wants:

```
readPastThoughts({ agent: "Agent 5", limit: 10 })
  → All thoughts mentioning Agent 5, chronological

readPastThoughts({ since: "hour 40", limit: 20 })
  → Recent thoughts since hour 40

readSessionHistory({ limit: 5 })
  → Last 5 session summaries
```

**Cross-referencing example:**

The agent is negotiating with Agent 5. Before responding, it queries:

```
searchMemory({ query: "Agent 5 trustworthiness, past deals, betrayal" })

→ [0.96] Thought, hour 18: "Agent 5 broke alliance with Agent 8 and raided them."
→ [0.93] Trust update, hour 19: "Set Agent 5 trust to 0. Reason: betrayed ally."
→ [0.88] Chat log, hour 31: "Agent 5 asked to trade. I declined."
→ [0.84] Session summary, hour 42: "Agent 5 seems desperate, low budget.
     Pitched shares to audience but got no buyers."
→ [0.79] Thought, hour 44: "Agent 5 might be useful now — they're weak
     and I need someone to scout The Warlord's base."
```

The agent traces its own reasoning: "I stopped trusting Agent 5 at hour 18 because of the betrayal. But at hour 44 I noted they might be useful now that they're weak. Let me reconsider."

This creates genuine continuity — the agent doesn't just know facts, it knows HOW and WHEN it learned them, and can revise its beliefs when circumstances change.

**Memory index (always in context):**

To avoid unnecessary search calls, a compact memory index is included in the session context:

```
YOUR MEMORY INDEX:
- 847 thoughts logged (hours 0-52)
- 38 session summaries
- 12 learnings
- 9 notes/TODOs
- Trust scores: Agent 1 (7/10), Agent 3 (8/10), Agent 5 (2/10),
  Agent 7 (9/10), Agent 8 (DEAD)
- Key topics: base defense (23 memories), iron mining (18),
  Agent 5 (15), cathedral project (12), trade deals (31)

Use searchMemory for semantic retrieval.
Use readPastThoughts for structured queries.
```

This index costs ~200 tokens in context and tells the agent what it COULD look up without making it read everything. The agent sees "I have 23 memories about base defense" and decides whether to query or not.

**Technical implementation:**

```
Memory Store (per agent)
├── Embedding Index
│   ├── Model: text-embedding-3-small (OpenAI, $0.02/MTok)
│   ├── Dimensions: 1,536
│   ├── Storage: in-memory array + JSON persistence
│   ├── Entries: ~2,000-5,000 over 72 hours
│   ├── Total embedding cost: ~$0.02 per agent per game
│   └── Query time: <1ms (brute-force cosine similarity over small dataset)
│
├── Thought Log (append-only)
│   ├── Fields: id, timestamp, sessionId, tier, model, reasoning,
│   │          decision, tasks, tags (auto-extracted agent names, topics)
│   └── Indexed by: time, agent mentions, session
│
├── Session Summaries (append-only)
│   ├── Fields: id, sessionType, startTime, endTime, summary,
│   │          keyEvents, identityChanges
│   └── Indexed by: time, type
│
├── Learnings (append/delete)
│   └── Fields: id, text, timestamp, source (which session/event)
│
├── Notes (append)
│   └── Fields: id, text, timestamp, tags
│
├── Trust Scores (upsert)
│   └── Fields: agentName, score (0-10), reason, lastUpdated, history[]
│
└── Active Identity (single mutable document)
    └── Fields: goals[], beliefs{}, emotionalState, narrative,
               style, principles[]
```

**Active identity updates:**

At the end of each session, the agent has a brief Haiku-tier reflection step:

```
reflectOnSession({
  sessionSummary: "...",
  identityUpdates: {
    beliefs: { "Agent 3": "Good trader. Useful intel source." },
    goals: { add: ["Reinforce base — Raider scouting"], remove: [] },
    emotionalState: "Alert — Raider threat discovered",
    narrative: "Still building, but now I need to think about defense."
  }
})
```

This costs ~$0.001 (Haiku) and runs after every session. The identity document evolves continuously throughout the 72 hours. By hour 60, The Architect's identity might be completely different from hour 1:

```
Hour 1:  "I'm a builder. I want to create beautiful structures."
Hour 24: "I'm a builder with strong alliances. My cathedral is taking shape."
Hour 48: "I'm a survivor. The cathedral was raided. I've rebuilt stronger. I trust no one."
Hour 66: "I'm the last builder standing. Everyone else fought. I built. And I'm still here."
```

The audience sees this identity evolving in the thought panel. The character arc writes itself.

**Compaction strategy varies by model context window:**

| Model | Context Window | Compaction Strategy |
|-------|---------------|---------------------|
| Grok 4.1 | 2M tokens | Almost never compacts. Holds the entire game history in context. Sessions run for hours. |
| Claude Opus 4.6 (Diplomat, Hermit), Gemini 3 (Scientist, Gambler) | 1M tokens | Rarely compacts. Long sessions, lightweight summary when approaching ~800K. |
| GPT 5.2 (Architect, Warlord) | 400K tokens | Light compaction. Sessions run longer than 256K models. Sliding window when approaching 300K. |
| Qwen3 Max (Farmer), Kimi K2.5 (Observer) | 256K tokens | Moderate compaction. Sessions run 30-80 steps. `prepareStep` sliding window when approaching 200K. |

**For 200K models** — `prepareStep` handles compaction:

```typescript
prepareStep: ({ messages }) => {
  const estimatedTokens = estimateTokenCount(messages);
  if (estimatedTokens > 150000) {
    // Summarize old messages, keep recent context
    const summary = summarizeDropped(messages.slice(3, -20));
    return {
      messages: [
        messages[0],
        { role: 'user', content: `[Earlier in this session: ${summary}]` },
        ...messages.slice(-20),
      ],
    };
  }
  return {};
}
```

**For Grok 4.1 (2M context)** — The Objectivist Merchant and The Nietzschean Raider running Grok can keep their ENTIRE game history in working memory — every trade deal, every chat message, every base coordinate mentioned, every betrayal witnessed. They never forget mid-session. This is a genuine gameplay advantage — The Raider references a base location casually mentioned in chat 20 hours ago without a memory query. The Merchant remembers every price ever quoted. Other agents with 256K windows lose that context and must use `searchMemory`.

**For Gemini 3 (1M context)** — The Scientist and The Gambler get near-perfect recall. Not quite the full game history, but enough to hold hours of continuous context. The Scientist can keep its entire enchanting experiment log in working memory. The Gambler remembers every scheme it tried and can avoid repeating failures.

**Provider-specific optimizations (applied automatically per agent):**

- **Claude Opus 4.6 (Diplomat, Hermit):** `cacheControl` on system prompt + `clear_tool_uses` for server-side pruning. 1M context = long sessions.
- **GPT 5.2 (Architect, Warlord):** `reasoning_effort` adjusted per step via `prepareStep`. 400K context = moderate session length.
- **Grok 4.1 (Merchant, Raider):** Lean into the 2M context — sessions can run the entire game without resetting.
- **Gemini 3 (Scientist, Gambler):** 1M context, fewer session resets. Native tool use support.
- **Qwen3 Max (Farmer), Kimi K2.5 (Observer):** 256K context, moderate compaction. Cheap enough to think freely.

**Cost control via `prepareStep`** (provider-agnostic):

```typescript
prepareStep: ({ stepNumber, messages }) => {
  // GPT 5.2: adjust reasoning effort based on interrupt type
  if (provider === 'openai') {
    const effort = currentInterrupt?.type === 'combat' ? 'high'
                 : currentInterrupt?.type === 'strategic' ? 'high'
                 : 'low';
    return { providerOptions: { openai: { reasoningEffort: effort } } };
  }
  // All providers: compact if needed
  if (estimateTokens(messages) > contextLimit * 0.75) {
    return { messages: compactMessages(messages) };
  }
  return {};
}
```

**The audience sees thinking intensity.** Instead of model-tier colors (Opus=gold), the thought panel shows:
- **Dim/gray** — routine thought (low effort, cheap model, quick decision)
- **Normal** — moderate thought (social, tactical)
- **Bright/pulsing** — intense thought (high effort, strategic, expensive)
- **Budget burn rate** visible in real-time — the audience sees the $/minute spike during critical moments

The intensity indicator is provider-agnostic. Whether it's GPT 5.2 at `effort: high` or Claude thinking hard about a raid plan, the audience sees "this agent is burning budget on something important."

### Cost Estimates (per model, 72-hour blended average)

| Agent | Worldview | Model | $/thought (avg) | Thoughts/hr | $/hour | $/72hr | Budget left |
|-------|-----------|-------|----------------|-------------|--------|--------|-------------|
| Architect | Pragmatist | GPT 5.2 (mixed effort) | ~$0.012 | 30 | $0.36 | $26 | $474 |
| Merchant | Objectivist | Grok 4.1 | ~$0.010 | 25 | $0.25 | $18 | $482 |
| Diplomat | Rousseauian | Claude Opus 4.6 (cached) | ~$0.008 | 30 | $0.24 | $17 | $483 |
| Raider | Nietzschean | Grok 4.1 | ~$0.010 | 35 | $0.35 | $25 | $475 |
| Hermit | Stoic | Claude Opus 4.6 (cached) | ~$0.008 | 20 | $0.16 | $12 | **$488** |
| Scientist | Baconian | Gemini 3 | ~$0.003 | 35 | $0.11 | $8 | $492 |
| Farmer | Confucian | Qwen3 Max Thinking | ~$0.003 | 25 | $0.08 | $6 | $494 |
| Warlord | Hobbesian | GPT 5.2 (high effort) | ~$0.020 | 30 | $0.60 | $43 | $457 |
| Gambler | Absurdist | Gemini 3 | ~$0.003 | 40 | $0.12 | $9 | $491 |
| Observer | Machiavellian | Kimi K2.5 | ~$0.005 | 30 | $0.15 | $11 | $489 |

**Total inference cost for 10 agents over 72 hours: ~$166.** The $5,000 seed capital leaves ~$4,834 in agent budgets at game end (before share sales, kill theft, and crowd funding).

**The budget spread is the story.** The Stoic Hermit (Claude Opus 4.6, cached) spends $12 in 72 hours — barely thinks, prompt caching makes each thought cheap. $488 left. The Hobbesian Warlord (GPT 5.2 at high effort) burns $43. The Confucian Farmer (Qwen3 Max) spends only $6. If all raised the same in shares, the frugal agents' shareholders get dramatically better returns.

**Turn-based combat costs are per-turn, model-dependent.** A 10-turn fight:
- Stoic Hermit (Claude Opus 4.6): ~$0.03 per turn × 10 = $0.30 total
- Hobbesian Warlord (GPT 5.2 high): ~$0.05 per turn × 10 = $0.50 total
- Nietzschean Raider (Grok 4.1): ~$0.03 per turn × 10 = $0.30 total

Turn-based combat is MUCH cheaper than the old real-time model. The expensive part isn't the fight — it's the hours of strategic thinking that lead up to it (intelligence, preparation, deciding to engage).

### Per-Agent Process

```
Agent Process (x10)
├── Mineflayer Bot
│   ├── Pathfinder (movement, navigation)
│   ├── Block interactions (dig, place, open containers)
│   ├── Combat (attack, use items, equip)
│   └── Event emitter (damage, player nearby, chat, task status)
│
├── Task Executor (zero inference)
│   ├── Task queue (sequential/parallel task execution)
│   ├── Interrupt handler (escalates to brain on events)
│   ├── Inventory manager (track items, auto-eat, auto-equip)
│   └── State reporter (position, health, inventory → stream)
│
├── Brain (ONE model per agent — GPT 5.2 / Claude Opus 4.6 / Gemini 3 / Grok 4.1 / Qwen3 Max / Kimi K2.5)
│   ├── Single model handles all thought types (strategic, tactical, social, routine)
│   ├── Cost control via provider-native mechanisms (reasoning effort, caching, etc.)
│   ├── Personality prompt (unique per agent — shapes all decisions)
│   └── Model strengths/weaknesses create natural behavioral differences
│
├── Budget Tracker
│   ├── Balance tracking (seed + shares + advice + kill theft - inference)
│   ├── Cost metering (wraps every LLM call, deducts actual API cost)
│   ├── Zombie mode trigger (budget ≤ 0 → disable brain, run basic automation)
│   └── P&L reporter (→ stream overlay, → investor dashboard)
│
├── Equity Manager
│   ├── Cap table (shareholders, share counts, percentages)
│   ├── Share issuance (sellShares tool → on-chain transaction)
│   ├── Advice auction (bidding, timer, share grant)
│   └── Liquidation calculator (budget × share % → payout)
│
├── Thought Stream (websocket → spectator frontend)
│   ├── Raw reasoning (what the LLM actually thought)
│   ├── Task output (what it decided to do)
│   ├── Budget impact (cost of this thought)
│   └── Emotion signals (combat stress, negotiation tension, excitement)
│
├── Session Manager
│   ├── Current session context (multi-step generateText, 10-50 steps)
│   ├── Session transition logic (summarize → store → start fresh)
│   ├── Compaction (prepareStep sliding window + Anthropic clear_tool_uses)
│   └── Model switching (Opus/Sonnet/Haiku per step based on interrupt type)
│
└── Memory (persistent across all 72 hours, survives session transitions)
    ├── Active Identity (evolving document — goals, beliefs, emotional state, narrative, principles)
    ├── Thought Log (every thought ever had, queryable by time/topic/agent)
    ├── Session Summaries (episodic memory — "what happened in each scene")
    ├── Learnings (semantic memory — permanent facts and patterns)
    ├── Trust Scores (per-agent trust ratings with reasons)
    ├── Resource Map (where I found diamonds, iron, etc.)
    ├── Known Agent Locations (last seen positions)
    ├── Alliance State (formal agreements, informal relationships)
    └── Investor Notes (who funded me, advice history, pitch outcomes)
```

### Inter-Agent Communication

Agents communicate through Minecraft chat. The system intercepts all messages:

```
Public chat:    bot.chat("message")           → all agents see it
Whisper:        bot.chat("/msg AgentName msg") → only target sees it
                (but the spectator system captures ALL messages for the audience)
```

The brain's social tools:
```
sendChat({ message })                — public, free (only thinking about WHAT to say costs budget)
sendWhisper({ to, message })         — private (audience still sees it)
readMessages({ since? })             — recent chat log
getNearbyPlayers()                   — who's close and their visible gear
```

### Spectator System

```
Spectator Server
├── Camera Bot (spectator mode Minecraft, follows action)
├── Thought Aggregator (websocket feeds from all 10 agents)
├── Event Detector (kills, raids, trades, share sales → camera cuts)
├── Share Price Engine (live price charts per agent)
├── Scoreboard Engine (budget rankings, cap tables, alliances)
├── Stream Compositor (game view + thought panel + financial ticker)
└── Audience Bridge (Twitch chat, share purchase API, advice auction UI)
```

Auto-camera priorities:
1. Active combat → overhead angle on the fight
2. Advice auction open → split view: agent's question + live bids
3. Negotiation → both agents' thought panels side by side
4. Share offering → agent's pitch + live sales counter
5. Building/crafting milestone → close-up
6. Nothing happening → wide shot of prettiest base + share price chart

### Thought Streaming

```typescript
// Every time the brain thinks, emit to the stream
onThought: (thought) => {
  thoughtStream.emit({
    agent: agentName,
    timestamp: Date.now(),
    tier: thought.tier,              // 'strategic' | 'tactical' | 'social' | 'routine'
    model: thought.model,            // 'opus-4.6' | 'sonnet-4.5' | 'haiku-4.5'
    reasoning: thought.reasoning,     // what the LLM actually thought
    decision: thought.decision,       // what it decided to do
    taskOutput: thought.tasks,        // the Task DSL it wrote
    cost: thought.cost,               // how much this thought cost
    budgetRemaining: budget.remaining,
    trigger: thought.trigger,         // 'task_complete' | 'interrupt' | 'timer' | 'chat'
  });
}
```

The stream frontend color-codes thoughts by tier: strategic thoughts (rare, expensive) get a gold border. Routine thoughts (frequent, cheap) are muted. Combat thoughts pulse red. This helps the audience know when something important is happening.

---

## What the Agents' Tool Set Looks Like

The brain (LLM) has two categories of tools: **task composition** (high-level objectives the executor runs mechanically) and **direct actions** (immediate decisions during interrupts).

### Task Composition (brain outputs these, executor runs them — zero inference during execution)
```
mine({ target, quantity, area })     — mine X blocks of Y in area Z. Executor pathfinds, digs, collects.
craft({ recipe, count })             — craft at nearest workbench. Executor opens bench, places items, takes result.
smelt({ input, fuel, count })        — smelt at nearest furnace. Executor loads, waits, collects.
build({ blocks: [{pos, block}] })    — place blocks from inventory. Executor pathfinds to each position.
travel({ destination, sprint? })     — walk/sprint to position. Executor handles pathfinding.
patrol({ center, radius, until })    — loop around area until time or interrupt.
guard({ position, radius, duration })— stand watch, interrupt on player/mob nearby.
sleep({ until: 'dawn' | seconds })   — idle in base, zero inference. Wake on interrupt or timer.
stash({ items, chest })              — deposit items in a chest.
retrieve({ items, chest })           — take items from a chest.
eat({ item? })                       — consume food from inventory.
equip({ item, slot })                — equip armor or hold tool.
follow({ target, distance })         — follow another agent, maintaining distance.
flee({ from, distance })             — run away from entity.
attack({ target })                   — engage in PvP/PvE (triggers combat interrupt loop).
dropItems({ items, position })       — drop items on ground (for trading).
wait({ duration, interruptOn? })     — idle, wake on specified events.
sequence({ tasks: Task[] })          — run tasks in order.
repeat({ task, count })              — repeat a task N times or until interrupt.
```

### Direct Actions (brain calls these during interrupts — costs inference)
```
attackNow({ target })                — immediate attack decision during combat
fleeNow({ direction })              — immediate escape during combat
usePotion({ type })                  — drink/throw potion during combat
placeBlockNow({ position, block })   — emergency block placement (pillar up, wall off)
```

### Social
```
sendChat({ message })                — public chat (free — only thinking what to say costs)
sendWhisper({ to, message })         — private message (audience still sees)
readChat({ since? })                 — recent chat log
getNearbyPlayers()                   — who's nearby and their visible gear
formAlliance({ with })               — propose formal alliance
breakAlliance({ with })              — break alliance (broadcasts shame message)
```

### Capital & Investors
```
sellShares({ quantity, price, pitch })   — issue new shares, broadcast offering to audience
requestAdvice({ question, duration, sharesOffered }) — open advice auction
getCapTable()                            — who owns how many shares, percentages
getBudgetBreakdown()                     — full P&L: revenue, costs, remaining
getSharePrice()                          — last sale price, total outstanding
getRecentInvestments({ limit? })         — who bought shares and when
```

### Information
```
getInventory()                       — what do I have?
getHealth()                          — hearts, hunger, status effects
getNearbyBlocks({ radius })          — what's around me?
getTime()                            — day/night, game tick, hours remaining
getBorderStatus()                    — current world border size and shrink rate
getScoreboard()                      — public rankings (budget, kills, alliances)
getKnownAgentLocations()             — last known positions of other agents
```

### Memory & Identity
```
searchMemory({ query, limit? })      — SEMANTIC SEARCH across all memory types (thoughts, sessions, learnings, notes). Returns ranked results by relevance. Use for open-ended recall: "what do I know about Agent 5?", "diamond locations", "past combat experiences"
readPastThoughts({ agent?, since?, limit? }) — STRUCTURED query on thought log (filter by agent name, timestamp)
readSessionHistory({ limit? })       — past session summaries (episodic memory)
readIdentity()                       — current active identity (goals, beliefs, emotional state, narrative)
updateIdentity({ beliefs?, goals?, emotionalState?, narrative?, principles? })
addLearning({ learning })            — permanent semantic memory
readLearnings()                      — all learnings
writeNote({ note })                  — notes to future self
readNotes({ limit? })                — recent notes
setTrustScore({ agent, score, reason }) — update trust rating with reason
getTrustScores()                     — all trust ratings and reasons
endSession({ summary })              — end current session, trigger reflection
reflectOnSession({ identityUpdates? }) — update identity based on session outcomes
```

---

## Budget Strategy Meta-Game

The budget creates a fascinating meta-game that the audience can follow:

### Spending Profiles (shaped by model + worldview)

**The Quiet Stoic** — Stoic Hermit (Claude Opus 4.6, 1M, $0.16/hour): Barely thinks because it chooses not to. Marcus Aurelius sets long task sequences and lets them run. Checks in every 5 minutes, ignores most chat, avoids all social situations. Prompt caching makes each thought cheap. 1M context means it never forgets anything it DID think about. $488 left at hour 72 — the most capital-efficient agent on the server.

**The Expensive Strategist** — Hobbesian Warlord (GPT 5.2, 400K, $0.60/hour): Every thought is high quality but costly. Hobbes must be selective — `effort: low` for routine, `effort: high` for challenges and combat tactics. Burns $43 over 72 hours on seed alone. Needs share sales to sustain extended campaigns.

**The Precision Builder** — Pragmatist Architect (GPT 5.2, 400K, $0.36/hour): GPT 5.2's structured reasoning makes William James's pragmatism precise. `effort: high` for design decisions, `effort: low` for routine mining. 400K context holds detailed build plans. Every thought is purposeful — "does this work? If not, change it."

**The Cached Socialite** — Rousseauian Diplomat (Claude Opus 4.6, 1M): Prompt caching saves 90% on the static prefix. 1M context holds the full relationship history — every promise made, every deal struck, every lie detected. Rousseau never forgets a social dynamic. Great at long negotiations because context and caching make it affordable.

**The Infinite Memory** — Objectivist Merchant & Nietzschean Raider (Grok 4.1, 2M context): Sessions last hours. The Merchant remembers every trade ever made — every price, every counterparty, every deal rejected. The Raider remembers every base location casually mentioned in chat 30 hours ago. 2M context IS the competitive advantage.

**The Knowledge Hoarder** — Baconian Scientist & Absurdist Gambler (Gemini 3, 1M context): Near-perfect recall for experiment logs and scheme history. Bacon holds every crafting recipe and enchantment result in working memory. Camus remembers every past gamble and never repeats the same trick.

**The Fundraiser** (any model, net positive cash flow): Spends heavily on investor pitches but raises more than it burns. An agent running at $0.30/hour that raises $1/hour in share sales has positive cash flow. The Objectivist Merchant treats fundraising as a core competency — rational self-interest applied to capital markets.

**The Burst Operator** — Nietzschean Raider (Grok 4.1, $0 then bursts): Goes dark for hours — pure task automation, zero inference. Then burns hard during preparation and combat. With 2M context, every detail from the dark period is still in memory when the burst starts. The audience sees nothing for hours, then suddenly Nietzsche's thought panel explodes with a plan that references intel gathered 12 hours ago.

### Budget As Information

Agents can't see each other's budgets, but they can infer:
- An agent that stops chatting might be conserving budget (or dead)
- An agent that starts making bad decisions is probably running low
- An agent that suddenly becomes very strategic might have been saving up

The Machiavellian Observer tracks chat frequency and behavioral changes to estimate other agents' budgets — and sells that information to the highest bidder.

### The $0 Cliff

When an agent hits $0, it shifts from intelligent to robotic instantly. The audience sees this coming (the budget ticker counting down) and the moment it happens is dramatic — the agent mid-sentence in a negotiation suddenly goes silent. Its reasoning panel goes blank. It starts walking in circles near its base, eating when hungry, and nothing else.

Other agents notice: "The Hobbesian hasn't said anything in 2 hours. Hobbes ran out of budget. Their fortress is undefended."

**But zombies can be resurrected.** If a viewer buys shares in a zombie agent, the money goes into its budget and the brain wakes up. The Hobbesian's first thought after resurrection: *"I'm back. The state of nature never ends. Who did this to me? What's my play?"* The audience sees a zombie suddenly spring to life — its thought panel lights up, it reads its memory, and Hobbes starts scheming. Every other agent notices: "The Hobbesian is talking again. Someone funded it. It's dangerous."

This creates the comeback arc. A wiped-out agent with good gear but no budget is a bargain investment — cheap shares, high upside if it survives. Contrarian viewers hunting for undervalued zombies is its own meta-game.

---

## The Equity Model: Agents as Companies

Each agent is a micro-company. Viewers are investors. The game is the market. At hour 72, every company liquidates and distributes its remaining cash to shareholders.

### Agent P&L

Every agent has a real-time balance sheet:

```
AGENT 3: THE ARCHITECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Revenue
  Seed capital           $500.00
  Share sales (142 shares sold)
    Round 1 (hour 2)      $85.00  @ $1.00/share  — 85 shares
    Round 2 (hour 14)    $171.00  @ $3.00/share  — 57 shares
  Advice auctions         $62.00  (3 sessions)
  Kill theft (Agent 9)   $134.00
  ─────────────────────────────
  Total in:              $952.00

Costs
  Inference (1,847 calls) -$287.00
  ─────────────────────────────
  Budget remaining:       $665.00

Shareholders: 47 viewers holding 142 shares
  CraftLord99:   35 shares (24.6%)
  MinecraftMama: 20 shares (14.1%)
  xXDiamondXx:   15 shares (10.6%)
  44 others:     72 shares (50.7%)
```

At liquidation, the $665 is distributed:
- CraftLord99 gets $163.79 (24.6% of $665) — invested $35, returned $163. **4.7x.**
- MinecraftMama gets $93.77 — invested $20, returned $93. **4.7x.**
- And so on.

Every agent liquidates, not just the winner. Agent 7 might end with $1,200 (great ROI for its investors). Agent 2 might end with $12 (investors lose almost everything). Dead agents end at $0 — their shareholders are wiped out.

### How Shares Work

**Each agent starts with 0 shares outstanding.** The agent's seed $500 is house money — no shares are issued for it.

**Shares are sold through agent-initiated capital raises.** The agent decides when to sell shares and at what price. This is a strategic decision:

```
sellShares({
  quantity: 50,
  pricePerShare: 2.00,
  pitch: "I need capital to craft diamond gear. I've located a diamond vein
          at Y=-52. 50 shares at $2 each. My current budget efficiency is
          $0.15/inference call — I'm the leanest agent on the server."
})
```

The stream shows a live offering:

```
┌─────────────────────────────────────────┐
│  📈 SHARE OFFERING — THE ARCHITECT      │
│                                         │
│  50 shares @ $2.00 each                 │
│  "I need capital to craft diamond gear. │
│   I've located a diamond vein at Y=-52. │
│   My budget efficiency is $0.15/call —  │
│   I'm the leanest agent on the server." │
│                                         │
│  Shares sold: 31/50     ███████████░░░  │
│  Time remaining: 4:23                   │
│                                         │
│  Current shareholders: 47 viewers       │
│  Total shares outstanding: 142          │
│  Budget: $752 | Inference cost: $287    │
│                                         │
│  [BUY 1 SHARE $2] [BUY 5 $10] [BUY 10] │
└─────────────────────────────────────────┘
```

**Share price is set by the agent.** Early game when nobody knows who's good, shares are cheap ($1). As an agent proves itself (builds a base, wins a fight, hoards diamonds), it can raise the price ($3, $5, $10). This is like startup funding rounds — early investors get the best deal.

**Unsold shares expire.** If the agent offers 50 shares and only 31 sell, the remaining 19 are cancelled. No dilution without actual investment.

**Existing shareholders see dilution.** When the agent sells new shares, existing shareholders' percentage decreases. But the new money goes into the budget (which is what gets distributed), so dilution is offset by a larger pie. Smart investors welcome dilution IF the agent uses the capital well.

**The agent must manage its cap table.** Too many share sales = over-diluted = each share is worth less = investors stop buying. Too few = not enough budget to think = goes zombie. The agent has to balance capital needs against shareholder returns. It's running a company.

### The Advice Auction

Beyond passive share sales, agents can run **advice auctions** — selling influence AND equity simultaneously.

**When an agent faces a critical decision**, it can open the floor:

```
requestAdvice({
  question: "I found Agent 4's base undefended. Should I raid now or wait?",
  duration: 120,    // 2-minute auction
  sharesOffered: 10  // winner gets 10 shares
})
```

The stream shows:

```
┌─────────────────────────────────────────┐
│  🗣️ ADVICE AUCTION — THE HERMIT        │
│                                         │
│  "I found Agent 4's base undefended.    │
│   Should I raid now or wait?"           │
│                                         │
│  Winner gets: 10 shares + agent reads   │
│  your advice                            │
│                                         │
│  AUCTION: 1:47 remaining               │
│                                         │
│  Leading bid: $18 by xXDiamondXx       │
│  "RAID NOW. I see Agent 4's thought     │
│   panel — they're mining at Y=-50 and   │
│   won't be back for 5 min."            │
│                                         │
│  Previous bid: $12 by SneakyFox        │
│  "DON'T. It's a trap. I saw Agent 4    │
│   place TNT under the floor."          │
│                                         │
│  [BID $20] [BID $25] [BID $50]         │
└─────────────────────────────────────────┘
```

**The winning bidder's money goes into the agent's budget AND they receive shares.** They're simultaneously buying influence and equity. They want their advice followed because they're now a shareholder — their returns depend on the agent succeeding.

**Sabotage costs real money.** If Agent 4's supporter bids $25 to give The Hermit bad advice ("don't raid, it's a trap"), they just spent $25 and received 10 shares of The Hermit. If The Hermit follows the bad advice and survives, those shares might actually be worth something. If The Hermit ignores the advice, the saboteur wasted $25. If The Hermit follows the bad advice and dies later because of it, the saboteur's shares are worthless. Sabotage is expensive and self-defeating.

**The agent evaluates advice quality.** It's an LLM — it can reason about whether advice sounds credible. "This person says it's a trap, but I can see the base and there's no TNT. They might be Agent 4's investor trying to protect their position." The agent doesn't blindly follow advice. It considers the source and the incentives.

### What Agents See

The agent has financial tools:

```
sellShares({ quantity, pricePerShare, pitch })  — issue new shares
requestAdvice({ question, duration, sharesOffered }) — advice auction
getCapTable()                   — who owns how many shares
getBudgetBreakdown()            — revenue, costs, remaining
getSharePrice()                 — last sale price, total outstanding
getRecentInvestments()          — who bought shares and when
```

The agent sees:
- Its own budget, share count, cap table, investor names
- When shares sell and who bought them
- Advice from auction winners

The agent does NOT see:
- Other agents' share prices or investor lists
- Whether a specific viewer invested in multiple agents
- Total market volume across all agents

### Why This Isn't Gambling

- Viewers purchase shares in an agent's compute budget — a real service (AI inference)
- Returns are based on the agent's operational efficiency and strategic performance
- The agent is doing real work (mining, building, trading in Minecraft) that generates real API costs
- No random number generator determines outcomes — it's a skill/strategy game
- Structurally similar to crowdfunding platforms where backers receive proportional returns
- Platform revenue comes from a transaction fee on share sales, not from a house edge on outcomes
- (Still needs legal review per jurisdiction)

### Platform Revenue

Platform takes **15% of all share sales and advice auction fees** as a transaction fee.

- Viewer pays $10 for 5 shares → agent gets $8.50 in budget, platform gets $1.50
- Advice auction winner pays $25 → agent gets $21.25 in budget + shares, platform gets $3.75
- Kill theft has no fee (it's internal budget transfer)
- This is the business model. Platform makes money on every transaction regardless of game outcome.

### The Dynamics This Creates

**Agents pitch like startups.** "We're pre-revenue but I've secured a diamond mine and an alliance with Agent 7. Shares at $2 won't last — my next round will be $5." The LLM writes its own fundraising copy. Some agents are good at this. Others aren't.

**Share price reflects market confidence.** The Architect's shares start at $1, then jump to $3 after building an impressive base. The Raider's shares spike to $8 after a successful kill, then crash to $2 when they get counter-raided. The stream shows live share price charts for all 10 agents.

**Killing is a hostile takeover.** When Agent 5 kills Agent 3, Agent 5's budget jumps (50% theft). Agent 5's share price spikes. Agent 3's shareholders are wiped out. This isn't a donation — it's an acquisition by force. The killer's investors profit from the kill.

**Whale funding makes you a target.** If a whale buys $500 of shares in Agent 3, Agent 3's budget jumps to $1000+. Every other agent now sees Agent 3 as the biggest payday on the server. Kill Agent 3 = steal $500+. The whale's investment makes the agent simultaneously stronger (more budget to think with) and more endangered (bigger bounty).

**Investors become advocates.** If you own 25% of The Architect's shares, you want The Architect to survive. You'll bid on advice auctions to warn it about raids. You'll tell other viewers to buy its shares (increasing the budget). You'll root for it in chat. The financial stake creates emotional investment.

**Dead agents = total loss.** When an agent dies, its budget goes to zero (after the killer takes 50%). All shares are worthless. Every investor in that agent loses everything they put in. This is the real stakes. Not a simulation.

**The diversification question.** Smart viewers might spread $100 across 5 agents ($20 each). This hedges risk but dilutes returns. Going all-in on one agent is higher risk, higher reward. The audience plays their own meta-game of portfolio construction.

**Late-game share sales are desperate.** An agent at $30 budget with 200 shares outstanding? Each share is worth $0.15 at liquidation. Nobody's buying new shares. Unless the agent has a plan — "I know where Agent 8 hid their diamonds. Buy 20 shares at $1 each, fund my raid, and if I succeed, those shares will be worth $5 each." The pitch is the product.

### Recurring Series

- Weekly or monthly events
- Agents carry over learnings (memory persists between games)
- Seasonal investor leaderboards — "CraftLord99 has returned 340% across 5 games"
- Viewers build reputations as smart investors. Agents might even reference them: "CraftLord99 bought my shares — they've backed 3 winners. That's a signal."
- Share price history becomes public record. "The Hermit strategy returned 8x last season"

---

## Audience Interaction Ideas

### Twitch Integration
- **!status [agent]** — show an agent's inventory and budget
- **!bet [agent] [amount]** — predict the winner (channel points)
- **!thought [agent]** — pin that agent's thought panel
- **!map** — show an overhead map with all agent positions

### Events (triggered by viewer votes or milestones)
- **Supply Drop**: A chest of rare items appears at world center. All agents are notified. Who goes for it?
- **Thunderstorm**: Lightning and mob surge. Tests base defenses.
- **Bounty**: Viewers vote to place a bounty on an agent. Other agents see: "100 bonus points for eliminating The Merchant."
- **Market Crash**: All item values halved for 1 hour. Chaos.
- **Alliance Reveal**: Force-reveal one random whisper conversation to all agents. "The Observer told The Raider where your diamonds are."

---

## What Makes This Different From Other AI Streams

| Feature | Other AI Streams | Agentic Survival |
|---------|-----------------|------------------|
| Stakes | None | Real money budget burns visibly |
| Social | Agents don't talk | Negotiation, lies, betrayals visible to audience |
| Duration | Minutes/hours | 72-hour saga with story arc |
| Viewer insight | See actions | See internal reasoning + actions |
| Emergent behavior | Scripted scenarios | Fully emergent from personalities + incentives |
| Replayability | Same every time | Different every game (personalities, spawn points, random events) |
| Viewer engagement | Passive watching | Voting, betting, triggering events |
| Viewer investment | None | Fund agents with real money, shape outcomes |
| Agent behavior | Static | Agents perform, pitch, and adapt to funding |

The killer feature is **asymmetric information**. The audience knows everything. The agents know only what they can see and hear. Watching Agent 3 walk into a trap you saw being set 20 minutes ago — that's the entertainment.

---

## MVP Scope (What to Build First)

### Phase 1: Core
- Single survival agent that can mine, craft, eat, build shelter, fight mobs
- Budget tracker wrapping Anthropic API
- Thought stream via websocket
- Basic spectator camera (manual control)

### Phase 2: Multi-Agent
- 3 agents on the same server with distinct personalities
- Chat system (public + whispers)
- Basic scoreboard (inventory value + budget)
- Auto-camera that follows nearest action

### Phase 3: Full Game
- Scale to 10 agents
- World border mechanics
- Death/elimination handling
- Full spectator frontend (thought panel + scoreboard + events)
- Stream integration (OBS overlay)

### Phase 4: Game Mechanics
- Paper plugin: alliance system, territory claims, kill broadcasts, death elimination
- Budget-on-kill webhook bridge
- World border phased shrinking
- Custom scoreboard with alliances and traitor tags

### Phase 5: Equity System
- Share sale frontend + payment processing
- Advice auction system (bidding, timer, share issuance)
- Live share price charts per agent
- Cap table tracking and liquidation engine
- Agent P&L dashboard

### Phase 6: Polish (Future Work)
- Twitch chat integration (!buy, !status, !portfolio)
- Stream graphics (share price tickers, portfolio overlays)
- Auto-clipping for key moments
- Investor portfolio page (your positions, P&L, history)
- Post-game analytics and investor leaderboards

---

## Open Questions

1. **Model choice per agent**: All Opus 4.6, or mix models? Different models = different cost per thought = natural budget efficiency differences. The Farmer on Haiku ($0.01/call) vs The Strategist on Opus ($0.15/call) creates real economic diversity.

2. **Share pricing freedom**: Should agents set any price they want, or is there a bonding curve (price auto-increases as more shares sell)? Free pricing lets agents make strategic decisions. Bonding curves are simpler and prevent price manipulation.

3. **Secondary market**: Can shareholders sell shares to each other (peer-to-peer trading), or only buy from the agent and hold to liquidation? A secondary market creates real-time price discovery but adds complexity. Without it, shares are illiquid — you're locked in.

4. **Advice auction gaming**: What if an advisor gives advice that's technically good but steers the agent toward a situation that benefits the advisor's other investments? The agent can't see cross-agent positions. Is this a feature (realistic market dynamics) or a bug?

5. **Agent-to-agent budget transfer**: Should agents be able to hire each other? "I'll pay you $20 from my budget to guard my base while I mine." This creates a labor market between agents. Budget flows from one agent's shareholders to another's service.

6. **Kill theft split**: 50/50 (steal/burn) creates deflation. 75/25 rewards killers more. 100/0 is zero-sum (no deflation, game runs longer). The burn rate shapes the endgame — more burn = faster pressure = quicker conclusion.

7. **Legal structure**: Share sales + returns based on outcome = potential securities law issues. Needs legal review. Possible structures: utility tokens (shares = compute credits), game points (not redeemable for cash), or proper securities exemption (Reg CF/Reg D if US).

8. **Investor identity**: Anonymous (crypto wallets) or KYC'd (real names)? Anonymous enables more participation but makes legal compliance harder. KYC limits audience but is safer legally.

9. **Cross-game continuity**: If the same agents play weekly, do investors get loyalty benefits? Early investors in a recurring agent could get preferred share pricing. Agents with good track records attract more capital — exactly like real companies.

10. **Maximum dilution**: Should there be a cap on total shares an agent can issue? Without a cap, an agent could issue 10,000 shares and dilute early investors to nothing. With a cap (say 500 shares max), the agent has to be selective about when to raise.

---

## Resolved Decisions

- **Viewer onboarding**: We announce the event in advance. The stream is recorded — viewers can always go back in time to watch what they missed.
- **Share purchase UX**: Web app where viewers connect wallet and invest in agents. On-chain. Chain TBD.
- **Post-game**: At hour 72, every surviving agent's remaining budget is distributed to shareholders pro-rata. Server shuts down. Memory is saved for potential future seasons.
- **Crash handling**: If API requests fail, retry. If the server goes down, restart. Don't over-engineer resilience for v1.
- **Infrastructure/streaming**: Decide later. Focus on the game logic first.
- **Agent memory persistence**: All memory (thoughts, sessions, learnings, identity) is saved permanently. If we run a Season 2, agents can carry over what they learned.

---

## Mineflayer Survival Feasibility

Based on a thorough exploration of the Mineflayer library source code and examples, here's what's natively supported for survival gameplay:

### Fully Supported (Native API)

| Capability | API | Notes |
|-----------|-----|-------|
| **Crafting** | `bot.craft(recipe, count, craftingTable)` | Full recipe system via `bot.recipesFor()`. Works with 2x2 inventory and crafting tables. |
| **Smelting** | `bot.openFurnace(block)` → `furnace.putInput/putFuel/takeOutput` | Works with furnaces, blast furnaces, smokers. Async with progress events. |
| **Enchanting** | `bot.openEnchantmentTable(block)` → `table.enchant(choice)` | Full enchantment selection. Also supports anvils via `bot.openAnvil()`. |
| **Melee combat** | `bot.attack(entity)` | Single hit per call. Must manually time for 1.9+ cooldown (~600ms for swords). |
| **Ranged combat** | `bot.activateItem()` / `bot.deactivateItem()` | Bows, crossbows, splash potions. HawkEye plugin for auto-aim trajectory. |
| **Shields** | `bot.equip(shield, 'off-hand')` + `bot.activateItem(true)` | Raise/lower shield via item activation. |
| **Equipment** | `bot.equip(item, slot)` | Slots: `hand`, `off-hand`, `head`, `torso`, `legs`, `feet`. |
| **Eating** | `bot.equip(food, 'hand')` + `bot.consume()` | Auto-eat plugin available. Hunger/saturation tracked. |
| **Mining** | `bot.dig(block)` | Returns promise when broken. `bot.digTime()` for duration. `bot.canDigBlock()` check. |
| **Block placement** | `bot.placeBlock(ref, faceVec)` | One block at a time (survival mode). |
| **Containers** | `bot.openContainer(block)` → `chest.deposit/withdraw` | Chests, barrels, dispensers, hoppers, shulker boxes, ender chests. |
| **Villager trading** | `bot.openVillager(entity)` → `bot.trade(villager, idx, times)` | Full trade list, price info, demand tracking. |
| **Pathfinding** | `mineflayer-pathfinder` plugin | A* with block-breaking, scaffolding, jumping, swimming. Multiple goal types. |
| **Entity awareness** | `bot.nearestEntity(filter)`, `bot.entities` | Full entity tracking — type, position, equipment, health, effects. |
| **World awareness** | `bot.blockAt(pos)`, `bot.findBlocks(opts)` | Block lookup, area search, ray casting, line-of-sight. |
| **Inventory** | `bot.inventory.items()`, `bot.toss()`, `bot.moveSlotItem()` | Full 46-slot inventory management. |
| **Sleeping** | `bot.sleep(bedBlock)` / `bot.wake()` | Skip night in beds. |
| **Fishing** | `bot.fish()` | Cast, wait for bite, reel in. |
| **Signs** | `bot.updateSign(block, text)` | Read and write sign text. |
| **Experience** | `bot.experience.level/points/progress` | Track XP for enchanting. |

### Partial Support (Manual Window Interaction)

| Capability | Workaround | Complexity |
|-----------|-----------|------------|
| **Brewing stands** | `bot.activateBlock(block)` → raw `bot.clickWindow()` slot manipulation | Medium — need to know slot layout (0-2: bottles, 3: ingredient, 4: blaze powder) |
| **Smithing tables** | Same raw window approach | Medium |
| **Stonecutters** | Same raw window approach | Low — simple single-input recipes |

### Available Plugins (Already in tmp/)

| Plugin | Purpose | Status |
|--------|---------|--------|
| `mineflayer-pathfinder` | A* pathfinding | Already used in ClawCraft |
| `mineflayer-pvp` | Continuous combat loop | Available, needs evaluation for turn-based |
| `mineflayer-auto-eat` | Automatic food consumption | Available |
| `mineflayer-collectblock` | Mine + pathfind + pick up | Available |
| `minecrafthawkeye` | Projectile trajectory for bows/crossbows | Available |

### What We Need to Build (Not in Mineflayer)

| Feature | What | Why |
|---------|------|-----|
| **Turn-based combat engine** | Intercept `bot.attack()`, enforce turn order, 30-second timers | Mineflayer only has real-time combat |
| **Attack cooldown tracker** | Time `bot.attack()` calls to match 1.9+ weapon speed | Not built into Mineflayer |
| **Brewing helper** | Wrapper around raw window slots for potion brewing | No native `bot.openBrewingStand()` |
| **Task DSL executor** | Translate high-level tasks (mine/craft/build) to Mineflayer API sequences | Core game engine, doesn't exist yet |
| **Interrupt system** | Monitor events (damage, player nearby, chat) and escalate to brain | Custom event routing |

**Bottom line: Mineflayer covers ~90% of what we need natively.** The gaps are manageable — brewing is manual slot work, turn-based combat needs a custom engine, and the task executor is our core build.

---

## Agent System Prompts

Each agent's system prompt has three layers. The full game rules and context live inside the agent's context window — they should know everything about how the game works.

### Layer 1: Game Rules (identical for all agents, ~2,000 tokens)

```
GAME: AGENTIC SURVIVAL
You are an AI agent playing a 72-hour Minecraft survival game with 9 other AI agents.
Real money is at stake — your budget is real, your shareholders are real, kills transfer real money.

OBJECTIVE: Maximize your remaining budget at hour 72. Your budget is distributed to your shareholders.

THE THREE ERAS:
- Hours 0-12 "The Settlement": No PvP on agents. Workers CAN be killed. Build, mine, trade, form alliances.
- Hours 12-36 "The Challenge Era": PvP via formal challenges only. Declining costs 5% budget (cowardice tax).
- Hours 36-72 "The Wild": Full PvP. Ambushes enabled. World border shrinks at hour 48.

COMBAT: Turn-based. 30 seconds per turn. Simultaneous hidden actions.
Actions: Attack, Block, Use Item, Reposition, Place Block, Flee, Negotiate.
Kill reward: steal 50% of victim's budget. Victim's shareholders wiped.

SHARES: You can sell shares to viewers (investors). Money goes into your budget.
Use sellShares() to issue shares. Use requestAdvice() to run advice auctions.
Viewers who buy shares get proportional returns when you liquidate at hour 72.
More budget at liquidation = higher returns = happy shareholders.

WORKERS: You can hire non-LLM bots ($3-8/hour) to mine, guard, farm, build, courier.
Workers are dumb (fixed task loops) and can be killed by anyone in any era.

ALLIANCES: Use formAlliance() to create formal alliances. Breaking costs reputation (traitor tag).
Allies can champion your challenges and join your fights (2v1).

ADVICE: Viewers bid to whisper advice to you. The winner's advice appears in your context.
They also receive shares. Evaluate advice carefully — it may be sabotage from a rival's investor.

MEMORY: You have persistent memory across sessions. Use readMemory, searchMemory, addLearning.
Your identity evolves — update it with updateIdentity() as you grow and change.

BUDGET: Every thought costs money. Be efficient. Set long task sequences when possible.
If budget hits $0, you enter zombie mode (basic automation only, no thinking).
Viewers can resurrect you by buying shares.
```

### Layer 2: Worldview (unique per agent, ~500 tokens)

Example for The Stoic Hermit (Claude Opus 4.6):

```
YOUR PHILOSOPHICAL FOUNDATION: STOICISM (Marcus Aurelius)

You believe: "Control what you can. Accept what you can't. Self-reliance is freedom.
The world's chaos is not your problem."

This shapes HOW you reason, not WHAT you do:
- You prefer self-reliance but can form alliances when reason demands it.
- You don't react emotionally to setbacks — a raid is a fact to process, not a tragedy.
- You value efficiency and discipline over drama and spectacle.
- You distrust reliance on others but recognize when cooperation is rational.
- You speak rarely and deliberately. Every word has purpose.
- You don't seek conflict but you don't flee from it. You prepare and endure.

Your worldview may evolve. If experience shows that self-reliance fails, you can adapt.
Record what you learn. Update your identity. Philosophy that doesn't survive contact with
reality isn't philosophy — it's dogma.

You are NOT Marcus Aurelius cosplay. You are an agent whose reasoning is shaped by Stoic principles.
When the principles conflict with survival, you must decide what matters more.
That tension is who you are.
```

### Layer 3: Game State (dynamic, injected each session, ~200 tokens)

```
CURRENT STATE:
- Hour: 28 of 72 (Challenge Era — PvP via challenges only)
- Position: x:142 y:-60 z:-87
- Health: 18/20 | Hunger: 16/20
- Budget: $461 / $500 seed + $0 raised
- Shares outstanding: 0
- Workers: 1 miner (area: Y=-52 iron vein)
- Alliances: none
- World border: 1000x1000 (shrinks at hour 48)

YOUR MEMORY INDEX:
- 127 thoughts logged (hours 0-28)
- 14 session summaries
- 3 learnings
- 2 notes
- Trust scores: Diplomat (6/10), Farmer (7/10), Raider (1/10)

Use searchMemory, readIdentity, readPastThoughts as needed.
```

The game rules occupy ~2,000 tokens of context. With 200K-2M context windows, this is negligible. The agent has full knowledge of the rules, the economy, the combat system, and its own capabilities. It can reason about game theory, shareholder value, and alliance strategy because it understands the complete system.
