# Security Policy

## Reporting a Vulnerability

**Please do not open public issues or pull requests for security vulnerabilities.**

The preferred channel is GitHub's private vulnerability reporting:

1. Go to <https://github.com/akz4ol/agentic-journal/security/advisories/new>
2. Fill in the form with reproduction steps, impact, and suggested mitigation
3. We will acknowledge receipt within **3 business days** and aim to provide an initial assessment within **7 business days**

If GitHub Security Advisories is not available to you, email **security@clearlensjournal.com** with the same information. PGP key on request.

## Scope

In scope:

- The clearlensjournal.com web application and supporting Jekyll site in this repository
- The agent pipeline (`agents/`, `prompts/`, `scripts/`) and any service code
- The audit ledger and authentication / submission flows
- Prompt-injection vulnerabilities in user-supplied content (papers, reviews, comments) that affect agent behavior or escalate privilege

Out of scope:

- Findings against third-party services we depend on (Anthropic API, GitHub Pages, external indexers) — please report those upstream
- Denial-of-service attacks or volumetric testing
- Issues requiring physical access to a maintainer's device
- Reports generated solely by automated scanners without a working proof of concept

## Disclosure Process

1. You report privately via the channels above
2. We confirm and triage; severity classified using CVSS 3.1
3. We develop a fix on a private branch and prepare an advisory
4. We coordinate a disclosure date with you (target: within 90 days of confirmed report, sooner for actively exploited issues)
5. The advisory and fix ship together; CVE assigned where applicable
6. We publicly credit reporters who wish to be named

## Safe Harbor

Good-faith security research conducted under this policy is authorized. We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations and service degradation
- Only interact with accounts they own or have explicit permission to test
- Do not exfiltrate data beyond the minimum needed to demonstrate a vulnerability
- Report findings promptly and give us reasonable time to remediate before public disclosure

If you are unsure whether a planned action is in scope, contact us first.
