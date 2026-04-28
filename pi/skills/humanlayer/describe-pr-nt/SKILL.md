---
name: describe-pr-nt
description: Generate comprehensive PR descriptions without using a thoughts directory. Use when the user wants to write a PR description but does not use a thoughts/ directory.
---

# Generate PR Description (No Thoughts Directory)

You are tasked with generating a comprehensive pull request description following the repository's standard template.

This is the "no thoughts" variant — do NOT reference or create files in a `thoughts/` directory.

## Steps to follow:

1. **Read the PR description template:**
   - Use the following PR description template:

     ```md
     ## What problem(s) was I solving?

     ## What user-facing changes did I ship?

     ## How I implemented it

     ## How to verify it

     ### Manual Testing

     ## Description for the changelog
     ```

   - Read the template carefully to understand all sections and requirements

2. **Identify the PR to describe:**
   - Check if the current branch has an associated PR: `gh pr view --json url,number,title,state 2>/dev/null`
   - If no PR exists for the current branch, or if on main/master, list open PRs: `gh pr list --limit 10 --json number,title,headRefName,author`
   - Ask the user which PR they want to describe

3. **Check for existing description:**
   - Check if `/tmp/{repo_name}/prs/{number}_description.md` already exists
   - If it exists, read it and inform the user you'll be updating it
   - Consider what has changed since the last description was written

4. **Gather comprehensive PR information:**
   - Get the full PR diff: `gh pr diff {number}`
   - If you get an error about no default remote repository, instruct the user to run `gh repo set-default` and select the appropriate repository
   - Get commit history: `gh pr view {number} --json commits`
   - Review the base branch: `gh pr view {number} --json baseRefName`
   - Get PR metadata: `gh pr view {number} --json url,title,number,state`

5. **Analyze the changes thoroughly:** (think deeply about the code changes, their architectural implications, and potential impacts)
   - Read through the entire diff carefully
   - For context, read any files that are referenced but not shown in the diff
   - Understand the purpose and impact of each change
   - Identify user-facing changes vs internal implementation details
   - Look for breaking changes or migration requirements

6. **Handle verification requirements:**
   - Look for any checklist items in the "How to verify it" section
   - For each verification step:
     - If it's a command you can run, run it
     - If it passes, mark the checkbox as checked: `- [x]`
     - If it fails, keep it unchecked and note what failed
     - If it requires manual testing, leave unchecked and note for user

7. **Generate the description:**
   - Fill out each section from the template thoroughly
   - Ensure all checklist items are addressed (checked or explained)

8. **Save the description:**
   - Write the completed description to `/tmp/{repo_name}/prs/{number}_description.md`
   - Show the user the generated description

9. **Update the PR:**
   - Update the PR description directly: `gh pr edit {number} --body-file /tmp/{repo_name}/prs/{number}_description.md`
   - Confirm the update was successful
   - If any verification steps remain unchecked, remind the user to complete them before merging

## Important notes:
- This command works across different repositories — always read the local template
- Be thorough but concise — descriptions should be scannable
- Focus on the "why" as much as the "what"
- Include any breaking changes or migration notes prominently
- Always attempt to run verification commands when possible
- Clearly communicate which verification steps need manual testing
