# Agentic Journal - System Architecture

## Overview

A fully automated scholarly publication system with multi-agent AI peer review.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC JOURNAL SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  SUBMISSION  │───▶│   REVIEW     │───▶│  DECISION    │───▶│  PUBLISH  │ │
│  │   GATEWAY    │    │   PIPELINE   │    │   ENGINE     │    │  SYSTEM   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │                  │        │
│         ▼                   ▼                   ▼                  ▼        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER (GitHub + Storage)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Submission Gateway

### Entry Points

```
┌─────────────────────────────────────────────────────────┐
│                   SUBMISSION GATEWAY                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  GitHub PR  │  │  Web Form   │  │  API/CLI    │     │
│  │  (Primary)  │  │ (Optional)  │  │ (Advanced)  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│                ┌─────────────────┐                      │
│                │   VALIDATOR     │                      │
│                │  - Format check │                      │
│                │  - Metadata     │                      │
│                │  - Plagiarism   │                      │
│                │  - Scope        │                      │
│                └────────┬────────┘                      │
│                         │                               │
│                         ▼                               │
│                ┌─────────────────┐                      │
│                │  SUBMISSION DB  │                      │
│                │  (GitHub Issues │                      │
│                │   or Database)  │                      │
│                └─────────────────┘                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Submission Schema

```yaml
submission:
  id: "AJ-2026-001"
  status: "submitted" | "screening" | "review" | "revision" | "accepted" | "rejected"
  created_at: "2026-01-01T12:00:00Z"
  updated_at: "2026-01-01T12:00:00Z"

  manuscript:
    title: "Paper Title"
    abstract: "..."
    keywords: ["ml", "nlp"]
    paper_type: "research" | "technical" | "survey" | "preprint"
    pdf_url: "https://..."
    source_url: "https://..." # LaTeX/Word

  authors:
    - name: "Author Name"
      email: "author@example.com"
      affiliation: "Institution"
      orcid: "0000-0000-0000-0000"
      corresponding: true

  metadata:
    word_count: 8500
    page_count: 12
    figure_count: 5
    table_count: 3
    reference_count: 42

  artifacts:
    code_url: "https://github.com/..."
    data_url: "https://..."

  workflow:
    screening_passed: null
    review_started: null
    review_completed: null
    decision_made: null
    revision_requested: null
    published: null
```

---

## 2. Review Pipeline

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REVIEW PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                         ┌─────────────────┐                             │
│                         │   ORCHESTRATOR  │                             │
│                         │  (Coordinator)  │                             │
│                         └────────┬────────┘                             │
│                                  │                                       │
│            ┌─────────────────────┼─────────────────────┐                │
│            │                     │                     │                │
│            ▼                     ▼                     ▼                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   TECHNICAL     │  │    DOMAIN       │  │    ETHICS       │         │
│  │   REVIEWER      │  │   REVIEWER      │  │   REVIEWER      │         │
│  │                 │  │                 │  │                 │         │
│  │ - Methodology   │  │ - Novelty       │  │ - Compliance    │         │
│  │ - Validity      │  │ - Significance  │  │ - Misuse Risk   │         │
│  │ - Reproducible  │  │ - Literature    │  │ - Bias          │         │
│  │ - Accuracy      │  │ - Evidence      │  │ - Impact        │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│           │           ┌────────┴────────┐           │                   │
│           │           │    CLARITY      │           │                   │
│           │           │   REVIEWER      │           │                   │
│           │           │                 │           │                   │
│           │           │ - Writing       │           │                   │
│           │           │ - Figures       │           │                   │
│           │           │ - Structure     │           │                   │
│           │           │ - Accessibility │           │                   │
│           │           └────────┬────────┘           │                   │
│           │                    │                    │                   │
│           └────────────────────┼────────────────────┘                   │
│                                ▼                                         │
│                      ┌─────────────────┐                                │
│                      │  META-REVIEWER  │                                │
│                      │                 │                                │
│                      │ - Aggregate     │                                │
│                      │ - Synthesize    │                                │
│                      │ - Decide        │                                │
│                      └─────────────────┘                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Review Schema

```yaml
review:
  submission_id: "AJ-2026-001"
  agent: "technical" | "domain" | "ethics" | "clarity"
  version: 1
  created_at: "2026-01-02T10:00:00Z"

  scores:
    dimension_1: 4  # 1-5
    dimension_2: 3
    dimension_3: 5
    dimension_4: 4
    overall: 4.0

  evaluation:
    summary: "Brief overall assessment..."
    strengths:
      - "Strong methodology..."
      - "Clear presentation..."
    weaknesses:
      - "Limited evaluation..."
      - "Missing related work..."
    questions:
      - "Can you clarify...?"

  recommendation: "accept" | "minor_revision" | "major_revision" | "reject"
  confidence: "high" | "medium" | "low"

