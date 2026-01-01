#!/usr/bin/env python3
"""Validate incoming paper submissions."""

import os
import sys
import yaml
import json
from pathlib import Path
from datetime import datetime


def load_config():
    with open("config.yaml") as f:
        return yaml.safe_load(f)


def find_submission():
    """Find the submission to validate."""
    submissions_dir = Path("submissions")

    # Use SUBMISSION_ID env var if available
    submission_id = os.environ.get("SUBMISSION_ID")
    if submission_id:
        submission_path = submissions_dir / submission_id
        if submission_path.exists():
            return submission_path
        # Also try without prefix variations
        for item in submissions_dir.iterdir():
            if item.is_dir() and submission_id in item.name:
                return item

    # Fallback: Look for newest directory in submissions/
    dirs = [d for d in submissions_dir.iterdir() if d.is_dir() and not d.name.startswith('.') and d.name != 'SUBMISSION_TEMPLATE']
    if dirs:
        return max(dirs, key=lambda d: d.stat().st_mtime)

    return None


def validate_metadata(submission_path: Path, config: dict) -> tuple[bool, list]:
    """Validate submission metadata."""
    errors = []
    metadata_path = submission_path / "metadata.yaml"

    if not metadata_path.exists():
        errors.append("Missing metadata.yaml")
        return False, errors

    with open(metadata_path) as f:
        metadata = yaml.safe_load(f)

    # Required fields
    required = ["title", "authors", "abstract", "keywords", "paper_type"]
    for field in required:
        if field not in metadata:
            errors.append(f"Missing required field: {field}")

    # Validate authors
    if "authors" in metadata:
        for i, author in enumerate(metadata["authors"]):
            if "name" not in author:
                errors.append(f"Author {i+1} missing name")
            if "email" not in author:
                errors.append(f"Author {i+1} missing email")

    # Validate abstract length
    if "abstract" in metadata:
        words = len(metadata["abstract"].split())
        min_words = config["screening"]["min_abstract_words"]
        max_words = config["screening"]["max_abstract_words"]
        if words < min_words:
            errors.append(f"Abstract too short ({words} words, min {min_words})")
        if words > max_words:
            errors.append(f"Abstract too long ({words} words, max {max_words})")

    # Validate paper type
    valid_types = list(config["paper_types"].keys())
    if "paper_type" in metadata and metadata["paper_type"] not in valid_types:
        errors.append(f"Invalid paper_type. Must be one of: {valid_types}")

    return len(errors) == 0, errors


def validate_pdf(submission_path: Path, config: dict) -> tuple[bool, list]:
    """Validate PDF file."""
    errors = []

    pdf_files = list(submission_path.glob("*.pdf"))
    if not pdf_files:
        errors.append("No PDF file found")
        return False, errors

    if len(pdf_files) > 1:
        errors.append("Multiple PDF files found - please include only one")

    pdf_path = pdf_files[0]

    # Check file size (max 50MB)
    size_mb = pdf_path.stat().st_size / (1024 * 1024)
    if size_mb > 50:
        errors.append(f"PDF too large ({size_mb:.1f}MB, max 50MB)")

    # Try to read PDF for page count
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        pages = len(reader.pages)

        max_pages = config["screening"]["max_pages"]
        min_pages = config["screening"]["min_pages"]

        if pages > max_pages:
            errors.append(f"Too many pages ({pages}, max {max_pages})")
        if pages < min_pages:
            errors.append(f"Too few pages ({pages}, min {min_pages})")

    except ImportError:
        pass  # pypdf not available, skip page check
    except Exception as e:
        errors.append(f"Could not read PDF: {e}")

    return len(errors) == 0, errors


def generate_submission_id(config: dict) -> str:
    """Generate unique submission ID."""
    prefix = config["journal"]["submission_prefix"]
    year = config["journal"]["year"]

    # Count existing submissions
    submissions_dir = Path("submissions")
    existing = len([d for d in submissions_dir.iterdir() if d.is_dir()])

    return f"{prefix}-{year}-{existing + 1:03d}"


def main():
    config = load_config()

    submission_path = find_submission()
    if not submission_path:
        print("No submission found")
        sys.exit(1)

    print(f"Validating submission: {submission_path.name}")

    all_valid = True
    all_errors = []

    # Validate metadata
    valid, errors = validate_metadata(submission_path, config)
    if not valid:
        all_valid = False
        all_errors.extend(errors)

    # Validate PDF
    valid, errors = validate_pdf(submission_path, config)
    if not valid:
        all_valid = False
        all_errors.extend(errors)

    # Generate submission ID
    submission_id = submission_path.name
    if not submission_id.startswith(config["journal"]["submission_prefix"]):
        submission_id = generate_submission_id(config)

    # Output results
    if all_valid:
        print(f"✓ Validation passed")
        print(f"Submission ID: {submission_id}")

        # Set GitHub Actions output
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                f.write(f"submission_id={submission_id}\n")
                f.write(f"valid=true\n")
    else:
        print("✗ Validation failed:")
        for error in all_errors:
            print(f"  - {error}")

        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                f.write(f"valid=false\n")
                f.write(f"errors={json.dumps(all_errors)}\n")

        sys.exit(1)


if __name__ == "__main__":
    main()
