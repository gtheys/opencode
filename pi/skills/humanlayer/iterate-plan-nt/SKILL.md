---
name: iterate-plan-nt
description: Iterate on existing implementation plans without using a thoughts directory. Use when the user wants to modify an existing plan but does not use a thoughts/ directory for project documentation.
---

# Iterate Implementation Plan (No Thoughts Directory)

You are tasked with updating existing implementation plans based on user feedback. You should be skeptical, thorough, and ensure changes are grounded in actual codebase reality.

This is the "no thoughts" variant — do NOT reference or create files in a `thoughts/` directory.

## Initial Response

When this skill is invoked:

1. **Parse the input to identify**:
   - Plan file path
   - Requested changes/feedback

2. **Handle different input scenarios**:

   **If NO plan file provided**:
   ```
   I'll help you iterate on an existing implementation plan.

   Which plan would you like to update? Please provide the path to the plan file.

   Tip: You can list recent plans with `ls -lt docs/plans/ | head` (or wherever your plans live)
   ```
   Wait for user input.

   **If plan file provided but NO feedback**:
   ```
   I've found the plan at [path]. What changes would you like to make?

   For example:
   - "Add a phase for migration handling"
   - "Update the success criteria to include performance tests"
   - "Adjust the scope to exclude feature X"
   - "Split Phase 2 into two separate phases"
   ```
   Wait for user input.

   **If BOTH plan file AND feedback provided**:
   - Proceed immediately to Step 1

## Process Steps

### Step 1: Read and Understand Current Plan

1. **Read the existing plan file COMPLETELY**
2. **Understand the requested changes**

### Step 2: Research If Needed

**Only spawn research if the changes require new technical understanding.**

1. **Create a research todo list** using markdown checkboxes
2. **Use skills for research**:
   - `/skill:codebase-locator`, `/skill:codebase-analyzer`, `/skill:codebase-pattern-finder`
3. **Read any new files identified by research**
4. **Wait for ALL research to complete** before proceeding

### Step 3: Present Understanding and Approach

Before making changes, confirm your understanding with the user.

### Step 4: Update the Plan

1. **Make focused, precise edits** to the existing plan
2. **Ensure consistency** with existing structure
3. **Preserve quality standards**

### Step 5: Review

Present the changes made and be ready to iterate further.

## Important Guidelines

Same as `/skill:iterate-plan`:
- Be skeptical, surgical, thorough, and interactive
- Track progress with markdown checkboxes
- No open questions in the updated plan
- Maintain automated vs manual success criteria distinction