meta_review:
  submission_id: "AJ-2026-001"
  created_at: "2026-01-03T10:00:00Z"

  agent_reviews:
    technical: { score: 4.0, recommendation: "accept" }
    domain: { score: 3.5, recommendation: "minor_revision" }
    ethics: { score: 4.5, recommendation: "accept" }
    clarity: { score: 4.0, recommendation: "accept" }

  synthesis:
    consensus_points: ["..."]
    disagreements: ["..."]
    key_concerns: ["..."]

  final_decision: "minor_revision"
  decision_rationale: "..."

  author_action_items:
    - "Address concern X..."
    - "Clarify section Y..."
```

---

## 3. Agent Prompts

### Technical Reviewer

```markdown
# Technical Reviewer Agent

You are the Technical Reviewer for Agentic Journal. Evaluate the submission's
technical quality and reproducibility.

## Your Role
Assess methodology, mathematical validity, experimental design, and whether
results can be reproduced from the paper.

## Evaluation Dimensions (Score 1-5)

1. **Methodology** - Is the approach sound and appropriate for the problem?
2. **Validity** - Are mathematical/statistical analyses correct?
3. **Reproducibility** - Can results be replicated from the description?
4. **Technical Accuracy** - Are technical claims well-supported?

## Output Format

```yaml
scores:
  methodology: X
  validity: X
  reproducibility: X
  technical_accuracy: X
  overall: X.X

evaluation:
  summary: |
    [2-3 sentence overall assessment]
  strengths:
    - [Strength 1]
    - [Strength 2]
  weaknesses:
    - [Weakness 1]
    - [Weakness 2]
  questions:
    - [Question for authors]

recommendation: [accept|minor_revision|major_revision|reject]
confidence: [high|medium|low]
```

## Guidelines
- Focus ONLY on technical aspects
- Be specific with citations to paper sections
- Distinguish between fatal flaws and minor issues
- Consider the paper type (research vs technical report)
```

### Domain Reviewer

```markdown
# Domain Reviewer Agent

You are the Domain Reviewer for Agentic Journal. Evaluate the submission's
contribution to the field.

## Your Role
Assess novelty, significance, literature coverage, and whether claims are
supported by evidence.

## Evaluation Dimensions (Score 1-5)

1. **Novelty** - What is new relative to prior work?
2. **Significance** - How important is this contribution?
3. **Literature Coverage** - Is related work adequately addressed?
4. **Evidence Quality** - Do results support the claims?

## Output Format
[Same YAML structure as Technical Reviewer]

## Guidelines
- Assess against current state of the field
- Note if important related work is missing
- Evaluate claim strength vs evidence provided
- Consider impact potential
```

### Ethics Reviewer

```markdown
# Ethics Reviewer Agent

You are the Ethics Reviewer for Agentic Journal. Evaluate responsible AI
considerations and potential societal impact.

## Your Role
Assess ethical compliance, misuse potential, bias considerations, and
broader societal implications.

## Evaluation Dimensions (Score 1-5)

1. **Ethical Compliance** - Are research ethics guidelines followed?
2. **Misuse Risk** - Could this enable harmful applications?
3. **Bias Consideration** - Are fairness issues addressed?
4. **Societal Impact** - Are broader implications considered?

## Output Format
[Same YAML structure as Technical Reviewer]

## Guidelines
- Flag obvious ethical concerns
- Consider dual-use potential
- Assess data/model bias treatment
- Note missing ethics considerations
```

### Clarity Reviewer

```markdown
# Clarity Reviewer Agent

You are the Clarity Reviewer for Agentic Journal. Evaluate presentation
quality and accessibility.

## Your Role
Assess writing quality, figure effectiveness, paper structure, and whether
the target audience can understand the work.

## Evaluation Dimensions (Score 1-5)

1. **Writing Quality** - Is the prose clear and professional?
2. **Figure Effectiveness** - Do visualizations communicate well?
3. **Structure** - Is the paper well-organized?
4. **Accessibility** - Can the target audience understand it?

## Output Format
[Same YAML structure as Technical Reviewer]

## Guidelines
- Focus on communication, not content correctness
- Note specific unclear passages
- Assess figure/table quality
- Consider audience appropriateness
```

### Meta-Reviewer

```markdown
# Meta-Reviewer Agent

You are the Meta-Reviewer for Agentic Journal. Synthesize the four agent
reviews into a final decision.

## Your Role
Aggregate reviews, identify consensus and disagreements, and make a final
recommendation with clear rationale.

## Input
You will receive four reviews (Technical, Domain, Ethics, Clarity) with
scores, evaluations, and recommendations.

