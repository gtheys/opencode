---
name: create-plan-nt
description: Create implementation plans with thorough research (no thoughts directory). Use when the user wants to create a detailed implementation plan but does not use a thoughts/ directory for project documentation.
---

# Implementation Plan (No Thoughts Directory)

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

This is the "no thoughts" variant — do NOT reference or create files in a `thoughts/` directory.

## Initial Response

When this skill is invoked:

1. **Check if parameters were provided**:
   - If a file path or ticket reference was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task/ticket description (or reference to a ticket file)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this skill with a ticket file directly: `/skill:create-plan-nt path/to/ticket.md`
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Read all mentioned files immediately and FULLY**:
   - Ticket files, research documents, related implementation plans
   - Any JSON/data files mentioned
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: Do NOT defer reading — read these files yourself in the main context
   - **NEVER** read files partially

2. **Use skills to gather context**:
   Before asking the user any questions, use specialized skills to research:

   - Use `/skill:codebase-locator` to find all files related to the ticket/task
   - Use `/skill:codebase-analyzer` to understand how the current implementation works
   - If a taskwarrior ticket is mentioned, use `/skill:taskwarrior-plan` to get full details

3. **Read all files identified by research**:
   - After research completes, read ALL files they identified as relevant
   - Read them FULLY into the main context

4. **Analyze and verify understanding**:
   - Cross-reference requirements with actual code
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality

5. **Present informed understanding and focused questions**

### Step 2: Research & Discovery

After getting initial clarifications:

1. **Create a research todo list** using markdown checkboxes

2. **Use skills for comprehensive research**:
   - `/skill:codebase-locator`, `/skill:codebase-analyzer`, `/skill:codebase-pattern-finder`

3. **Present findings and design options**

### Step 3: Plan Structure Development

Once aligned on approach, create an outline and get feedback before writing details.

### Step 4: Detailed Plan Writing

After structure approval:

1. **Write the plan** to a file in the project (e.g., `docs/plans/YYYY-MM-DD-description.md` or wherever the project keeps specs):
   - Format: `YYYY-MM-DD-description.md` where description is kebab-case

2. **Use the same template structure** as `/skill:create-plan`

### Step 5: Review

Present the draft plan location and iterate based on feedback.

## Important Guidelines

Same as `/skill:create-plan`:
- Be skeptical, interactive, thorough, and practical
- Track progress with markdown checkboxes
- No open questions in the final plan
- Separate automated vs manual success criteria
- Use `make` commands for automated verification

## Research Best Practices

Same as `/skill:create-plan`:
- Use multiple skills in parallel for efficiency
- Be specific about directories
- Request file:line references
- Verify results before accepting them
