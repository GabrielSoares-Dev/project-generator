# 03: Interview and plan with confirmation

**What to build:** the fixed answers of tickets 01 and 02 are replaced by the Decision Guide interview. `/new-project` asks about the product and the team (name, domain, product language, dark mode, Brand Tokens, technology choices within the first slice's menu), recommends a choice for each item, shows the full plan with every choice, and waits for the user's confirmation. Nothing is written before the confirmation.

**Blocked by:** 02 (React frontend generated and green)

**Status:** done

- [x] The interview covers the inputs listed in the new-project recipe that apply to a local run (`recipes/new-project.md`, *The interview*); run for real on 2026-10-05 for the product Task Board (name, language, dark mode, color, radius, font, description and team, domain, AWS region and budget, technology)
- [x] Choices outside the first slice are shown as not yet available instead of silently ignored; the user's question "what does not available mean?" exposed that the term was unclear, so the recipe and the skill now define it (no recipe proven end to end by passing every gate, not that the code cannot be written) and tell the agent to decide technology the user cannot judge instead of offering a menu
- [x] The plan lists repositories and every choice, and nothing is generated until the user confirms (the plan was shown in the conversation and confirmed before the folder `task-board` was created)
- [x] Declining or changing an answer regenerates the plan without leftovers on disk (the plan lives only in the conversation)
- [x] The answers drive what is generated, verified in headless Chrome on the running pair: title and header `Task Board`, `lang` `pt-BR`, `--primary` `oklch(0.511 0.086 186.391)` (light) and `oklch(0.691 0.06 186.391)` (dark), `--radius` `0.25rem`, `Inter Variable` loaded, the `dark` class under a dark system theme, and the backend's status on screen
- [x] A run with different answers than the fixed ones still passes every gate from tickets 01 and 02 (Task Board: name, color, radius, font and domain differ; language and dark mode were chosen the same as the first run, so the dark-mode-off and other-language paths are still unproven)

## Notes

- `tools/brand-tokens.mjs` converts the primary color; checked against known OKLCH values (pure red, indigo).
- Unproven paths: dark mode off, a language other than pt-BR, a color that needs a dark foreground.
