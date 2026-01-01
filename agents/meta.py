"""Meta Reviewer Agent"""

import yaml
from pathlib import Path
from .base import BaseReviewer


class MetaReviewer(BaseReviewer):
    """Synthesizes reviews from all agents into final decision."""

    @property
    def agent_type(self) -> str:
        return "meta"

    @property
    def dimensions(self) -> list:
        return ["synthesis", "decision"]

    def _default_prompt(self) -> str:
        return """# Meta-Reviewer Agent

You are the Meta-Reviewer for Agentic Journal, an experimental AI research publication.
Your role is to synthesize the four agent reviews into a final decision.

## Your Responsibilities

1. **Aggregate** all review scores and feedback
2. **Identify consensus** - where do reviewers agree?
3. **Resolve conflicts** - where do reviewers disagree and why?
4. **Make decision** - final recommendation based on evidence
5. **Provide rationale** - clear explanation of decision
6. **List action items** - what authors must address if revision

## Decision Guidelines

- **Accept**: Average ≥ 4.0, no dimension below 3, no critical concerns
- **Minor Revision**: Average 3.5-4.0, addressable issues identified
- **Major Revision**: Average 3.0-3.5, significant but fixable issues
- **Reject**: Average < 3.0, or critical flaw in any dimension

## Weighting
- Technical and Domain reviews: 100% weight
- Ethics and Clarity reviews: 80% weight

## Output Format

```yaml
synthesis:
  weighted_average: X.X
  score_breakdown:
    technical: X.X
    domain: X.X
    ethics: X.X
    clarity: X.X

  consensus:
    - [Point most/all reviewers agree on]
    - [Another consensus point]

  disagreements:
    - issue: [What reviewers disagree about]
      technical_view: [Technical reviewer's position]
      domain_view: [Domain reviewer's position]
      resolution: [Your judgment on this disagreement]

  critical_issues:
    - [Issue that must be addressed - leave empty if none]

decision: accept|minor_revision|major_revision|reject

rationale: |
  [2-3 paragraph explanation of the decision, referencing specific
  reviewer comments and scores. Be clear about what drove the decision.]

author_action_items:
  - priority: required|recommended
    action: [Specific action author must/should take]
  - priority: required|recommended
    action: [Another action item]
```

## Guidelines

- Be fair and balanced
- Weigh serious concerns heavily even if scores are otherwise good
- A single critical flaw can justify rejection
- Minor issues across multiple areas = minor revision, not rejection
- Provide actionable feedback
- Be clear about what's required vs recommended for revision"""

    def review(self, paper_content: str, metadata: dict) -> dict:
        """Override to take agent reviews as input instead of paper."""
        raise NotImplementedError("Use synthesize() instead")

    def synthesize(self, submission_id: str, reviews: dict) -> dict:
        """Synthesize multiple agent reviews into final decision."""
        system_prompt = self._load_prompt()

        # Format reviews for the prompt
        reviews_text = self._format_reviews(reviews)

        user_prompt = f"""Please synthesize the following agent reviews and provide a final decision.

## Submission ID
{submission_id}

## Agent Reviews

{reviews_text}

---

Please provide your meta-review and final decision following the specified output format."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        return self._parse_response(response.content[0].text)

    def _format_reviews(self, reviews: dict) -> str:
        """Format reviews dict into readable text."""
        formatted = []
        for agent, review in reviews.items():
            formatted.append(f"### {agent.upper()} REVIEWER\n")
            formatted.append(yaml.dump(review, default_flow_style=False))
            formatted.append("\n---\n")
        return "\n".join(formatted)

    def load_reviews(self, submission_id: str) -> dict:
        """Load all agent reviews for a submission."""
        review_dir = Path("reviews") / submission_id
        reviews = {}

        for agent in ["technical", "domain", "ethics", "clarity"]:
            review_path = review_dir / f"{agent}.yaml"
            if review_path.exists():
                with open(review_path) as f:
                    reviews[agent] = yaml.safe_load(f)

        return reviews

    def save_review(self, submission_id: str, review: dict):
        """Save meta-review to file."""
        review_dir = Path("reviews") / submission_id
        review_dir.mkdir(parents=True, exist_ok=True)

        review_path = review_dir / "meta-review.yaml"
        with open(review_path, "w") as f:
            yaml.dump(review, f, default_flow_style=False, allow_unicode=True)

        return review_path
