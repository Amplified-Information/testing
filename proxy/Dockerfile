# cd prism/proxy
# export VERSION=0.1.0
# docker build -t ghcr.io/prismmarketlabs/proxy:$VERSION .
# docker push ghcr.io/prismmarketlabs/proxy:$VERSION
#
# source loadEnv.sh local
# docker run -p 8090:8090 -p 9901:9901 -e ENVOY_HOST_CLOB=${ENVOY_HOST_CLOB} -e ENVOY_HOST_API=${ENVOY_HOST_API} -e ENVOY_HOST_WEB=${ENVOY_HOST_WEB} ghcr.io/prismmarketlabs/proxy:$VERSION

# BUILD stage
FROM envoyproxy/envoy:contrib-v1.35-latest

 # install gettext (envsubst):
RUN apt-get update && apt-get install -y gettext && rm -rf /var/lib/apt/lists/*

# The template (envoy.tmpl.yaml) takes the following environment variables:
# - ${ENVOY_HOST_CLOB}
# - ${ENVOY_HOST_API}
# - ${ENVOY_HOST_WEB}

# Copy template and entrypoint
COPY envoy.tmpl.yaml /etc/envoy/envoy.tmpl.yaml
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]