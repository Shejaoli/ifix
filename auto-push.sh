#!/bin/bash

LOGFILE="/home/deploy/apps/ifix-electronics/ifix-electronics (1)/auto-push.log"
MAX_SIZE=5242880  # 5MB in bytes

cd "/home/deploy/apps/ifix-electronics/ifix-electronics (1)" || exit 1

while inotifywait -r -e modify,create,delete,move \
  --exclude '(auto-push\.log|\.git)' .; do

  # Rotate log if over 5MB
  if [ -f "$LOGFILE" ] && [ $(stat -c%s "$LOGFILE") -ge $MAX_SIZE ]; then
    mv "$LOGFILE" "$LOGFILE.old"
  fi

  git add .
  git commit -m "Auto-commit on $(date +'%Y-%m-%d %H:%M:%S')" >> "$LOGFILE" 2>&1 || echo "Nothing to commit" >> "$LOGFILE"
  git push origin master >> "$LOGFILE" 2>&1

done
