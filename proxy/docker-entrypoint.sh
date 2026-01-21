#!/bin/sh
set -e

# Substitute env vars into the template at container start
envsubst < /etc/envoy/envoy.tmpl.yaml > /etc/envoy/envoy.yaml

echo "***************************************"
echo "*** generated /etc/envoy/envoy.yaml: ***"
echo "***************************************"
cat /etc/envoy/envoy.yaml
echo "***************************************"
echo "***************************************"
echo "***************************************"

# Launch Envoy
exec envoy -c /etc/envoy/envoy.yaml "$@"
