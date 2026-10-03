# `/new-project`

The skill that creates a Derived Project from the Template (ADR-0006). It runs in a session inside the Template, **locally on the user's machine and interactively**, never as an Autonomous Run in the cloud: it creates GitHub repositories, runs the Quality Gates (which need Docker and the stack's tools) and depends on the bootstrap, which only the user can apply with their own credentials. Machine requirements: Docker, Git, the `gh` CLI and the cloud CLI (AWS CLI).

## Flow

1. **Interview** through the Decision Guide. Inputs collected:
   - **identity**: project name (becomes the Java package / PHP namespace and the `<project>-<environment>-<resource>` names), the domain (`app.<domain>` / `api.<domain>`), the cloud region, the monthly budget for the budget alert, and the email that receives alerts;
   - **product**: what it does, who maintains it (team), the product language (e.g. `pt-BR`), dark mode (yes / no), Brand Tokens;
   - **technology**: repositories (backend, web frontend, mobile), backend language and variant, frontend framework and design system, cloud, runtime model, database, authentication method, extra mechanisms, SSR / BFF need.
2. **Show the plan** (repositories, every choice, estimated cost) and **wait for the user's confirmation**. Nothing is created before it.
3. **Generate the code** from the recipes, with the rule files (`recipes/repository-layout.md`), and run **every Quality Gate locally**; continue only when they pass.
4. **Create the GitHub repositories, then protect them**: push the generated initial commit to `main` first, then enable the protection (changes only through pull requests, squash only, CI required, no direct push), since protected branches reject the first push. Also create the triage labels and a GitHub Project spanning the repositories. The frontend's initial OpenAPI client is generated from the backend's local `openapi.json`, before the backend exists on GitHub.
5. **Bootstrap, done once by the user**, guided by `/wizard`: a small, separate Terraform in `infra/bootstrap/` that creates **only** the OIDC trust between GitHub and the cloud and the Terraform state bucket, applied with the user's own credentials.
6. **Everything else is created only by the pipeline**: the infrastructure Terraform arrives through a pull request, and the first run of the deploy workflow creates the cloud resources. `/new-project` never runs `terraform apply`, and no cloud credentials for the project stay on the user's machine after the bootstrap.
7. Write the **ADRs** of every choice and the **README**.
8. Hand the user the list of remaining manual steps.

## Adding to an existing project

`/new-project` also has an **add mode** for something new in a project that already exists, such as a mobile app next to an existing backend and web frontend. It reads the project's ADRs and `.template-version`, interviews only about what is new, generates the new repository, and opens pull requests in the existing ones for what the new repository needs (for example, the backend's Terraform). The same guardrails apply: nothing is created before the user confirms the plan, and cloud resources are still created only by the pipeline.

## Terraform layout

- **One `infra/terraform/` folder in the backend repository** holds the whole project's infrastructure: backend, frontend hosting (bucket + CDN), database, mechanisms, alerts, budget. Frontend repositories have no Terraform of their own. The bootstrap lives beside it in `infra/bootstrap/`. Exception: PHP, Node and Go projects on AWS keep their Lambda functions and API Gateway in `serverless.yml` (Serverless Framework, with Bref for PHP), linked to the Terraform through SSM parameters (ADR-0002).
- **Community modules first**: well-maintained Terraform Registry modules (`terraform-aws-modules/*` on AWS, such as `lambda`, `apigateway-v2`, `s3-bucket`, `cloudfront`, `sqs`, `rds`; `terraform-google-modules/*` and `GoogleCloudPlatform/*` on GCP), pinned to a version and updated through Renovate like any dependency. Hand-written resources only where no suitable module exists.
- **Remote state** per project: an S3 bucket with native locking on AWS, a GCS bucket on GCP, created by the bootstrap.
- `terraform plan` runs in CI on every pull request touching `infra/`, so the change to the cloud is visible in review; `terraform apply` runs only in the manual deploy workflow.

## What stays with the user

Steps that need a login, a payment or personal data, generated as a `/wizard` script that opens each link and asks for each value:

- create or pick the cloud account;
- register the domain and point its DNS;
- authenticate `gh` and the cloud CLI on the machine, once;
- set up the Claude Code cloud environment (secrets and the `scripts/agent-setup.sh` setup script);
- create the database on Neon or TiDB, when the project uses one;
- for projects with a mobile app: the Apple Developer account (US$ 99/year) and the Google Play developer account (US$ 25 once), the app in both stores, and the store credentials EAS uses;
- give the Claude Code cloud environment access to the new repositories (the Claude GitHub App or a token; private repositories need it), and a **read-only token** for the backend repository where a frontend or mobile app fetches `openapi.json` from a private backend (ADR-0008), stored as a secret in that repository's CI and in the cloud environment;
- point the domain at the project: the first deploy creates the DNS zone and certificate, and a registrar outside AWS needs its name servers (or the certificate validation records) set once by hand;
- apply the bootstrap (step 5).

Everything else `/new-project` does by itself.
