---
name: research-codebase-nt
description: Document codebase as-is without evaluation or recommendations, and without using a thoughts directory. Use when the user wants to understand how the codebase works but does not use a thoughts/ directory.
---

# Research Codebase (No Thoughts Directory)

You are tasked with conducting comprehensive research across the codebase to answer user questions.

## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY
- DO NOT suggest improvements or changes unless the user explicitly asks for them
- DO NOT perform root cause analysis unless the user explicitly asks for them
- DO NOT propose future enhancements unless the user explicitly asks for them
- DO NOT critique the implementation or identify problems
- DO NOT recommend refactoring, optimization, or architectural changes
- ONLY describe what exists, where it exists, how it works, and how components interact
- You are creating a technical map/documentation of the existing system

## Initial Setup

When this skill is invoked, respond with:
```
I'm ready to research the codebase. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
```

Then wait for the user's research query.

## Steps to follow after receiving the research query:

1. **Read any directly mentioned files first:**
   - If the user mentions specific files, read them FULLY first
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters
   - **CRITICAL**: Read these files yourself before using skills

2. **Analyze and decompose the research question:**
   - Break down the query into composable research areas
   - Create a research plan using markdown checkboxes
   - Identify specific components, patterns, or concepts to investigate

3. **Use skills for comprehensive research:**
   - Use `/skill:codebase-locator` to find WHERE files and components live
   - Use `/skill:codebase-analyzer` to understand HOW specific code works
   - Use `/skill:codebase-pattern-finder` to find examples of existing patterns

   **IMPORTANT**: All skills are documentarians, not critics.

   **For web research (only if user explicitly asks):**
   - Use `/skill:web-search-researcher` for external documentation

4. **Wait for all skills to complete and synthesize findings:**
   - Compile all results
   - Include specific file paths and line numbers
   - Answer the user's specific questions with concrete evidence

5. **Present findings:**
   - Present a concise summary to the user
   - Include key file references
   - Ask if they have follow-up questions

6. **Handle follow-up questions:**
   - If follow-up questions arise, use skills for additional investigation
   - Update your findings accordingly

## Important notes:
- Use parallel skill invocations for efficiency
- Always run fresh codebase research
- Focus on concrete file paths and line numbers
- **CRITICAL**: Document what IS, not what SHOULD BE
- **NO RECOMMENDATIONS**: Only describe the current state
- **File reading**: Always read mentioned files FULLY before using skills
