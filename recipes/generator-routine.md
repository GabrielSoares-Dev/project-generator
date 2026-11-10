# The Generator routine and the draft mode

How a project is created from the Ensemble platform's **Novo projeto** wizard instead of a local conversation (ADR-0016). The wizard talks to one scheduled task of the user's account, the **Generator**, which runs in the Template. Every draft is an issue in the Template repository, and the conversation, the answers, the brief and the progress all live on it. `/new-project` reads that issue in its **draft mode**. The interactive mode of `recipes/new-project.md` stays as it is.

## The draft issue

Ensemble opens one issue per draft in the Template repository:

- **Title**: `Draft: <product name or the first words of the idea>`.
- **Labels**: `project-draft` from the start; `ready-to-generate` when the user presses **Gerar**. These two labels exist only in the Template repository.
- **Body**, written only by Ensemble and rewritten whole on every change:

````markdown
## Idea

<the idea, in the user's words>

## Answers

```json
{ "...": "the answers object below" }
```
````

The **answers object** holds what the wizard collected. Every key is optional until **Gerar**, and keys the wizard does not know are kept as they are:

| Key | Holds | Interview input (`recipes/new-project.md`) |
|---|---|---|
| `productName`, `slug`, `description`, `language` | strings | product name, project name, what it does, product language |
| `darkMode` | `"both"`, `"light"` or `"dark"` | dark mode |
| `brand` | `{ "primary": "#rrggbb", "radius": "sharp" \| "default" \| "round", "font": "system" \| "<name>" }` | Brand Tokens |
| `domain`, `dockerHubUser` | strings | domain, Docker Hub user |
| `ports` | `{ "<kind>": <port> }`, kinds `backend`, `frontend` | host ports |
| `owner`, `visibility` | the GitHub owner; `"private"` or `"public"` | where step 15 publishes |
| `repositories` | `["backend", "frontend", "mobile"]`, a subset | repositories |
| `stack` | `{ "<decision>": { "option": "...", "reason": "..." } }`, decisions `backend`, `frontend`, `mobile`, `database`, `auth`, `mechanisms`, `deploy` | the discovery table |
| `team` | `{ "models": { "<role>": "opus" \| "sonnet" \| "haiku" }, "supervised": true, "maxConcurrent": 3, "stuckMinutes": 60, "overrides": [{ "role": "qa", "rule": "..." }] }` | `.agents/config.json` and `agents/overrides/` (`recipes/agent-rules.md`, *The agent team*) |

## What the Generator writes

The Generator writes only comments. Ensemble shows the latest one of each kind:

- **A reply**: an ordinary comment that answers the user's last message, in the user's language. It is the PM side of the wizard's chat.
- **The brief**: a comment whose first line is `### Brief`, followed by one fenced `json` block. A new brief is posted whenever the conversation changes it:

```json
{
  "problem": "one or two sentences",
  "scope": [{ "text": "Agendar e cancelar", "inMvp": true }],
  "stack": [{ "decision": "backend", "option": "PHP Laravel", "reason": "tied to the user's answers", "tradeoff": "…", "available": true }],
  "repositories": ["barbearia-backend", "barbearia-mobile"],
  "openDecisions": ["the questions the user still has to answer before Gerar"]
}
```

- **The progress**: during generation, a comment whose first line is `### Progress`, followed by one fenced `json` block, posted again at every change:

```json
{
  "steps": [
    { "key": "session", "state": "done", "at": "2026-11-10T10:03:00Z" },
    { "key": "backend", "state": "running" },
    { "key": "gates", "state": "pending", "gates": { "lint": "done", "typecheck": "running" } }
  ],
  "sessionUrl": "https://claude.ai/code/session_…",
  "failure": null,
  "repositories": []
}
```

  The step keys, in order, are `session`, `backend`, `frontend`, `mobile`, `gates`, `agent-team`, `repositories` and `first-pr`. The states are `pending`, `running`, `done`, `skipped` (a repository not generated, with a `reason`) and `failed`. A failure sets `failure` to `{ "step": "<key>", "reason": "…" }` and ends the run. When `repositories` is done, it lists the URLs of the created repositories.

## How Ensemble fires it

The Generator is a scheduled task with an **API trigger** and no schedule. Ensemble stores its URL and token like the PM's, in its encrypted settings. After it writes on the issue, Ensemble fires the trigger with one line as the text:

- `draft <issue number>`: the user wrote in the chat. Ensemble has already posted the message as a comment and updated the body.
- `generate <issue number>`: the user pressed **Gerar**. Ensemble has applied `ready-to-generate` and posted a last comment, `Gerar`.

## The Generator's prompt

The task runs in the Template repository, in an environment with Docker (the cloud default has it) and network access to the package registries. Its prompt:

```text
You are the Generator of the Template. The trigger text is "draft <n>" or "generate <n>"; read issue #<n> of this repository, its body and every comment, and follow recipes/generator-routine.md.
- "draft <n>": run the discovery and the interview of recipes/new-project.md as a conversation on the issue. Reply to the last message with at most four questions or the recommendation table, then post a new "### Brief" comment when the brief changed. Write nothing to disk and create nothing.
- "generate <n>": the issue must carry ready-to-generate; run /new-project in draft mode from the issue, posting a "### Progress" comment at every step.
Reply in the language of the user's messages. Never ask for secrets, never create secrets or scheduled tasks, and never touch another issue.
```

## Draft mode of `/new-project`

When the skill starts from a draft issue (the `generate` trigger, or locally with `/new-project draft <n>`):

1. **The issue is the interview.** Steps 2 to 4 of the skill read the answers object and the latest brief instead of asking. A technology answer that is missing is decided as in the interactive mode, and the reason goes into the plan. A **product or brand answer** that is missing (name, language, colors, domain, owner) stops the run: the Generator posts the questions as a reply, sets `failure` on the `session` step, removes `ready-to-generate`, and generates nothing.
2. **The plan is posted, not asked.** The plan of *The plan and the confirmation* is posted as a reply before the first `### Progress` comment. The `ready-to-generate` label with the `generate` trigger is the confirmation, including the publication of step 15, since the answers name the owner and the visibility.
3. **The output directory** is a folder in the session's scratchpad, named after the slug.
4. **The gates and the proofs** run as in the interactive mode. The dev container is proven only by the simulation of step 14, since no VS Code is available.
5. **Publishing** follows `recipes/github-setup.md` with the owner and the visibility of the answers. If the session cannot create a repository or push to it, the run stops with `failure` on `repositories`, says that in a reply, and leaves no partial repository behind. The user then runs `/new-project draft <n>` on their machine, which reads the same issue.
6. **The end** is a reply with the activation checklist of `recipes/agent-team-activation.md` filled in for the project. The Generator then closes the issue as completed.

## Setting up the Generator, once

On claude.ai, the user creates one task in the Template repository with the prompt above, no schedule and no connectors, and turns push notifications off. Then they add an **API trigger** on the web, which shows its token once, and paste the URL and the token in Ensemble's settings for the Generator. Ensemble never shows the token again.
