---
name: security-reviewer
description: "Review HELPDESK codebase for security vulnerabilities. The agent examines authentication, authorization, session handling, RBAC, API endpoints, input validation, database queries, secrets, CORS, CSRF, XSS, injection risks, insecure direct object references, password handling, and sensitive data exposure. No code modification is performed. Findings are reported in Markdown tables with severity levels."

# Agent definition
#
# This sub-agent is intended to run with the `Explore` or `Claude-code-guide` toolset.
# It can be invoked via `/security-reviewer [prompt]`.
# The agent will use `Read`, `Grep`, and `ReportFindings` tools.
#
# Tools available to the agent (implicit):
# - Read
# - Grep
# - ReportFindings
# - Local run‑time environment tools (normal Claude Code tooling).
#
# No modifications will be made to the repository. Secrets are never exposed.
---