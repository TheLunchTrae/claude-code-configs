import type { Plugin } from "@opencode-ai/plugin"
import { basename } from "node:path"

const BLOCKED_PATTERNS: readonly RegExp[] = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.[^/]+$/,
  /\.pem$/,
  /(^|\/)id_rsa($|\.)/,
  /(^|\/)id_ed25519($|\.)/,
  /(^|\/)id_ecdsa($|\.)/,
  /(^|\/)id_dsa($|\.)/,
  /\.key$/,
  /(^|\/)credentials\.json$/,
  /(^|\/)\.netrc$/,
  /(^|\/)secrets\.(json|yaml|yml)$/,
  /\.p12$/,
  /\.pfx$/,
  /(^|\/)\.aws\/credentials$/,
  /(^|\/)\.ssh\/.*$/,
]

const ALLOWED_BASENAMES: ReadonlySet<string> = new Set([
  ".env.example",
  ".env.sample",
  ".env.template",
  ".env.defaults",
  ".env.dist",
])

const PATH_TOOL_ARG_KEYS = ["filePath", "file_path", "path", "pattern"] as const

const isBlockedPath = (raw: string): string | undefined => {
  if (!raw) return undefined
  if (ALLOWED_BASENAMES.has(basename(raw))) return undefined
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(raw)) return pattern.source
  }
  return undefined
}

const firstBlockedPathInCommand = (command: string): { path: string; pattern: string } | undefined => {
  const tokens = command.split(/\s+/).filter(Boolean)
  for (const raw of tokens) {
    const cleaned = raw.replace(/^["']|["']$/g, "")
    const hit = isBlockedPath(cleaned)
    if (hit) return { path: cleaned, pattern: hit }
  }
  return undefined
}

const reject = (reason: string): never => {
  throw new Error(
    `blocked by block-secrets plugin: ${reason}. Sensitive-file reads are denied by policy (see rules/security.md). If this file is safe (e.g. a template), add its basename to ALLOWED_BASENAMES in opencode/plugins/block-secrets.ts.`,
  )
}

export const BlockSecretsPlugin: Plugin = async () => ({
  "tool.execute.before": async (input, output) => {
    const toolName = input.tool?.toLowerCase?.() ?? ""
    const args = (output.args ?? {}) as Record<string, unknown>

    if (toolName === "bash") {
      const command = typeof args.command === "string" ? args.command : ""
      const hit = firstBlockedPathInCommand(command)
      if (hit) reject(`bash command references ${hit.path} (pattern ${hit.pattern})`)
      return
    }

    for (const key of PATH_TOOL_ARG_KEYS) {
      const value = args[key]
      if (typeof value !== "string") continue
      const hit = isBlockedPath(value)
      if (hit) reject(`${toolName || "tool"} attempted to access ${value} (pattern ${hit})`)
    }
  },
})
