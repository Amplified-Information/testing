# Proxy

Proxy application

## Quickstart

Envoy proxy on local:

```bash
cd proxy
source .config.local
source .secrets.local 
docker run --network=host --rm -it -p $ENVOY_PORT:$ENVOY_PORT -p $ENVOY_PORT_ADMIN:$ENVOY_PORT_ADMIN -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml envoyproxy/envoy:contrib-v1.35-latest
```

Note: the `--net=host` parameter must be applied in a localhost scenario (Docker)

Note: disable the admin config in production!

Note: enable debugging on a live Envoy proxy: `curl -X POST "http://127.0.0.1:9901/logging?level=debug"`

Access the admin panel at: http://localhost:9901/
