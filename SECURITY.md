# Security Policy 🛡️

We take the security of Proxygen pipelines and autonomous agent operations extremely seriously. This document outlines key security protocols, credential management standards, and the process for reporting potential vulnerabilities.

---

## 1. Credentials & API Key Safety

Proxygen operates autonomously by interacting with multiple external APIs and blockchain networks. To ensure safety:
* **Zero Private Key Exposure**: Private keys (e.g., Solana wallets used for x402 micropayments) must **never** be hardcoded. They must be loaded dynamically at runtime via securely injected environment variables (`SOLANA_PRIVATE_KEY`).
* **Granular API Permissions**: Always restrict the scope of API keys (such as Ace Data Cloud proxy credentials or OpenAI/DeepSeek tokens) to the bare minimum required for scraping and extraction.
* **Environment Isolation**: Production environments must use unique, separate credentials from staging/development environments.

---

## 2. Agent Execution Security

Autonomous agents must be prevented from executing arbitrary logic or making unauthorized outbound transactions:
* **Schema Validation**: All data fetched from localized proxies is strictly validated against pre-defined JSON Schemas before being parsed. If the LLM generates structured data that violates the schema, the transaction is immediately aborted.
* **Deterministic Failovers**: Proxygen does not use AI to decide which proxy hop to use during failures; it uses a deterministic health-rotation list to prevent agent hallucination or hijacking.
* **x402 Micropayment Caps**: The OOBE/Synapse client SDK enforces daily/hourly spending limits on proxy fees and LLM query costs. Even if an agent loops infinitely, it will be halted by client-side budget caps.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability in Proxygen, please do **not** open a public issue. Instead, report it privately to the maintainers:

1. **Email**: Send a detailed report to [security@edycu.dev](mailto:security@edycu.dev).
2. **Encrypted Communication**: If you wish to encrypt your report, please request our GPG key.
3. **Detail Checklist**: Please include:
   * A description of the vulnerability and its potential impact.
   * Step-by-step instructions to reproduce the issue (PoC).
   * Any potential remediations or fixes.

We will acknowledge receipt of your report within **24 hours** and work to release a patch within **7 days**.

---

## 4. Security Audits & Tools

Proxygen's codebase undergoes automated security scanning on every push to `main` via our CI/CD pipeline:
* **Secret Scanning**: [TruffleHog](https://github.com/trufflesecurity/trufflehog) checks all commits for accidentally committed private keys, API tokens, and certificate files.
* **Dependency Auditing**: `npm audit` scans all third-party dependencies for known vulnerabilities, failing the build on high/critical risks.
