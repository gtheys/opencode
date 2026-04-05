import { tool } from "@opencode-ai/plugin"
import path from "path"

export default tool({
  description: "Add two numbers using Python",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args, context) {
    // AIDEV-NOTE: Tool scripts live in `tools/` within the repo worktree.
    // Keep this path worktree-relative so it works across machines.
    const script = path.join(context.worktree, "tools/add.py")
    const result = await Bun.$`python3 ${script} ${args.a} ${args.b}`.text()
    return result.trim()
  },
})
