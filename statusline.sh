#!/usr/bin/env bash
# Claude Code status line:  Opus 5.5 · repo (branch) · ctx 23% · 5h 41%
# Receives session JSON on stdin. See https://code.claude.com/docs/en/statusline

command -v jq >/dev/null 2>&1 || { printf 'Claude'; exit 0; }

# One jq call; fields separated by \x1f so empty values don't collapse.
IFS=$'\x1f' read -r model dir ctx five < <(
  jq -r '[ .model.display_name // .model.id // "Claude",
           .workspace.current_dir // .cwd // "",
           (.context_window.used_percentage // "" | tostring),
           (.rate_limits.five_hour.used_percentage // "" | tostring)
         ] | join("\u001f")'
)

# Green under 50%, yellow under 80%, red above.
pct() {
  [ -z "$1" ] && return
  local n=${1%.*} c=32
  [ "$n" -ge 50 ] && c=33
  [ "$n" -ge 80 ] && c=31
  printf '\033[2m%s\033[0m \033[%sm%s%%\033[0m' "$2" "$c" "$n"
}

sep=$' \033[2m·\033[0m '
out=$'\033[1m'"$model"$'\033[0m'

# Repo name + branch in one git call; plain folder name outside a repo.
if [ -n "$dir" ]; then
  if git_info=$(git -C "$dir" rev-parse --show-toplevel --abbrev-ref HEAD 2>/dev/null); then
    top=${git_info%%$'\n'*} branch=${git_info#*$'\n'}
    out+="$sep"$'\033[36m'"${top##*/}"$'\033[0m \033[35m('"$branch"$')\033[0m'
  else
    out+="$sep"$'\033[34m'"${dir##*/}"$'\033[0m'
  fi
fi

[ -n "$ctx" ]  && out+="$sep$(pct "$ctx" ctx)"
[ -n "$five" ] && out+="$sep$(pct "$five" 5h)"
printf '%s' "$out"
