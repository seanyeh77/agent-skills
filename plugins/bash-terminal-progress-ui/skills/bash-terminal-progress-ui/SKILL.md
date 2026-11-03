---
name: "bash-terminal-progress-ui"
description: "Build spinner / progress UIs for bash scripts and installers: one-line spinners, several parallel jobs redrawn in place, output to a log, plain mode without a TTY."
---

# Terminal progress UI in bash

The technique used by the dotfiles installer (github.com/seanyeh77/dotfiles, install.sh). Pure bash plus ANSI control sequences, no libraries. Works in macOS's bash 3.2 and under `curl ... | bash`.

## Idea

An animation is the same line (or block of lines) redrawn every 0.2 s with the next frame. The commands' own output never reaches the screen: it goes to a log file, and only the UI writes to the terminal through a separate file descriptor.

## Building blocks

| Sequence | Effect |
|---|---|
| `\r` | cursor to the start of the line |
| `\e[K` | clear from the cursor to the end of the line |
| `\e[<n>A` | cursor up n lines |
| `\e[?25l` / `\e[?25h` | hide / show the cursor |
| `\e[2m`, `\e[32m`, `\e[0m` | dim, green, reset |

Spinner frames: `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` (Braille), or `| / - \` when the locale is not UTF-8.

## 1. Decide UI or plain mode, split screen and log

```bash
ESC=$'\033'
UI=0
# A real terminal on /dev/tty, not CI, not forced plain. stdin may be the curl pipe, so test the tty itself.
if [ -z "${CI:-}" ] && [ "${MY_PLAIN:-0}" != 1 ] && [ -t 1 ] && { : </dev/tty; } 2>/dev/null; then UI=1; fi
case "${LC_ALL:-${LC_CTYPE:-${LANG:-}}}" in *[Uu][Tt][Ff]*8*) FRAMES=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏) ;; *) FRAMES=('|' '/' '-' '\') ;; esac

LOG="${XDG_STATE_HOME:-$HOME/.local/state}/myscript/install.log"; mkdir -p "${LOG%/*}"; : > "$LOG"
exec 3>&1 4>&2                       # fd 3 / 4 = the real screen
[ "$UI" = 1 ] && exec >>"$LOG" 2>&1  # everything else goes to the log
```

In plain mode (no TTY, CI, `> file`) print `==> step [t=Ns]` lines and let all command output through.

## 2. Window width, measured again while drawing

```bash
COLS=80
term_cols() {
  local c; c="$(stty size </dev/tty 2>/dev/null | awk '{print $2}')"
  case "$c" in ''|*[!0-9]*) ;; *) [ "$c" -gt 20 ] && COLS="$c" ;; esac
}
term_cols
```

Re-measure every second or so inside the redraw loops. A line longer than the window wraps; a block redraw then lands one line too low and the screen fills with copies (happens when the window is narrowed or a tmux pane is split mid-run). Always cut variable text to the space left: `${detail:0:$w}`.

## 3. One step: a background spinner

```bash
SPIN_PID=""
spin_start() { # spin_start LABEL
  [ "$UI" = 1 ] || { printf '==> %s\n' "$1"; return; }
  local label="$1" t0="$SECONDS"
  (
    trap - INT TERM; exec 2>/dev/null   # bash 3.2 otherwise prints trap warnings when it is killed
    i=0
    while :; do
      [ $((i % 5)) = 0 ] && term_cols
      d="$(tail -n 1 "$LOG" 2>/dev/null | tr -d '\r' | sed "s/${ESC}\[[0-9;?]*[A-Za-z]//g")"
      w=$((COLS - ${#label} - 14)); [ "$w" -gt 0 ] || w=0
      printf '\r%s[K  %s %s %s[2m%ss  %s%s[0m' "$ESC" "${FRAMES[$((i % ${#FRAMES[@]}))]}" "$label" \
        "$ESC" "$((SECONDS - t0))" "${d:0:$w}" "$ESC" >&3
      i=$((i + 1)); sleep 0.2
    done
  ) &
  SPIN_PID=$!
}
spin_stop() { # spin_stop OK|FAIL LABEL ELAPSED
  [ -n "$SPIN_PID" ] && { kill "$SPIN_PID" 2>/dev/null; wait "$SPIN_PID" 2>/dev/null; SPIN_PID=""; }
  [ "$UI" = 1 ] || return 0
  if [ "$1" = OK ]; then m="${ESC}[32m✓${ESC}[0m"; else m="${ESC}[33m!${ESC}[0m"; fi
  printf '\r%s[K  %s %s %s[2m(%ss)%s[0m\n' "$ESC" "$m" "$2" "$ESC" "$3" "$ESC" >&3
}
```

The dim tail of the line is the last line of the log, so the user sees what is happening without the full output.

## 4. Several jobs at once: redraw a block in place

Each job runs in a background subshell with its output in its own log and reports through files:

```bash
TMP="$(mktemp -d)"; J_NAMES=(); J_T0=()
job() { # job NAME LABEL FUNCTION...
  local name="$1" jd="$TMP/job.$1"; echo "$2" > "$jd.label"; : > "$jd.log"; rm -f "$jd.rc"; shift 2
  ( trap - EXIT INT TERM
    exec >>"$jd.log" 2>&1 </dev/null        # never read the terminal from a job
    set +e; ( set -e; "$@" ); echo "$?" > "$jd.rc" ) &
  J_NAMES+=("$name"); J_T0+=("$SECONDS")
  [ "${SERIAL:-0}" = 1 ] && jobs_wait        # little memory: one at a time
}
jobs_draw() {
  local i jd lab d w
  for i in "${!J_NAMES[@]}"; do
    jd="$TMP/job.${J_NAMES[$i]}"; lab="$(cat "$jd.label")"
    if [ -f "$jd.rc" ]; then
      [ -f "$jd.time" ] || echo "$((SECONDS - J_T0[i]))" > "$jd.time"
      printf '\r%s[K  %s %s (%ss)\n' "$ESC" "$([ "$(cat "$jd.rc")" = 0 ] && echo ✓ || echo !)" "$lab" "$(cat "$jd.time")" >&3
    else
      d="$(tail -n 1 "$jd.log" | tr -d '\r')"; w=$((COLS - ${#lab} - 14)); [ "$w" -gt 0 ] || w=0
      printf '\r%s[K  %s %s %ss  %s\n' "$ESC" "${FRAMES[$((TICK % ${#FRAMES[@]}))]}" "$lab" \
        "$((SECONDS - J_T0[i]))" "${d:0:$w}" >&3
    fi
  done
}
jobs_wait() {
  local n=${#J_NAMES[@]} left i; [ "$n" -gt 0 ] || return 0
  TICK=0; printf '%s[?25l' "$ESC" >&3; jobs_draw
  while :; do
    left=0; for i in "${!J_NAMES[@]}"; do [ -f "$TMP/job.${J_NAMES[$i]}.rc" ] || left=$((left + 1)); done
    [ $((TICK % 5)) = 0 ] && term_cols
    printf '%s[%dA' "$ESC" "$n" >&3; jobs_draw   # back to the top of the block, draw exactly n lines
    [ "$left" -gt 0 ] || break
    TICK=$((TICK + 1)); sleep 0.2
  done
  wait; printf '%s[?25h' "$ESC" >&3
  for i in "${!J_NAMES[@]}"; do cat "$TMP/job.${J_NAMES[$i]}.log"; done   # into the main log
  J_NAMES=(); J_T0=()
}
```

The block must always be exactly n physical lines: that is what makes `ESC[nA` land on its first line.

## 5. Clean up on exit and Ctrl-C

```bash
trap 'spin_stop FAIL "stopped" 0 2>/dev/null; printf "%s[?25h" "$ESC" >&3; stty echo </dev/tty 2>/dev/null' EXIT
trap 'exit 130' INT TERM
```

The cursor must come back and the terminal must echo again whatever happens.

## Pitfalls seen in practice

- **Line wraps → screen fills with copies**: re-measure the width while drawing and cut every variable part to the remaining width.
- **Colour codes break alignment**: pad the plain text first (`printf '%-20s'`), then add colour around it; escape codes count as characters for `%-20s` and `${#var}`.
- **`curl | bash`**: stdin is the script itself. Read answers with `read ... </dev/tty`, and a script that re-executes itself must drain stdin first (`[ -t 0 ] || cat >/dev/null`) or curl gets SIGPIPE.
- **Jobs reading the terminal**: give every job `</dev/null`; a prompt inside a job hangs unseen behind the spinner. For git: `GIT_TERMINAL_PROMPT=0`.
- **A spinner that stops moving** means the main loop itself is not running: usually the machine is out of memory (swapping), not a slow download. Run fewer jobs when free memory is low (e.g. `MemAvailable` under 2 GB → `SERIAL=1`), and cap compiler parallelism.
- **Stalled downloads hang forever** behind a happy spinner: `curl --connect-timeout 20 --speed-limit 1024 --speed-time 60` and retry; wrap other network commands in `timeout`.
- **bash 3.2 (macOS)**: no `${var,,}`, no associative arrays, `"${arr[@]}"` on an empty array fails under `set -u` (use `${arr[@]+"${arr[@]}"}`); background subshells print trap warnings unless they reset traps and silence stderr.
- **Elapsed time**: use `$SECONDS`, no `date` calls in the loop.

## Checklist for a new script

1. UI vs plain detection, fd 3/4 for the screen, everything else to a log.
2. `spin_start` / `spin_stop` for sequential steps; `job` / `jobs_wait` for parallel ones.
3. Width re-measured in both loops; all variable text truncated.
4. Cursor hidden while animating, restored in an EXIT trap.
5. Timeouts on network calls; serial mode when memory is low.
6. At the end, a summary of what changed / failed and the log path.