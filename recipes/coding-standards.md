# Coding standards

Source of the `CODING_STANDARDS.md` that `/new-project` places at the root of every repository it creates. `/code-review` reads that file and checks every pull request against it. **Every rule that a tool can check is enforced by that tool in CI** (the tool is named next to the rule); `/code-review` covers only what needs judgement.

Architecture and naming rules live in the stack recipes (`recipes/backend/`, `recipes/frontend/`) and `recipes/quality-gates.md`; this file covers how code is written inside that structure.

## SOLID, as the architecture already enforces it

| Principle | How it holds | Checked by |
|---|---|---|
| Single responsibility | One use case per class with a single public `execute`; controller, validator, repository and service are separate classes | ArchUnit / Deptrac / dependency-cruiser, review |
| Open/closed | New behaviour arrives as a new use case or a new adapter, not by editing existing ones | review |
| Liskov substitution | Every adapter fulfils its port; tests swap adapters for mocks | tests |
| Interface segregation | One port per repository or service, holding only the methods use cases call | review |
| Dependency inversion | `application` depends on interfaces; `infra` implements them | ArchUnit / Deptrac / dependency-cruiser |

## Use case shape

```java
public class CreateRoleUseCase {
  // dependencies (constructor-injected), logContext

  private void validateRole(CreateRoleUseCaseInputDto input) { ... }        // 1st used by execute
  private boolean roleNameAlreadyExists(String roleName) { ... }            // 2nd
  private void saveRole(CreateRoleUseCaseInputDto input) { ... }            // 3rd

  public void execute(CreateRoleUseCaseInputDto input) { ... }              // always last
}
```

- **One public method, `execute`**; everything else is `private`. (ArchUnit) This applies to **use cases only**: services, repositories, adapters, entities and other dependencies may expose as many public methods as their role needs.
- **Private methods are declared in the order `execute` calls them**, so the class reads top to bottom as the flow it implements. (review)
- **`execute` is always the last method of the class.** (ArchUnit custom rule / review)
- **Descriptive variable names** that state what the value means: `roleNameAlreadyExists`, `savedRole`, `permissionsToSync`, never `result`, `data`, `flag`, `temp`, `aux`, `obj` or single letters outside short lambdas. (review; Checkstyle `IllegalIdentifierName` / PHPMD naming rules / ESLint `id-denylist` for the banned names)

## Component shape (frontend)

- **One component per file.** (`react/no-multi-comp`; angular-eslint)
- **Components are dumb**: screens are split into sections, every component receives its data through props, and the data access, calls and screen rules live in the page's own `hooks/` folder (React hooks; Angular services with signals), which returns the props of each section. Very small UI-only logic (at most 5 statements in the component function) may stay in the component. Types live in `types/` folders, never in the component or hook file. (ESLint `max-statements` and the type selectors, dependency-cruiser rule 3)
- **No logic in templates / JSX**: complex conditions and computations become a descriptively named variable or function before the `return`, or a `computed()`. (review; `@angular-eslint/template/no-call-expression`)
- **At most 5 props / inputs**; beyond that, group them into an object or split the component. (custom ESLint rule / review)
- **No prop drilling past 2 levels**: use feature state or context instead. (review)
- **Fixed order inside a component**: hooks / injections → derived state → handlers → effects → render, so it reads top to bottom like a use case. (review)
- **Handler names**: React handlers `handle<Event>` and callback props `on<Event>` (`handleSave`, `onSave`) via `react/jsx-handler-names`; Angular outputs named for the event without an `on` prefix (style guide).
- **Effects only synchronize with something external**, never derive state (`useEffect` / `effect()` computing a value is forbidden). (review; `react-hooks/exhaustive-deps` on)
- **No `any` and no non-null assertions (`!`).** (`@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-non-null-assertion`)

## Size and complexity limits

Hard limits, failing CI:

