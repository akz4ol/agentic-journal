#!/usr/bin/env python3
"""Run a single agent review on a submission."""

import os
import sys
import yaml
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import TechnicalReviewer, DomainReviewer, EthicsReviewer, ClarityReviewer


AGENT_CLASSES = {
    "technical": TechnicalReviewer,
    "domain": DomainReviewer,
    "ethics": EthicsReviewer,
    "clarity": ClarityReviewer
}


def load_submission(submission_id: str) -> tuple[str, dict]:
    """Load paper content and metadata."""
    submission_dir = Path("submissions") / submission_id

    # Load metadata
    metadata_path = submission_dir / "metadata.yaml"
    with open(metadata_path) as f:
        metadata = yaml.safe_load(f)

    # Load PDF content
    pdf_files = list(submission_dir.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError("No PDF found")

    pdf_path = pdf_files[0]

    # Extract text from PDF
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        paper_content = "\n\n".join(text_parts)
    except ImportError:
        # Fallback: try pypdf
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        paper_content = "\n\n".join(text_parts)

    return paper_content, metadata


def main():
    parser = argparse.ArgumentParser(description="Run agent review")
    parser.add_argument("--agent", required=True, choices=AGENT_CLASSES.keys())
    parser.add_argument("--submission-id", default=os.environ.get("SUBMISSION_ID"))
    args = parser.parse_args()

    if not args.submission_id:
        print("Error: submission-id required")
        sys.exit(1)

    print(f"Running {args.agent} review for {args.submission_id}")

    # Load submission
    paper_content, metadata = load_submission(args.submission_id)
    print(f"Loaded paper: {metadata.get('title', 'Untitled')}")
    print(f"Paper length: {len(paper_content)} characters")

    # Run review
    agent_class = AGENT_CLASSES[args.agent]
    agent = agent_class()

    print(f"Running {args.agent} review...")
    review = agent.review(paper_content, metadata)

    # Save review
    review_path = agent.save_review(args.submission_id, review)
    print(f"Review saved to: {review_path}")

    # Print summary
    if "scores" in review:
        print(f"Overall score: {review['scores'].get('overall', 'N/A')}")
    if "recommendation" in review:
        print(f"Recommendation: {review['recommendation']}")


if __name__ == "__main__":
    main()
