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

- **A reply**: a comment that answers the user's last message, in the user's language, and ends with the line `<!-- generator -->`. It is the PM side of the wizard's chat. The routine comments with the user's account, so the marker is what tells its replies from the user's messages; Ensemble hides it.
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
- `adopt-scan <issue number>` and `adopt <issue number>`: an adoption of an existing repository (*Adopting an existing repository* below).

## The Generator's prompt

The task runs in the Template repository, in an environment with Docker (the cloud default has it) and network access to the package registries. Its prompt:

```text
You are the Generator of the Template. The trigger text is "draft <n>" or "generate <n>"; read issue #<n> of this repository, its body and every comment, and follow recipes/generator-routine.md.
- "draft <n>": run the discovery and the interview of recipes/new-project.md as a conversation on the issue. Reply to the last message with at most four questions or the recommendation table, ending the reply with the line <!-- generator -->, then post a new "### Brief" comment when the brief changed. Write nothing to disk and create nothing.
- "generate <n>": the issue must carry ready-to-generate; run /new-project in draft mode from the issue, posting a "### Progress" comment at every step.
- "adopt-scan <n>": read the repository the issue names, without changing it, and post a "### Diagnosis" comment.
- "adopt <n>": the issue must carry ready-to-adopt; run /new-project in adopt mode on that repository, posting a "### Progress" comment at every step.
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

## Adopting an existing repository

The same routine installs the agent team in a repository that was not generated by the Template (ADR-0017). Ensemble opens an **adoption issue** in the Template:

- **Title**: `Adopt: <owner>/<repo>`.
- **Labels**: `project-adoption` from the start; `ready-to-adopt` when the user presses **Abrir o PR com o time**.
- **Body**, written only by Ensemble: `## Repository` with the full name on one line, then `## Answers` with one fenced `json` block: `{ "repository": "<owner>/<repo>", "kind": "backend" | "frontend" | "mobile", "project": "<project slug>", "team": { … } }`, the `team` object as in the draft answers.

The session must reach the adopted repository: the task's repositories include it, or the session attaches it. When it cannot, the run fails at `session` with the reason, and the user runs `/new-project adopt <n>` on their machine.

### `adopt-scan <n>`: the diagnosis

The Generator clones the repository, reads it and changes nothing. It posts a comment whose first line is `### Diagnosis`, followed by one fenced `json` block:

```json
{
  "kind": "backend",
  "recipe": "recipes/backend/php.md",
  "findings": [
    { "state": "ok", "title": "PHP 8.3 com Laravel 11", "detail": "composer.json · bate com a recipe PHP Laravel" },
    { "state": "warn", "title": "Sem o script ./project", "detail": "O PR cria um com os comandos que já existem" },
    { "state": "missing", "title": "Sem openapi.json", "detail": "Vira um ticket no PR" }
  ]
}
```

- `kind` is the detected kind, or `null` when the repository fits no kind. `recipe` is the closest Stack Recipe, or `null`.
- `state` is `ok` (already meets the recipe), `warn` (the PR adds or adapts it) or `missing` (out of the PR; it becomes a ticket). Each finding is written in the user's language.
- What is checked: the language and framework against `recipes/decision-guide.md`; the tests and how they run; the CI and the checks `ci / pr-rules`, `ci / gates` and `paths / paths`; a `project` script (`recipes/dev-commands.md`); the rule files of `recipes/agent-rules.md`; `openapi.json` for a backend or frontend; an existing `.agents/config.json`.

### `adopt <n>`: the pull request

The **adopt mode** of `/new-project` works on one existing repository and never rewrites its code:

1. It reads the answers and the latest diagnosis; `kind` and `project` must be set, or the run stops with the question as a reply and removes `ready-to-adopt`.
2. On a branch `chore/install-agent-team`, it writes what the diagnosis marked `warn`, from the recipes but around the code as it is:
   - a `project` script whose commands call the tools the repository already uses;
   - the CI caller `ci.yml` and `agent-paths.yml` (`recipes/github-setup.md`);
   - `CLAUDE.md`, `AGENTS.md`, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md` and `.github/ISSUE_TEMPLATE/ticket.md` from `recipes/agent-rules.md`, describing the code as it is;
   - one ADR in `docs/adr/` per place where the repository differs from the recipe, saying the agents follow the repository there;
   - the agent team as in `recipes/agent-rules.md` (*The agent team*): `.agents/config.json` with the answers' kind and models, then `agents-install`.
3. It runs `./project check` and `project agents:check` on the branch. A test that already failed on `main` stays as it is and becomes an issue in the repository; it is never skipped or deleted.
4. It creates the team's labels (`agents-labels`) and opens the pull request `chore(agents): install the agent team`. The pull request is a draft when a check failed, with the reason in its description. It is never merged by the Generator.
5. Each `missing` finding becomes an issue in the repository, labelled `needs-triage`.
6. The end is a reply with the pull request's URL and the activation checklist of `recipes/agent-team-activation.md` for this repository. The Generator then closes the issue as completed.

Its progress uses the step keys `session`, `read`, `rules`, `agent-team`, `check`, `labels` and `pull-request`, and sets `pullRequestUrl` once the pull request exists.

## Setting up the Generator, once

On claude.ai, the user creates one task in the Template repository with the prompt above, no schedule and no connectors, and turns push notifications off. The labels `project-draft`, `ready-to-generate`, `project-adoption` and `ready-to-adopt` are created once in the Template repository. Then they add an **API trigger** on the web, which shows its token once, and paste the URL and the token in Ensemble's settings for the Generator. Ensemble never shows the token again.