| Limit | Value | Java | PHP | Frontend / mobile |
|---|---|---|---|---|
| Method / function length | 30 lines | Checkstyle `MethodLength` | PHPMD `ExcessiveMethodLength` | ESLint `max-lines-per-function` |
| Cyclomatic complexity | 10 | Checkstyle `CyclomaticComplexity` / PMD | PHPMD `CyclomaticComplexity` | ESLint `complexity` |
| Parameters | 4 (above that, an object / DTO) | Checkstyle `ParameterNumber` | PHPMD `ExcessiveParameterList` | ESLint `max-params` |
| Nesting depth | 3 | Checkstyle `NestedIfDepth`, `NestedForDepth` | PHPStan / PHPMD custom rule | ESLint `max-depth` |
| File / class length | 300 lines | Checkstyle `FileLength` | PHPMD `ExcessiveClassLength` | ESLint `max-lines` |
| Duplicated code | blocks of 50+ repeated tokens | PMD CPD | PMD CPD (PHP) | jscpd |

A tool's threshold is not always the limit: PHPMD reports a value **at or above** its `minimum` / `reportLevel`, so "at most 30 lines" is configured as 31 (see `recipes/backend/php.md`). Each recipe configures the tool so the table's value is the largest value that still passes.

## Writing rules

| Rule | Java | PHP | Frontend / mobile |
|---|---|---|---|
| **Early return** (guard clauses) instead of nested `if`s | nesting limit above | nesting limit above; PHPMD `ElseExpression` | nesting limit above |
| **No magic numbers or strings**: named constants or enums | Checkstyle `MagicNumber` (strings: review) | PHPStan / PHPMD custom rule (strings: review) | `@typescript-eslint/no-magic-numbers` (strings: review) |
| **No boolean flag parameters** that switch behaviour (`create(role, true)`): split into two methods | PMD custom rule | PHPMD `BooleanArgumentFlag` | ESLint custom rule |
| **Names say what things are**, no abbreviations (`permission`, not `perm`); methods start with a verb | review | review; PHPMD `ShortVariable` | review |
| **Immutable by default**: `record`, `final`, `const`, `readonly`; mutate only when needed | Checkstyle `FinalLocalVariable`, `FinalParameters` | `readonly` classes and properties; PHPStan | `prefer-const`, `readonly` |
| **Never swallow exceptions**: no empty `catch`, no catch that only logs and carries on, no generic catch-all | Checkstyle `EmptyCatchBlock`, PMD `AvoidCatchingGenericException` (log-and-continue: review) | PHPMD `EmptyCatchBlock` (catch-all `\Throwable` / log-and-continue: review) | `no-empty`, `@typescript-eslint/no-floating-promises` (log-and-continue: review) |
| **No sentinel returned from lookups**: `Optional` in Java, nullable type in PHP, typed `undefined` in TypeScript | PMD `ReturnEmptyCollectionRatherThanNull` + review | PHPStan max level + review | `strictNullChecks` + review |
| **No premature abstraction** (YAGNI): extract only on the third repetition | review | review | review |

## Comments

Code carries **no explanatory comments**: names, types and small functions say what the code does. A comment is kept only when a tool reads it:

- type annotations a static analyzer needs (PHPStan `@param array<…>`, `@return`, `@var`, `@throws`, `@template`);
- documentation a tool publishes (the controller docblock that Scramble turns into the OpenAPI summary and description);
- directives (`/// <reference …>`, `# syntax=` in a Dockerfile, a shebang, a lint-disable line with its reason, `@ts-expect-error` with its reason);
- the `comment` field of a rule in dependency-cruiser, which its reports print.

This applies to tests too: no `// given` / `// when` / `// then`; the three phases are separated by one blank line. The explanatory comments that skeletons and published vendor configuration files ship with (Laravel's configuration files, Scramble's, the generated `public/index.php`) are removed when the repository is generated, with a tokenizer-based script so strings are never touched, followed by the formatter. `/code-review` rejects a new explanatory comment.

## Tooling

Checkstyle and PMD (Java), PHPMD, PHPStan and PMD CPD (PHP), ESLint and jscpd (frontend and mobile) in CI, plus `/code-review` for what needs judgement. No SonarQube / SonarCloud: it is free only for public repositories, and these tools already cover the measurable rules.
