---
description: Run SonarQube analysis and review issues
---

Run SonarQube analysis on the current project and review any issues found.

1. Check if SonarQube is configured (look for `sonar-project.properties` or similar)
2. Run the analysis command (e.g., `sonar-scanner` or via npm/yarn script)
3. Review the results:
   - Critical and blocker issues
   - Code smells
   - Security vulnerabilities
   - Test coverage gaps
4. Report findings with file locations and suggested fixes
