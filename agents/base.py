"""Base Reviewer Agent"""

import os
import yaml
from abc import ABC, abstractmethod
from anthropic import Anthropic
from pathlib import Path


class BaseReviewer(ABC):
    """Base class for all review agents."""

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.model = self.config["review"]["model"]
        self.max_tokens = self.config["review"]["max_tokens"]
        self.temperature = self.config["review"]["temperature"]

        # Extended thinking configuration
        self.extended_thinking = self.config["review"].get("extended_thinking", {})
        self.use_extended_thinking = self.extended_thinking.get("enabled", False)
        self.thinking_budget = self.extended_thinking.get("budget_tokens", 10000)

    def _load_config(self, path: str) -> dict:
        with open(path) as f:
            return yaml.safe_load(f)

    def _load_prompt(self) -> str:
        prompt_path = Path("prompts") / f"{self.agent_type}.md"
        if prompt_path.exists():
            return prompt_path.read_text()
        return self._default_prompt()

    @property
    @abstractmethod
    def agent_type(self) -> str:
        """Return agent type identifier."""
        pass

    @property
    @abstractmethod
    def dimensions(self) -> list:
        """Return evaluation dimensions."""
        pass

    @abstractmethod
    def _default_prompt(self) -> str:
        """Return default system prompt."""
        pass

    def review(self, paper_content: str, metadata: dict) -> dict:
        """Execute review on paper content."""
        system_prompt = self._load_prompt()

        user_prompt = f"""Please review the following paper submission.

## Paper Metadata
Title: {metadata.get('title', 'Untitled')}
Paper Type: {metadata.get('paper_type', 'research')}
Keywords: {', '.join(metadata.get('keywords', []))}

## Abstract
{metadata.get('abstract', 'No abstract provided')}

## Full Paper Content
{paper_content}

---

Please provide your review following the specified output format."""

        # Build API request parameters
        request_params = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}]
        }

        # Add extended thinking if enabled (for deeper analysis)
        if self.use_extended_thinking:
            request_params["thinking"] = {
                "type": "enabled",
                "budget_tokens": self.thinking_budget
            }
            # Extended thinking requires temperature=1
            request_params["temperature"] = 1
        else:
            request_params["temperature"] = self.temperature

        response = self.client.messages.create(**request_params)

        # Extract text response (may include thinking blocks)
        response_text = ""
        for block in response.content:
            if hasattr(block, 'text'):
                response_text = block.text
                break

        return self._parse_response(response_text)

    def _parse_response(self, response_text: str) -> dict:
        """Parse agent response into structured format."""
        # Try to extract YAML from response
        try:
            # Look for YAML block
            if "```yaml" in response_text:
                yaml_start = response_text.find("```yaml") + 7
                yaml_end = response_text.find("```", yaml_start)
                yaml_content = response_text[yaml_start:yaml_end].strip()
                return yaml.safe_load(yaml_content)
            elif "```" in response_text:
                yaml_start = response_text.find("```") + 3
                yaml_end = response_text.find("```", yaml_start)
                yaml_content = response_text[yaml_start:yaml_end].strip()
                return yaml.safe_load(yaml_content)
            else:
                # Try parsing entire response as YAML
                return yaml.safe_load(response_text)
        except yaml.YAMLError:
            # Fallback: return raw response
            return {
                "raw_response": response_text,
                "parse_error": True
            }

    def save_review(self, submission_id: str, review: dict):
        """Save review to file."""
        review_dir = Path("reviews") / submission_id
        review_dir.mkdir(parents=True, exist_ok=True)

        review_path = review_dir / f"{self.agent_type}.yaml"
        with open(review_path, "w") as f:
            yaml.dump(review, f, default_flow_style=False, allow_unicode=True)

        return review_path
