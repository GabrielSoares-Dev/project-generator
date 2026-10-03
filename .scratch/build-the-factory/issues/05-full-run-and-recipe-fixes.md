# 05: Full run and recipe corrections

**What to build:** the exit criterion of the slice. Run `/new-project` from the interview to the end into a throwaway directory, then start backend and frontend together and use them. Everything that breaks or needed manual intervention becomes a correction in the recipes or the skill, with the reason recorded. Repeat with a second set of answers until a run is clean. Then record what the run taught about the recipe format, to decide adjustments before the remaining recipes (ADR-0001).

**Blocked by:** 03 (Interview and plan with confirmation), 04 (Agent rules in the generated repositories)

**Status:** ready-for-agent

- [ ] A run with no manual intervention produces both repositories with every local gate green
- [ ] Backend and frontend start together and the frontend reaches the backend's `GET /health`
- [ ] A second run with different answers is also clean
- [ ] Each correction made to a recipe or the skill is listed with its reason
- [ ] A short note lists recipe format adjustments suggested by the runs, for the user to decide
- [ ] The throwaway output is deleted at the end
