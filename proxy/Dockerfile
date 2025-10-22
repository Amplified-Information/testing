FROM envoyproxy/envoy:contrib-v1.35-latest

COPY ./envoy.yaml /etc/envoy/envoy.yaml

ENV ENVOY_PORT=$ENVOY_PORT
ENV ENVOY_ADMIN_PORT=$ENVOY_ADMIN_PORT
ENV ENVOY_WEB_HOST=$ENVOY_WEB_HOST
ENV ENVOY_WEB_PORT=$ENVOY_WEB_PORT
ENV ENVOY_API_HOST=$ENVOY_API_HOST
ENV ENVOY_API_PORT=$ENVOY_API_PORT
ENV ENVOY_CLOB_HOST=$ENVOY_CLOB_HOST
ENV ENVOY_CLOB_PORT=$ENVOY_CLOB_PORT

EXPOSE $ENVOY_PORT
# Warning: Expose the admin interface port
EXPOSE $ENVOY_ADMIN_PORT

# Command to run Envoy with the specified configuration file
CMD ["envoy", "-c", "/etc/envoy/envoy.yaml", "--log-level", "info"]
