# One repository can be created on its own through the Generator

A Derived Project is generated as a whole: the interview decides every repository it needs. Ensemble's **Novo repositório** creates **one** repository, of one kind, without a project or an interview, for a user who already knows the stack. It is a **repository request**: an issue of the Template, labelled `repository-request`, that the Generator routine (ADR-0016) runs with `create-repo <n>` in a new **repository mode** of `/new-project`. The repository is generated from its Stack Recipe, passes its gates, gets the agent team and is published, exactly as one repository of a project is (`recipes/generator-routine.md`, *Creating one repository*).

## Considered Options

- **Run the whole `/new-project` and ask for only one repository**: rejected. It would repeat an interview whose answers the wizard already collected and could not skip the product and brand questions that only make sense for a full project.
- **Create an empty repository and let the user fill it in**: rejected. The value is a repository that already passes the Quality Gates and carries the agent team.

## Consequences

- The request carries the kind, the stack option, the name, the owner and the visibility. The stack option must be one the Stack Recipes list as available for that kind; the wizard shows only those.
- The product and brand answers a full project needs (name, language, colors, domain) are taken from defaults or from the project the user attaches the repository to; a request without them still generates a working repository, and the pull request description says what was defaulted.
- Joining a project is Ensemble's concern. The Generator never touches a project.
- When the session cannot create or push to the repository, the run fails on `repositories` and leaves no partial repository behind, as in draft mode.