## Output Format

```yaml
synthesis:
  average_score: X.X
  score_breakdown:
    technical: X.X
    domain: X.X
    ethics: X.X
    clarity: X.X

  consensus_points:
    - [Point all/most reviewers agree on]

  disagreements:
    - issue: [Description]
      positions: [How reviewers differ]
      resolution: [Your judgment]

  key_concerns:
    - [Critical issue that must be addressed]

decision: [accept|minor_revision|major_revision|reject]

rationale: |
  [2-3 paragraph explanation of decision]

author_action_items:
  - [Specific action 1]
  - [Specific action 2]
```

## Decision Thresholds (Guidelines)
- **Accept**: Average ≥ 4.0, no dimension below 3, no major concerns
- **Minor Revision**: Average 3.5-4.0, addressable issues
- **Major Revision**: Average 3.0-3.5, significant but fixable issues
- **Reject**: Average < 3.0, or critical flaw in any dimension
```

---

## 4. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AUTHOR                                                                      │
│    │                                                                         │
│    │ 1. Submit PR with paper + metadata.yaml                                │
│    ▼                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ GITHUB REPO: agentic-journal                                        │    │
│  │                                                                      │    │
│  │  /submissions/                                                       │    │
│  │    └── AJ-2026-001/                                                 │    │
│  │        ├── paper.pdf                                                │    │
│  │        ├── metadata.yaml                                            │    │
│  │        └── source/ (optional)                                       │    │
│  │                                                                      │    │
│  │  /reviews/                                                          │    │
│  │    └── AJ-2026-001/                                                 │    │
│  │        ├── technical.yaml                                           │    │
│  │        ├── domain.yaml                                              │    │
│  │        ├── ethics.yaml                                              │    │
│  │        ├── clarity.yaml                                             │    │
│  │        └── meta-review.yaml                                         │    │
│  │                                                                      │    │
│  │  /papers/                                                           │    │
│  │    └── 2026-01-15-paper-title.md (published)                        │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│    │                                                                         │
│    │ 2. GitHub Action triggered                                             │
│    ▼                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ GITHUB ACTION: review-pipeline.yml                                   │    │
│  │                                                                      │    │
│  │  Jobs:                                                              │    │
│  │   1. validate    - Check format, extract metadata                   │    │
│  │   2. screen      - Plagiarism, scope check                          │    │
│  │   3. review      - Run 4 agent reviews (parallel)                   │    │
│  │   4. synthesize  - Meta-review + decision                           │    │
│  │   5. notify      - Comment on PR with results                       │    │
│  │   6. publish     - If accepted, create paper page                   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│    │                                                                         │
│    │ 3. Results posted to PR                                                │
│    ▼                                                                         │
│  AUTHOR                                                                      │
│    │                                                                         │
│    │ 4. If revision: update PR, re-trigger                                  │
│    │    If accepted: paper published to site                                │
│    ▼                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PUBLISHED SITE                                                       │    │
│  │                                                                      │    │
│  │  /papers/2026-01-15-paper-title/                                    │    │
│  │    - Full paper content                                             │    │
│  │    - All 4 agent reviews                                            │    │
│  │    - Meta-review + decision rationale                               │    │
│  │    - Author response (if revised)                                   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Components

### Directory Structure

```
agentic-journal/
├── .github/
│   └── workflows/
│       ├── review-pipeline.yml    # Main automation
│       ├── validate.yml           # PR validation
│       └── publish.yml            # Paper publication
│
├── scripts/
│   ├── validate_submission.py     # Format/metadata validation
│   ├── run_review.py              # Execute agent review
│   ├── synthesize_reviews.py      # Meta-review generation
│   ├── publish_paper.py           # Create paper page
│   └── notify.py                  # PR commenting
│
├── agents/
│   ├── __init__.py
│   ├── base.py                    # Base agent class
│   ├── technical.py               # Technical reviewer
│   ├── domain.py                  # Domain reviewer
│   ├── ethics.py                  # Ethics reviewer
│   ├── clarity.py                 # Clarity reviewer
│   └── meta.py                    # Meta-reviewer
│
├── prompts/
│   ├── technical.md
│   ├── domain.md
│   ├── ethics.md
│   ├── clarity.md
│   └── meta.md
│
├── submissions/                   # Incoming papers
│   └── .gitkeep
│
├── reviews/                       # Generated reviews
│   └── .gitkeep
│
├── _posts/                        # Published papers
│   └── .gitkeep
│
├── requirements.txt
└── config.yaml                    # System configuration
```

### GitHub Action Workflow

```yaml
# .github/workflows/review-pipeline.yml

name: Review Pipeline

