# VS Code extensions

Every generated repository tells VS Code which extensions it needs, so opening the project is enough to get the language support, the linters and the test runner of its stack. `/new-project` writes the list for the chosen stack only; extension IDs are verified when a recipe is validated.

## Where the list goes

- **Backend repositories** (dev container): `customizations.vscode.extensions` in `.devcontainer/devcontainer.json`. They are installed **inside the container**, next to the toolchain they talk to, so nothing is installed on the host.
- **Web frontend and mobile repositories** (no dev container, they run on the host): `.vscode/extensions.json` with `recommendations`; VS Code offers to install them when the folder is opened.
- The format-on-save settings that go with them live in `.vscode/settings.json` (committed), using the same formatter the lint gate checks, so saving a file never creates a lint failure.

## Every repository

| Extension | ID |
|---|---|
| EditorConfig | `EditorConfig.EditorConfig` |
| Docker | `ms-azuretools.vscode-docker` |
| YAML | `redhat.vscode-yaml` |
| GitHub Actions | `github.vscode-github-actions` |
| Claude Code | `anthropic.claude-code` |

Repositories that hold Terraform (the backend) add **HashiCorp Terraform**, `hashicorp.terraform`.

## Backend, per language

| Stack | Extensions |
|---|---|
| **PHP (Laravel, Symfony, Slim)** | Intelephense `bmewburn.vscode-intelephense-client`; PHP Debug (Xdebug) `xdebug.php-debug`; PHPStan `SanderRonde.phpstan-vscode`; Laravel Pint `open-southeners.laravel-pint`; PHPUnit `recca0120.vscode-phpunit`. Laravel adds the official Laravel extension `laravel.vscode-laravel`. |
| **Java (Spring Boot, Quarkus, plain)** | Extension Pack for Java `vscjava.vscode-java-pack` (language support, debugger, test runner, Maven or Gradle); Checkstyle `shengchen.vscode-checkstyle`. Spring Boot adds the Spring Boot Extension Pack `vmware.vscode-boot-dev-pack`; Quarkus adds `redhat.vscode-quarkus`. |
| **Node (custom stack, NestJS, plain)** | ESLint `dbaeumer.vscode-eslint`; Prettier `esbenp.prettier-vscode`; Vitest `vitest.explorer`. |
| **Go** (learning stack) | Go `golang.go`, which brings the debugger and the test runner and runs golangci-lint when it is set as the lint tool in `.vscode/settings.json`. |

## Web frontend and mobile

| Stack | Extensions |
|---|---|
| **React** | ESLint `dbaeumer.vscode-eslint`; Prettier `esbenp.prettier-vscode`; Vitest `vitest.explorer`; Tailwind CSS IntelliSense `bradlc.vscode-tailwindcss`. |
| **Angular** | Angular Language Service `Angular.ng-template`; ESLint `dbaeumer.vscode-eslint`; Prettier `esbenp.prettier-vscode`; Vitest `vitest.explorer` (or Jest `orta.vscode-jest` when the project uses Jest). |
| **Mobile (Expo)** | Expo Tools `expo.vscode-expo-tools`; ESLint `dbaeumer.vscode-eslint`; Prettier `esbenp.prettier-vscode`; Jest `orta.vscode-jest`; Tailwind CSS IntelliSense `bradlc.vscode-tailwindcss` (NativeWind). |

## Rules

- **Only what the stack uses.** A PHP project never lists the Java pack; a recipe that adds a tool (a new linter, a new test runner) adds its extension in the same change.
- **Extensions never replace a gate.** They give feedback while typing; the Quality Gates and the `project` commands (`recipes/dev-commands.md`) remain the authority.
- **Editor settings follow the tools.** Format on save uses the formatter of the lint gate (Pint, Prettier, google-java-format through Spotless, gofmt); no personal preferences are committed.
- The README's *Requirements* section mentions the Dev Containers extension for backends; the stack's own extensions are installed automatically and need no mention.
