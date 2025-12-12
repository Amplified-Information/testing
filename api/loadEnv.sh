#!/bin/bash

# Valid environment options
VALID_ENVS=("local" "dev" "prod")

# Check if argument is provided
if [ $# -eq 0 ]; then
  echo "Error: Environment argument required (local, dev, or prod)"
  exit 1
fi

ENV=$1

# Validate environment argument
if [[ ! " ${VALID_ENVS[@]} " =~ " ${ENV} " ]]; then
  echo "Error: Invalid environment. Must be one of: ${VALID_ENVS[*]}"
  exit 1
fi

# Resolve the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Loading environment: $ENV"

set -a # automatically export all variables
# Load environment-specific configuration
source "$SCRIPT_DIR/.config.$ENV"
source "$SCRIPT_DIR/.secrets.$ENV"
set +a # turn off auto-export

echo "\"$ENV\" environment loaded successfully."