#!/usr/bin/env bash
# Claude Code statusline. Receives a JSON session blob on stdin and prints
# a single-line status. See https://code.claude.com/docs/en/statusline.

input=$(cat)

# jq is the cleanest way to read the JSON blob; fall back to grep if it's
# missing so the statusline still works on a fresh machine. The context
# usage segment is jq-only — parsing nested JSON with grep isn't worth
# the fragility for a display nicety.
tokens_segment=""
if command -v jq >/dev/null 2>&1; then
  model=$(printf '%s' "$input" | jq -r '.model.display_name // .model.id // "Claude"')
  cwd=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // ""')

  ctx=$(printf '%s' "$input" | jq -r '
    .context_window as $c |
    if $c.current_usage == null then
      empty
    else
      ( ($c.current_usage.input_tokens // 0)
      + ($c.current_usage.cache_creation_input_tokens // 0)
      + ($c.current_usage.cache_read_input_tokens // 0)
      ) as $t |
      ( $c.used_percentage //
        ( if ($c.context_window_size // 0) > 0
          then ($t * 100 / $c.context_window_size)
          else null end
        )
      ) as $p |
      "\($t)\t\($p // "")"
    end
  ')
  if [ -n "$ctx" ]; then
    ctx_tokens=${ctx%%$'\t'*}
    ctx_pct=${ctx#*$'\t'}
    tokens_display=$(awk -v n="$ctx_tokens" 'BEGIN {
      if (n < 1000) { printf "%d", n }
      else if (n < 100000) { printf "%.1fk", n/1000 }
      else { printf "%dk", int(n/1000 + 0.5) }
    }')
    if [ -n "$ctx_pct" ]; then
      pct_display=$(awk -v p="$ctx_pct" 'BEGIN { printf "%d", p + 0.5 }')
      tokens_segment="${tokens_display} (${pct_display}%)"
    else
      tokens_segment="${tokens_display}"
    fi
  fi
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
[ -n "$tokens_segment" ] && out="${out:+$out | }$tokens_segment"
printf '%s' "$out"
