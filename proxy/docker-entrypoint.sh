#!/bin/sh
set -e

# Substitute env vars into the template at container start
envsubst < /etc/envoy/envoy.tmpl.yaml > /etc/envoy/envoy.yaml

# if basic auth is disabled, remove the relevant blocks from the envoy config:
if [ "$IS_BASIC_AUTH_DISABLED" = "true" ]; then
  sed -i '/### IS_BASIC_AUTH_DISABLED/,/### END IS_BASIC_AUTH_DISABLED/d' /etc/envoy/envoy.yaml
fi

cat /etc/envoy/envoy.yaml

# Launch Envoy
exec envoy -c /etc/envoy/envoy.yaml "$@"
