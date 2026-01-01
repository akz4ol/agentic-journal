#!/usr/bin/env python3
"""Synthesize agent reviews into final decision."""

import os
import sys
import yaml
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import MetaReviewer


def main():
    parser = argparse.ArgumentParser(description="Synthesize reviews")
    parser.add_argument("--submission-id", default=os.environ.get("SUBMISSION_ID"))
    args = parser.parse_args()

    if not args.submission_id:
        print("Error: submission-id required")
        sys.exit(1)

    print(f"Synthesizing reviews for {args.submission_id}")

    # Load all reviews
    meta_reviewer = MetaReviewer()
    reviews = meta_reviewer.load_reviews(args.submission_id)

    print(f"Loaded {len(reviews)} agent reviews")
    for agent, review in reviews.items():
        score = review.get("scores", {}).get("overall", "N/A")
        rec = review.get("recommendation", "N/A")
        print(f"  - {agent}: score={score}, recommendation={rec}")

    # Run meta-review
    print("Running meta-review synthesis...")
    meta_review = meta_reviewer.synthesize(args.submission_id, reviews)

    # Save meta-review
    review_path = meta_reviewer.save_review(args.submission_id, meta_review)
    print(f"Meta-review saved to: {review_path}")

    # Extract decision
    decision = meta_review.get("decision", "unknown")
    print(f"\nFinal Decision: {decision.upper()}")

    if "rationale" in meta_review:
        print(f"\nRationale:\n{meta_review['rationale'][:500]}...")

    # Set GitHub Actions output
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"decision={decision}\n")


if __name__ == "__main__":
    main()
