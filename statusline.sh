#!/usr/bin/env bash
# Claude Code statusline. Receives a JSON session blob on stdin and prints
# a single-line status. See https://code.claude.com/docs/en/statusline.

input=$(cat)

# jq is the cleanest way to read the JSON blob; fall back to grep if it's
# missing so the statusline still works on a fresh machine.
if command -v jq >/dev/null 2>&1; then
  model=$(printf '%s' "$input" | jq -r '.model.display_name // .model.id // "Claude"')
  cwd=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // ""')
else
  model=$(printf '%s' "$input" | grep -oE '"display_name":"[^"]+"' | head -1 | cut -d'"' -f4)
  cwd=$(printf '%s' "$input" | grep -oE '"current_dir":"[^"]+"' | head -1 | cut -d'"' -f4)
  model=${model:-Claude}
fi

branch=""
if [ -n "$cwd" ] && [ -d "$cwd/.git" ] || git -C "${cwd:-.}" rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git -C "${cwd:-.}" branch --show-current 2>/dev/null)
fi

dir_label=""
if [ -n "$cwd" ]; then
  dir_label=$(basename "$cwd")
fi

out=""
[ -n "$model" ] && out="$model"
[ -n "$dir_label" ] && out="${out:+$out | }$dir_label"
[ -n "$branch" ] && out="${out:+$out | }⎇ $branch"
printf '%s' "$out"
