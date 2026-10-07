# `/new-project`

The skill that creates a Derived Project from the Template (ADR-0006). It runs in a session inside the Template, **locally on the user's machine and interactively**, never as an Autonomous Run in the cloud: it creates GitHub repositories, runs the Quality Gates (which need Docker and the stack's tools) and depends on the bootstrap, which only the user can apply with their own credentials. Machine requirements: Docker, Git and the `gh` CLI.

## Flow

1. **Interview** through the Decision Guide. Inputs collected:
   - **identity**: project name (becomes the Java package / PHP namespace and the `<project>-<environment>-<resource>` names), the domain (`app.<domain>` / `api.<domain>`), the Docker Hub user, the host ports on the VPS, the monthly budget and the alert email (recorded for the cloud phase);
   - **product**: what it does, who maintains it (team), the product language (e.g. `pt-BR`), dark mode (yes / no), Brand Tokens;
   - **technology**: repositories (backend, web frontend, mobile), backend language and variant, frontend framework and design system, database, authentication method, extra mechanisms, SSR / BFF need.
2. **Show the plan** (repositories, every choice, estimated cost) and **wait for the user's confirmation**. Nothing is created before it.
3. **Generate the code** from the recipes, with the rule files (`recipes/repository-layout.md`), and run **every Quality Gate locally**; continue only when they pass.
4. **Create the GitHub repositories, then protect them**: push the generated initial commit to `main` first, then enable the protection (changes only through pull requests, squash only, CI required, no direct push), since protected branches reject the first push. Also create the triage labels and a GitHub Project spanning the repositories. The frontend's initial OpenAPI client is generated from the backend's local `openapi.json`, before the backend exists on GitHub.
5. **VPS setup, done once by the user**, guided by `/wizard` (`recipes/vps-deploy.md`, *What the VPS needs, once*): the Portainer stacks with their webhooks, the reverse proxy and DNS, and the GitHub secrets `DOCKER_HUB_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN` and `PORTAINER_WEBHOOK_URL`. No Terraform, bootstrap or cloud account exists in this phase (ADR-0013).
6. **Deploys are made only by the manual `deploy.yml` workflow**, run by the human; `/new-project` and the agent never trigger it and never hold the VPS or Docker Hub credentials.
7. Write the **ADRs** of every choice and the **README**.
8. Hand the user the list of remaining manual steps.

## Discovery: deciding the technologies