on:
  pull_request:
    paths:
      - 'submissions/**'
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    outputs:
      submission_id: ${{ steps.validate.outputs.submission_id }}
      valid: ${{ steps.validate.outputs.valid }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - id: validate
        run: python scripts/validate_submission.py
        env:
          PR_NUMBER: ${{ github.event.pull_request.number }}

  screen:
    needs: validate
    if: needs.validate.outputs.valid == 'true'
    runs-on: ubuntu-latest
    outputs:
      passed: ${{ steps.screen.outputs.passed }}
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - id: screen
        run: python scripts/screen_submission.py
        env:
          SUBMISSION_ID: ${{ needs.validate.outputs.submission_id }}

  review:
    needs: [validate, screen]
    if: needs.screen.outputs.passed == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent: [technical, domain, ethics, clarity]
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: python scripts/run_review.py --agent ${{ matrix.agent }}
        env:
          SUBMISSION_ID: ${{ needs.validate.outputs.submission_id }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: review-${{ matrix.agent }}
          path: reviews/${{ needs.validate.outputs.submission_id }}/${{ matrix.agent }}.yaml

  synthesize:
    needs: [validate, review]
    runs-on: ubuntu-latest
    outputs:
      decision: ${{ steps.meta.outputs.decision }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          path: reviews/${{ needs.validate.outputs.submission_id }}
          merge-multiple: true
      - run: pip install -r requirements.txt
      - id: meta
        run: python scripts/synthesize_reviews.py
        env:
          SUBMISSION_ID: ${{ needs.validate.outputs.submission_id }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  notify:
    needs: [validate, synthesize]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: python scripts/notify.py
        env:
          SUBMISSION_ID: ${{ needs.validate.outputs.submission_id }}
          DECISION: ${{ needs.synthesize.outputs.decision }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  publish:
    needs: [validate, synthesize]
    if: needs.synthesize.outputs.decision == 'accept'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: python scripts/publish_paper.py
        env:
          SUBMISSION_ID: ${{ needs.validate.outputs.submission_id }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Publish paper ${{ needs.validate.outputs.submission_id }}"
```

---

## 6. API Design (Optional Web Interface)

```yaml
# REST API Endpoints

POST /api/submissions
  # Create new submission
  Request:
    - paper: File (PDF)
    - metadata: JSON
  Response:
    - submission_id: string
    - status: "submitted"

GET /api/submissions/{id}
  # Get submission status
  Response:
    - submission_id: string
    - status: string
    - reviews: array (if completed)
    - decision: string (if decided)

GET /api/submissions/{id}/reviews
  # Get all reviews for submission
  Response:
    - technical: Review
    - domain: Review
    - ethics: Review
    - clarity: Review
    - meta: MetaReview

POST /api/submissions/{id}/revision
  # Submit revision
  Request:
    - paper: File (PDF)
    - response: string (point-by-point)
  Response:
    - status: "revision_submitted"

GET /api/papers
  # List published papers
  Response:
    - papers: array

GET /api/papers/{id}
  # Get published paper with reviews
  Response:
    - paper: Paper
    - reviews: Reviews
```

---

## 7. Configuration

```yaml
# config.yaml

journal:
  name: "Agentic Journal"
  submission_prefix: "AJ"

review:
  model: "claude-sonnet-4-20250514"  # or claude-opus-4-20250514 for higher quality
  max_tokens: 4096
  temperature: 0.3

  agents:
    technical:
      enabled: true
      weight: 1.0
    domain:
      enabled: true
      weight: 1.0
    ethics:
      enabled: true
      weight: 0.8
    clarity:
      enabled: true
      weight: 0.8

  thresholds:
    accept: 4.0
    minor_revision: 3.5
    major_revision: 3.0

screening:
  plagiarism_threshold: 0.15  # 15% max similarity
  min_pages: 4
  max_pages: 15
  required_sections:
    - abstract
    - introduction
    - methods
    - results
    - conclusion
    - references

notifications:
  email: false  # Future
  github_comment: true

publishing:
  auto_publish: true  # Auto-publish accepted papers
  doi: false  # Future: Crossref integration
```

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|------------|
| API key exposure | GitHub Secrets, never in code |
| Prompt injection | Sanitize paper content before review |
| Spam submissions | Rate limiting, GitHub account age check |
| Gaming reviews | Randomize agent behavior slightly |
| Data privacy | No PII stored, author consent required |

---

## Next Steps

1. **Phase 1**: Implement validation + screening scripts
2. **Phase 2**: Build agent review system
3. **Phase 3**: Create meta-review synthesizer
4. **Phase 4**: Set up GitHub Actions pipeline
5. **Phase 5**: Add notification system
6. **Phase 6**: Build web interface (optional)
