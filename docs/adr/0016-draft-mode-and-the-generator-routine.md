# Projects can be created from Ensemble through a draft issue and the Generator routine

`/new-project` ran only on the user's machine, as a conversation in the terminal. The Ensemble platform's Novo projeto wizard asks the same questions on a screen (idea, conversation, stack, repositories, team, generate), so the answers needed somewhere both sides could read, and something had to run the skill when the user presses **Gerar**. The answers now live on a **draft issue** of the Template repository. One scheduled task of the user's account, the **Generator**, runs in the Template with an API trigger that Ensemble fires. It holds the conversation on the issue and, on `generate <n>`, runs `/new-project` in a new **draft mode** that reads the issue instead of asking (`recipes/generator-routine.md`).

## Considered Options

- **Ensemble runs the conversation with its own model calls**: rejected. The decision guide and the recipes live in the Template, and only a session in the Template reads them as they are on that day.
- **One routine for the conversation and another for the generation**: rejected. Both read the same issue and the same recipes, so one task with two trigger texts is less to set up.
- **Keep generation local, the wizard only writing the plan**: kept as the fallback. `/new-project draft <n>` on the user's machine reads the same issue when the cloud session cannot publish.

## Consequences

- The interactive mode is unchanged. The draft mode replaces only the asking (steps 2 to 4): missing product and brand answers stop the run with questions on the issue, and the `ready-to-generate` label is the confirmation, publishing included.
- The Template repository gets two labels of its own, `project-draft` and `ready-to-generate`, and its issues are now also drafts. The Template's own tickets stay in `.scratch/`.
- The generation runs in a cloud session. Docker is there, but creating the new repositories and pushing to them depends on the session's GitHub access. When that is refused, the run fails at `repositories` and says so, and the user falls back to the local run.
- Ensemble stores the Generator's trigger URL and token encrypted, like the PM's, and reads the replies, the `### Brief` and the `### Progress` comments from the issue.
