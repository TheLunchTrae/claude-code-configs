#!/usr/bin/env bash
# PreToolUse hook: block reads/writes/edits/Bash commands targeting
# sensitive files. Patterns mirror opencode/plugins/block-secrets.ts so
# the two stacks behave identically.
#
# Hook protocol: receive JSON on stdin, exit 2 (with stderr message) to
# block, exit 0 to allow. See https://code.claude.com/docs/en/hooks.

set -u

BLOCKED_REGEXES=(
  '(^|/)\.env$'
  '(^|/)\.env\.[^/]+$'
  '\.pem$'
  '(^|/)id_rsa($|\.)'
  '(^|/)id_ed25519($|\.)'
  '(^|/)id_ecdsa($|\.)'
  '(^|/)id_dsa($|\.)'
  '\.key$'
  '(^|/)credentials\.json$'
  '(^|/)\.netrc$'
  '(^|/)secrets\.(json|yaml|yml)$'
  '\.p12$'
  '\.pfx$'
  '(^|/)\.aws/credentials$'
  '(^|/)\.ssh/.*$'
)

ALLOWED_BASENAMES=(
  '.env.example'
  '.env.sample'
  '.env.template'
  '.env.defaults'
  '.env.dist'
)

is_allowed_basename() {
  local base
  base=$(basename "$1")
  for allowed in "${ALLOWED_BASENAMES[@]}"; do
    [ "$base" = "$allowed" ] && return 0
  done
  return 1
}

matches_blocked() {
  local path=$1
  for re in "${BLOCKED_REGEXES[@]}"; do
    if printf '%s' "$path" | grep -Eq "$re"; then
      return 0
    fi
  done
  return 1
}

block() {
  local reason=$1
  printf 'block-secrets hook: refusing %s\n' "$reason" >&2
  exit 2
}

check_path() {
  local path=$1
  [ -z "$path" ] && return 0
  if is_allowed_basename "$path"; then
    return 0
  fi
  if matches_blocked "$path"; then
    block "access to $path (matches a sensitive-file pattern)"
  fi
}

# Token-scan a Bash command for any path-like token that matches a blocked
# pattern. This is intentionally conservative — false positives are
# preferable to leaking a secret.
check_command() {
  local cmd=$1
  [ -z "$cmd" ] && return 0
  local tokens
  tokens=$(printf '%s' "$cmd" | tr -s '[:space:]"'"'"'`<>|&;()' '\n')
  while IFS= read -r token; do
    [ -z "$token" ] && continue
    case "$token" in
      -*|=*) continue ;;
    esac
    if [[ "$token" == *.* ]] || [[ "$token" == */* ]] || [[ "$token" == .* ]]; then
      check_path "$token"
    fi
  done <<<"$tokens"
}

input=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  printf 'block-secrets hook: jq is required but not installed; failing closed.\n' >&2
  exit 2
fi

tool_name=$(printf '%s' "$input" | jq -r '.tool_name // ""')

case "$tool_name" in
  Read|Edit|Write)
    file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""')
    check_path "$file_path"
    ;;
  Bash)
    command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
    check_command "$command"
    ;;
  *)
    : # tool not in scope — allow
    ;;
esac

exit 0
