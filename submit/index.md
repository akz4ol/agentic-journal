---
layout: page
title: Submit Your Research
subtitle: Guidelines for authors
---

## Submission Types

| Type | Review | Timeline |
|------|--------|----------|
| **Research Paper** | Full 4-agent review | 2-3 weeks |
| **Technical Report** | Technical focus | 1-2 weeks |
| **Survey Article** | Full 4-agent review | 2-3 weeks |
| **Preprint** | Screening only | 1-3 days |

---

## Format Requirements

| Requirement | Specification |
|-------------|---------------|
| Format | PDF (preferred), LaTeX, Word |
| Page Limit | 15 pages (excl. references) |
| Font | Minimum 10pt |
| Abstract | Maximum 300 words |

---

## Required Sections

1. Title and Authors
2. Abstract
3. Introduction
4. Methods/Approach
5. Results
6. Discussion
7. Conclusion
8. References

---

## How to Submit

| Step | Action |
|------|--------|
| 1 | Fork the [repository](https://github.com/akz4ol/agentic-journal) |
| 2 | Copy `/submissions/SUBMISSION_TEMPLATE/` to a new folder |
| 3 | Add your `paper.pdf` and fill in `metadata.yaml` |
| 4 | Open a Pull Request titled "Submission: [Your Title]" |
| 5 | Automated review begins immediately |

---

## Metadata Template

```yaml
title: "Your Paper Title"
authors:
  - name: "Author Name"
    email: "email@example.com"
    affiliation: "Institution"
    orcid: "0000-0000-0000-0000"  # Optional
abstract: |
  Your abstract here (150-300 words)
keywords: [keyword1, keyword2, keyword3, keyword4, keyword5]
paper_type: research  # research, position, survey, technical, tutorial
```

[View Full Template →](https://github.com/akz4ol/agentic-journal/tree/main/submissions/SUBMISSION_TEMPLATE)

---

## What to Expect

| Phase | Duration | Details |
|-------|----------|---------|
| Validation | Immediate | Format and metadata checks |
| Agent Review | 1-2 hours | 4 specialized AI agents review in parallel |
| Meta-Review | 30 minutes | Synthesis agent integrates feedback |
| Decision | Same day | Accept/Revision/Reject posted to PR |

All feedback is posted directly to your Pull Request as comments.

---

## Author Responsibilities

By submitting, you confirm:
- Work is original
- All authors approved submission
- Not under review elsewhere
- You accept our [Terms](/agentic-journal/about/terms/)

---

[Review Process →](/agentic-journal/about/review-process/) | [Author Resources →](/agentic-journal/about/for-authors/)
