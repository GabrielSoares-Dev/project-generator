# 03: Interview and plan with confirmation

**What to build:** the fixed answers of tickets 01 and 02 are replaced by the Decision Guide interview. `/new-project` asks about the product and the team (name, domain, product language, dark mode, Brand Tokens, technology choices within the first slice's menu), recommends a choice for each item, shows the full plan with every choice, and waits for the user's confirmation. Nothing is written before the confirmation.

**Blocked by:** 02 (React frontend generated and green)

**Status:** ready-for-agent

- [ ] The interview covers the inputs listed in the new-project recipe that apply to a local run
- [ ] Choices outside the first slice (other languages, clouds, databases) are shown as not yet available instead of silently ignored
- [ ] The plan lists repositories and every choice, and nothing is generated until the user confirms
- [ ] Declining or changing an answer regenerates the plan without leftovers on disk
- [ ] The answers drive what is generated: name, language, dark mode and Brand Tokens appear in the output
- [ ] A run with different answers than the fixed ones still passes every gate from tickets 01 and 02
