#!/usr/bin/env bash
# PreToolUse hook: block Read/Edit/Write/Grep/Bash calls that touch sensitive files.
# Protocol: JSON on stdin; exit 2 + stderr message blocks the call, exit 0 allows it.
# Needs only bash (3.2+) and jq. Matching happens in-process, so it stays fast.

set -u

# One combined pattern, checked against each path.
BLOCKED='(^|/)(\.env(\.[^/]+)?|\.netrc|credentials\.json|secrets\.(json|ya?ml)|id_(rsa|ed25519|ecdsa|dsa)(\.[^/]*)?)$|\.(pem|key|p12|pfx)$|(^|/)\.aws/credentials$|(^|/)\.ssh(/|$)'
ALLOWED='(^|/)\.env\.(example|sample|template|defaults|dist)$'

block() { printf 'block-secrets: refusing access to %s (sensitive-file pattern)\n' "$1" >&2; exit 2; }

check_path() {
  local p=$1
  [ -z "$p" ] && return 0
  [[ $p =~ $ALLOWED ]] && return 0
  [[ $p =~ $BLOCKED ]] && block "$p"
  return 0
}

# Split a shell command into words and check each one. Deliberately conservative:
# a false positive is better than leaking a secret.
check_command() {
  local word
  while IFS= read -r word || [ -n "$word" ]; do   # || keeps the last word (no trailing newline)
    [ -z "$word" ] && continue
    case $word in
      *=*) check_path "${word#*=}" ;;   # --env-file=.env, FOO=~/.ssh/id_rsa
      -*)  ;;                            # plain flags
      *)   check_path "$word" ;;
    esac
  done < <(printf '%s' "$1" | tr -s '[:space:]"'"'"'`<>|&;()' '\n')
}

if ! command -v jq >/dev/null 2>&1; then
  echo 'block-secrets: jq is required but not installed; failing closed.' >&2
  exit 2
fi

# One jq call: tool name, then the relevant argument (path or command).
{ IFS= read -r tool; IFS= read -r -d '' arg; } < <(
  jq -j '.tool_name // "", "\n",
         (.tool_input | .file_path // .path // .command // "")'
)

case $tool in
  Read|Edit|Write|Grep) check_path "$arg" ;;
  Bash)                 check_command "$arg" ;;
esac
exit 0
