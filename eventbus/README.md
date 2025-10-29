# event bus

Using NATS for events.

No message persistence, no replaying of messages. No state is stored.

## one-liner

`docker run --name nats -p 4222:4222 -p 8222:8222 nats:latest`

## install nats-cli

`go install github.com/nats-io/natscli/nats@latest`

`nats --version`

## listen to all events

`nats sub '>' --server nats://localhost:4222`
