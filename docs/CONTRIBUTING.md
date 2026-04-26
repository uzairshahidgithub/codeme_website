# Contributing Guide

**Last Updated:** 2026-04-26

Please note that this project is governed by a Code of Conduct. By participating, you are expected to uphold this code.

## How to File an Issue

1. Navigate to the GitHub Issues tab.
2. Select the appropriate template:
   * **Bug Report:** Use this to report unexpected behaviour. Requires reproduction steps, expected outcome, and actual outcome.
   * **Feature Request:** Use this to propose new features or enhancements.
3. **Security Vulnerabilities:** Do **not** open a public issue. Use the private security reporting channel provided in the repository's security advisory section.

## How to Open a Pull Request

1. Branch off the appropriate target (`frontend`, `backend`, or `shared`) per our [Branching Strategy](BRANCHING.md).
2. Commit your changes using Conventional Commits.
3. Push your branch and open a PR against the target branch.
4. **Complete the PR Template:** Fill out all sections, including linking related issues and attaching screenshots for UI changes.
5. **Review Expectations:** Ensure CI checks pass. Maintainers aim to provide initial review feedback within 48 hours.

## Code Style

* **Linting & Formatting:** We use ESLint and Prettier. Configurations are strictly enforced across the monorepo.
* **Pre-commit Hooks:** Husky and `lint-staged` automatically format code and run relevant tests prior to commit.
* **EditorConfig:** Ensure your IDE supports `.editorconfig` to maintain consistent whitespace and line endings across all files.

## Communication

* **Questions:** For architectural questions or implementation help, use GitHub Discussions or the internal Slack/Discord channel.
* **Maintainer SLA:** Maintainers commit to reviewing PRs and answering critical discussions within 2 business days.
* **Escalation:** If an issue is blocked for more than 5 days, escalate by tagging the relevant Tech Lead defined in `CODEOWNERS`.
