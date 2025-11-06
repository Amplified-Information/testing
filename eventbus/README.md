# event bus

Using NATS for events.

No message persistence, no replaying of messages. No state is stored.

## cmds

```bash
cd eventbus
source .config.local
source .secrets.local
docker run --rm -it -e NATS_ADDR=$NATS_HOST -p $NATS_PORT:$NATS_PORT -p $NATS_PORT_MONITOR:$NATS_PORT_MONITOR nats:latest
```

## install nats-cli

`go install github.com/nats-io/natscli/nats@latest`

`nats --version`

## listen to all events

`nats sub '>' --server nats://localhost:4222`
