# cd prism/proxy
# export VERSION=0.1.0
# docker build -t ghcr.io/prismmarketlabs/proxy:$VERSION .
# docker push ghcr.io/prismmarketlabs/proxy:$VERSION
#
# source loadEnv.sh local
# TODO: don't use env-files
# docker run --env-file .config.local --env-file .secrets.local ghcr.io/prismmarketlabs/proxy:$VERSION

# BUILD stage
FROM envoyproxy/envoy:contrib-v1.35-latest

COPY ./envoy.yaml /etc/envoy/envoy.yaml

# # Ensure required environment variables are set:
# ARG ENVOY_PORT
# ARG ENVOY_ADMIN_PORT
# ARG ENVOY_WEB_HOST
# ARG ENVOY_WEB_PORT
# ARG ENVOY_API_HOST
# ARG ENVOY_API_PORT
# ARG ENVOY_CLOB_HOST
# ARG ENVOY_CLOB_PORT

# RUN : "${ENVOY_PORT:?ENVOY_PORT is not set!}" \
#   && : "${ENVOY_ADMIN_PORT:?ENVOY_ADMIN_PORT is not set!}" \
#   && : "${ENVOY_WEB_HOST:?ENVOY_WEB_HOST is not set!}" \
#   && : "${ENVOY_WEB_PORT:?ENVOY_WEB_PORT is not set!}" \
#   && : "${ENVOY_API_HOST:?ENVOY_API_HOST is not set!}" \
#   && : "${ENVOY_API_PORT:?ENVOY_API_PORT is not set!}" \
#   && : "${ENVOY_CLOB_HOST:?ENVOY_CLOB_HOST is not set!}" \
#   && : "${ENVOY_CLOB_PORT:?ENVOY_CLOB_PORT is not set!}"

# ENV ENVOY_PORT=$ENVOY_PORT
# ENV ENVOY_ADMIN_PORT=$ENVOY_ADMIN_PORT
# ENV ENVOY_WEB_HOST=$ENVOY_WEB_HOST
# ENV ENVOY_WEB_PORT=$ENVOY_WEB_PORT
# ENV ENVOY_API_HOST=$ENVOY_API_HOST
# ENV ENVOY_API_PORT=$ENVOY_API_PORT
# ENV ENVOY_CLOB_HOST=$ENVOY_CLOB_HOST
# ENV ENVOY_CLOB_PORT=$ENVOY_CLOB_PORT


# EXPOSE $ENVOY_PORT
# Warning: Expose the admin interface port
# EXPOSE $ENVOY_ADMIN_PORT

CMD ["envoy", "-c", "/etc/envoy/envoy.yaml", "--log-level", "info"]
