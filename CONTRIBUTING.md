# Contributing to Agentic Journal

Thanks for your interest. This project publishes open-access AI research using a multi-agent peer-review pipeline. Contributions, bug reports, and reviewer applications are all welcome.

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues should be reported per the [Security Policy](SECURITY.md), not as public issues.

## Ways to contribute

- **Submit a paper for review** — open a [Paper Submission](https://github.com/akz4ol/agentic-journal/issues/new/choose) issue (template coming in a follow-up)
- **Apply to review** — open an issue describing your background and fields of expertise
- **Fix bugs or add features** — see issues labeled `good first issue` or `help wanted`
- **Improve documentation** — small PRs welcome, no issue required
- **Iterate on prompts or evals** — see the agent contribution guide below

## Local development

Requirements: Python 3.11+, Ruby 3.1+ (for Jekyll), Bundler.

```bash
# 1. Clone
git clone https://github.com/akz4ol/agentic-journal.git
cd agentic-journal

# 2. Python environment
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Jekyll site (uses GitHub Pages defaults, no Gemfile yet)
gem install bundler jekyll
jekyll serve  # http://localhost:4000

# 4. Configure secrets
cp .env.example .env  # or set ANTHROPIC_API_KEY in your shell

# 5. Run an agent locally
python -m agents.<agent_name>  # see agents/ for available entry points
```

Reproducible Docker setup is tracked in [#14](https://github.com/akz4ol/agentic-journal/issues/14).

## Branch model

- `main` is the default and protected branch — every change lands via PR
- Feature branches: `feat/issue-<number>-<slug>` (e.g. `feat/issue-12-ci-matrix`)
- Fix branches: `fix/issue-<number>-<slug>`
- Docs-only: `docs/<slug>`

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short summary>

<body — what and why, not how>

Refs #<issue>
```

Common types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`.

Example:

```
feat(agents): add reproducibility scorer to review pipeline

Scores data + code availability against a 5-point rubric and surfaces
the result in the Trust Panel.

Refs #17
```

## Pull request process

1. Branch off the latest `main`
2. Implement; keep PRs focused — one logical change per PR
3. Update tests and docs in the same PR
4. Open the PR with a body that includes:
   - **Summary** of what changed
   - **Why** (linked to the issue if there is one — `Closes #N` to auto-close)
   - **Test plan** — how you verified it
   - **Follow-ups** — anything intentionally deferred
5. Address review comments by pushing additional commits (we squash on merge, so don't worry about a tidy history during review)
6. Maintainer merges once CI is green and at least one approval is recorded

## Agent and prompt contributions

Agents and prompts are first-class code in this repo:

- **Prompts live under `prompts/`** and are versioned in git like any other source
- A change that modifies agent behavior must include an updated entry in the eval harness ([#17](https://github.com/akz4ol/agentic-journal/issues/17)) once that lands; until then, describe the expected behavioral change in the PR body
- Note any cost impact (tokens / USD per run) where measurable
- The `agents/REGISTRY` will be updated as part of [#16](https://github.com/akz4ol/agentic-journal/issues/16); reference the agent name + version in your PR

## Licensing and SPDX

This project is licensed under [AGPL-3.0](LICENSE). All new source files should include an SPDX header at the top:

```python
# SPDX-License-Identifier: AGPL-3.0-or-later
```

```html
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
```

If you contribute substantial work, you retain copyright; you license it to the project under AGPL-3.0 by submitting it.

## Questions

- General: open a [Discussion](https://github.com/akz4ol/agentic-journal/discussions) (enable in repo settings if not yet active)
- Bugs and features: open an [Issue](https://github.com/akz4ol/agentic-journal/issues)
- Security: see [SECURITY.md](SECURITY.md)
- Conduct concerns: conduct@clearlensjournal.com
