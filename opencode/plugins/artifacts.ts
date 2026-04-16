import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

const ARTIFACT_ROOT = join(homedir(), ".opencode-artifacts")

const projectNameFromRemoteUrl = (url: string): string | undefined => {
  const trimmed = url.trim().replace(/\.git$/, "")
  if (!trimmed) return undefined
  const last = trimmed.split(/[\/:]/).pop()
  return last || undefined
}

const artifactPathFor = (project: string, command: string): string =>
  join(ARTIFACT_ROOT, project, `${command}.md`)

export const ArtifactsPlugin: Plugin = async ({ $, directory }) => {
  let cachedProject: string | undefined

  const resolveProject = async (): Promise<string> => {
    if (cachedProject) return cachedProject
    try {
      const remote = (await $`git -C ${directory} config --get remote.origin.url`.quiet().nothrow().text()).trim()
      const fromRemote = projectNameFromRemoteUrl(remote)
      if (fromRemote) return (cachedProject = fromRemote)
    } catch {
      // fall through
    }
    try {
      const top = (await $`git -C ${directory} rev-parse --show-toplevel`.quiet().nothrow().text()).trim()
      if (top) return (cachedProject = basename(top))
    } catch {
      // fall through
    }
    return (cachedProject = basename(directory))
  }

  const ensureProjectDir = async (project: string): Promise<string> => {
    const dir = join(ARTIFACT_ROOT, project)
    await mkdir(dir, { recursive: true })
    return dir
  }

  await mkdir(ARTIFACT_ROOT, { recursive: true })

  return {
    "shell.env": async (_input, output) => {
      const project = await resolveProject()
      const dir = await ensureProjectDir(project)
      output.env.OPENCODE_PROJECT = project
      output.env.OPENCODE_ARTIFACT_DIR = dir
    },

    tool: {
      artifact_read: tool({
        description:
          "Read an artifact written by another OpenCode session for this (or another) project. Returns the artifact contents, or a not-found message. Artifacts live at ~/.opencode-artifacts/<project>/<command>.md.",
        args: {
          command: tool.schema
            .string()
            .describe("The command name (matches the file stem, e.g. 'handoff')."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to the current project (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const path = artifactPathFor(project, args.command)
          if (!existsSync(path)) {
            return `No artifact found at ${path}.`
          }
          const content = await readFile(path, "utf8")
          return `Artifact ${project}/${args.command}.md:\n\n${content}`
        },
      }),

      artifact_write: tool({
        description:
          "Write an artifact for this (or another) project, overwriting any previous content. Artifacts are single-file-per-command per-project with no history.",
        args: {
          command: tool.schema
            .string()
            .describe("The command name (used as the file stem, e.g. 'handoff')."),
          content: tool.schema.string().describe("The full artifact content to write (markdown)."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to the current project (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          await ensureProjectDir(project)
          const path = artifactPathFor(project, args.command)
          await writeFile(path, args.content, "utf8")
          return `Wrote ${args.content.length} bytes to ${path}.`
        },
      }),

      artifact_list: tool({
        description:
          "List artifacts for this (or another) project. Returns each artifact's command name, size, and modification time.",
        args: {
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to the current project (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const dir = join(ARTIFACT_ROOT, project)
          if (!existsSync(dir)) {
            return `No artifacts directory for project '${project}' (would be at ${dir}).`
          }
          const entries = await readdir(dir)
          const md = entries.filter((e) => e.endsWith(".md"))
          if (md.length === 0) {
            return `No artifacts for project '${project}'.`
          }
          const rows = await Promise.all(
            md.map(async (name) => {
              const s = await stat(join(dir, name))
              return `- ${name.replace(/\.md$/, "")}  (${s.size}B, modified ${s.mtime.toISOString()})`
            }),
          )
          return `Artifacts for '${project}':\n${rows.join("\n")}`
        },
      }),
    },
  }
}
