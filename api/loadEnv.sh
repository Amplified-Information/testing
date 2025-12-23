#!/bin/bash

# Valid environment options
VALID_ENVS=("local" "dev" "prod", "local2")

# Check if argument is provided
if [ $# -eq 0 ]; then
  echo "Error: Environment argument required (local, dev, or prod)"
  exit 1
fi

ENV=$1

# Validate environment argument
if [[ ! " ${VALID_ENVS[*]} " =~ " ${ENV} " ]]; then
  echo "Error: Invalid environment. Must be one of: ${VALID_ENVS[*]}"
  exit 1
fi

# Resolve the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set -a # automatically export all variables

# 1. load configuration
echo "*** Loading configuration files..."
source "$SCRIPT_DIR/.config" # load base config
source "$SCRIPT_DIR/.config.$ENV" # env-specific config override
echo "Loaded configuration from .config and .config.$ENV."
echo ""
# 2. load secrets
echo "*** Loading secrets from .secrets file..."
sed -i -e '$a\' "$SCRIPT_DIR/.secrets" # .secrets must end with a newline to ensure the last line is processed
while IFS= read -r key; do # loop through each key in .secrets
  # Ignore lines that start with '#', ';', whitespace, or are empty
  [[ "$key" =~ ^[[:space:]]*([#;]|$) ]] && continue

  key="${key%%=*}" # extract the part before "="
  # get the value from AWS SSM
  echo "aws ssm get-parameter --name \"/$ENV/$key\" ..."
  value="$(aws ssm get-parameter --name "/$ENV/$key" --with-decryption | jq '.Parameter.Value' -r)"
  
  # Check if the value is empty
  if [ -z "$value" ]; then
    echo "Error: Missing value for key '$key'. Do you have the correct IAM permission?"
    return 1
  fi

  # Export the parameter
  export "$key"="$value"
done < "$SCRIPT_DIR/.secrets"

set +a # turn off auto-export

echo "\"$ENV\" environment loaded successfully."