Before the identity and brand questions, a short **discovery interview about the product** leads to the technology choices, so the user decides with reasons instead of picking from a menu they cannot weigh. It follows `recipes/decision-guide.md` (*From the product's needs to the choices*).

1. **Ask about the product, never about technology**, in the user's language and in plain words, up to four questions at a time: who uses it and how many; where (browser, phone); whether people log in and with what; what information it keeps and whether reports across records are needed; emails, uploads, scheduled or background work; live updates; money, health or personal data; several companies sharing it; other systems it talks to; who maintains it and what they master; budget and deadline. Skip a question the earlier answers already settle, and ask one short follow-up when an answer is vague.
2. **Present the recommendation as a table**: for each decision (repositories, backend language and framework, frontend, database, authentication, runtime and cloud, extra mechanisms, SSR or BFF), the **recommended option**, the **reason tied to the user's own answers**, the main **trade-off**, and the **availability** in the factory (available today or not yet). Say plainly when the product needs something the factory cannot build yet, and what the closest available option would cost the product.
3. **The user confirms or adjusts**: they can accept the whole table, change one row (the agent shows what that changes) or ask for a different trade-off. An accepted row is final for the plan; it becomes an ADR in the generated repository, with the reason.
4. **Then the interview below** runs with the technology settled: identity, product and brand.

If the product needs several things the factory cannot build, the agent says so **before** generating and offers to generate only the available part, so nobody finds out after the code exists.

## The interview

Asked in the user's language, in three groups (identity, product, technology), a few questions at a time. For every choice the agent **recommends one option and says why** (from the decision guide, the team and the product), puts it first, and accepts a free answer. **The agent decides what the user cannot judge.** Product and brand questions are the user's (name, language, colors, domain); technology questions are the agent's to answer when the user says they cannot judge them ("help me decide"): the agent states the decision and the reason in the plan and does not turn it back into a menu, since the plan is where the user can still object. A choice the factory cannot build yet is **shown as not yet available**, never silently dropped: the user can still say they want it, and it goes into the plan as "not available" so the gap is visible.

| Input | What is asked | Available in the factory today | Where the answer lands |
|---|---|---|---|
| Product name | the name people see (`Invoice Manager`) | free text | page title and header, README title, the `<title>` |
| Project name | the slug, proposed from the product name (`invoice-manager`) | kebab-case | repository names `<slug>-backend` and `<slug>-frontend`, Composer package, dev container and Compose names, the PHP namespace in PascalCase (`InvoiceManager`) |
| What it does, who maintains it | one sentence; what the team knows | free text | README description, the ADR of each choice, the team rule of the decision guide |
| Product language | `pt-BR`, `en`… | any | `<html lang>`, every text the end user sees, the Problem Details `title` and `detail`, `ErrorCode::title()`, validation messages |
| Dark mode | yes or no | yes, no | the `.dark` token set and the color-scheme hook, or neither |
| Brand Tokens | primary color as `#rrggbb`, corner radius (sharp, default, round), font (system stack or a named one) | all | CSS variables in `src/index.css`; the generator converts the color with `.claude/skills/new-project/tools/brand-tokens.mjs` |
| Domain | `example.com` | free text | the README and the ADRs (`app.<domain>`, `api.<domain>`), the repository variables to set (`HEALTH_URL`, `VITE_API_URL`); ignored locally |
| Docker Hub user, host ports | the Docker Hub account name; a free port per repository on the VPS | free text, numbers | image names and ports in `docker-compose.prod.yml` and `deploy.yml` (`recipes/vps-deploy.md`) |
| Monthly budget, alert email | an amount, an email | free text | recorded in the plan and the ADRs for the later cloud phase; nothing is created |
| Repositories | backend, web frontend, mobile app | backend and web frontend | what is generated; mobile: not yet available |
| Backend | language and variant | PHP with Laravel | Java, Node, Go: not yet available |
| Frontend | framework and design system | React with shadcn/ui | Angular: not yet available |
| Database | engine | PostgreSQL | MySQL, DynamoDB, Firestore: not yet available |
| Authentication | own JWT or an external provider | none generated yet | own JWT, Cognito, Firebase Auth, Auth0, Clerk: not yet available |
| Extra mechanisms, SSR or BFF | queue, events, files, email, cache, SSR | none | not yet available |

## The plan and the confirmation

After the interview the agent shows **the plan in the conversation**: the repositories with the folder they will be written to, the product answers, every technology choice with its reason, the Brand Tokens, the VPS deployment (Docker Hub user, ports, domain) and what is only recorded for later (budget, the cloud phase), and what the user asked for that is not yet available. Nothing is cost-estimated yet because nothing is deployed; the plan says so. It ends with a question: confirm, change an answer, or cancel.

- **Nothing is written to disk before the user confirms**, not even the output folder. The interview and the plan live only in the conversation, so changing an answer just produces a new plan and leaves nothing behind.
- Changing an answer after generation has started means a new output folder and a fresh run; the old folder is left for the user to delete (the environment may block a deletion, `recipes/dev-commands.md`).
- After the confirmation the plan is the contract: the agent generates exactly what it lists, and each choice is recorded as an ADR in the new repository.

## Adding to an existing project

`/new-project` also has an **add mode** for something new in a project that already exists, such as a mobile app next to an existing backend and web frontend. It reads the project's ADRs and `.template-version`, interviews only about what is new, generates the new repository, and opens pull requests in the existing ones for what the new repository needs (for example, the backend's Terraform). The same guardrails apply: nothing is created before the user confirms the plan, and cloud resources are still created only by the pipeline.

## Terraform layout (cloud phase, not generated today)

Applies only when a project moves from the VPS to AWS or GCP (ADR-0013, ADR-0002).

- **One `infra/terraform/` folder in the backend repository** holds the whole project's infrastructure: backend, frontend hosting (bucket + CDN), database, mechanisms, alerts, budget. Frontend repositories have no Terraform of their own. The bootstrap lives beside it in `infra/bootstrap/`. Exception: PHP, Node and Go projects on AWS keep their Lambda functions and API Gateway in `serverless.yml` (Serverless Framework, with Bref for PHP), linked to the Terraform through SSM parameters (ADR-0002).
- **Community modules first**: well-maintained Terraform Registry modules (`terraform-aws-modules/*` on AWS, such as `lambda`, `apigateway-v2`, `s3-bucket`, `cloudfront`, `sqs`, `rds`; `terraform-google-modules/*` and `GoogleCloudPlatform/*` on GCP), pinned to a version and updated through Renovate like any dependency. Hand-written resources only where no suitable module exists.
- **Remote state** per project: an S3 bucket with native locking on AWS, a GCS bucket on GCP, created by the bootstrap.
- `terraform plan` runs in CI on every pull request touching `infra/`, so the change to the cloud is visible in review; `terraform apply` runs only in the manual deploy workflow.

## What stays with the user

Steps that need a login, a payment or personal data, generated as a `/wizard` script that opens each link and asks for each value:

- the VPS, Portainer, the stacks and their webhooks, the reverse proxy and TLS (`recipes/vps-deploy.md`);
- create the Docker Hub account and its access token;
- register the domain and point its DNS;
- authenticate `gh` on the machine, once;
- set up the Claude Code cloud environment (secrets and the `scripts/agent-setup.sh` setup script);
- for projects with a mobile app: the Apple Developer account (US$ 99/year) and the Google Play developer account (US$ 25 once), the app in both stores, and the store credentials EAS uses;
- give the Claude Code cloud environment access to the new repositories (the Claude GitHub App or a token; private repositories need it), and a **read-only token** for the backend repository where a frontend or mobile app fetches `openapi.json` from a private backend (ADR-0008), stored as a secret in that repository's CI and in the cloud environment;
- the VPS setup of step 5.

Everything else `/new-project` does by itself.
