#!/bin/bash
# Script to open 6 GNOME Terminal tabs, each running a different echo command


#!/bin/bash
# This script uses tmux to open 6 panes, each running its own echo command

services=(db eventbus api clob proxy web)

for i in "${!services[@]}"; do
  if [ "${services[$i]}" = "proxy" ]; then # local2 for proxy service
    cmd="cd ${services[$i]}; source ./loadEnv.sh local2; echo \"terminal$((i+1)) in ${services[$i]}\"; read -p \"Press Enter to continue...\"; exec bash"
  else
    cmd="cd ${services[$i]}; source ./loadEnv.sh local; echo \"terminal$((i+1)) in ${services[$i]}\"; read -p \"Press Enter to continue...\"; exec bash"
  fi
  if [ "$i" -eq 0 ]; then
    tmux new-session -d -s dev "$cmd"
  else
    # Use split-window with specific targeting for layout
    if [ "$i" -eq 1 ]; then
      tmux split-window -h -t dev "$cmd"
    elif [ "$i" -eq 2 ]; then
      tmux split-window -v -t dev:0.1 "$cmd"
    elif [ "$i" -eq 3 ]; then
      tmux split-window -v -t dev:0.0 "$cmd"
    elif [ "$i" -eq 4 ]; then
      tmux split-window -h -t dev:0.2 "$cmd"
    elif [ "$i" -eq 5 ]; then
      tmux split-window -h -t dev:0.3 "$cmd"
    fi
  fi
done
tmux select-layout -t dev tiled
tmux attach -t dev

# tmux new-session -d -s dev 'echo "terminal1"; cd db; cat docker-compose-data.yml | grep; read -p "Press Enter to continue..."; exec bash'
# tmux split-window -h -t dev 'echo "terminal2"; read -p "Press Enter to continue..."; exec bash'
# tmux split-window -v -t dev:0.1 'echo "terminal3"; read -p "Press Enter to continue..."; exec bash'
# tmux split-window -v -t dev:0.0 'echo "terminal4"; read -p "Press Enter to continue..."; exec bash'
# tmux split-window -h -t dev:0.2 'echo "terminal5"; read -p "Press Enter to continue..."; exec bash'
# tmux split-window -h -t dev:0.3 'echo "terminal6"; read -p "Press Enter to continue..."; exec bash'
# tmux select-layout -t dev tiled
# tmux attach -t dev
