# Hedera-based prediction market

This project is divided into a number of folders:

- `scs`: on-chain smart contracts
- `clob`: an off-chain CLOB to manage cryptographically signed buy/sell order intents
- `infra`: infrastructure-as-code (platform agnostic)
- `web`: a web front-end
- `web.eng`: an engineering front-end
- `api`: a public backend for `web`
- `proxy`: a proxy to marshall traffic
- `eventbus`: event bus for pub/sub message communication
- `resources`: a version-controlled area to store artifacts, design files, images, etc.

## Quickstart

```bash
# load all env vars
source ./api/loadEnv.sh local
source ./clob/loadEnv.sh local
source ./db/loadEnv.sh local
source ./eventbus/loadEnv.sh local
source ./proxy/loadEnv.sh local
# source ./web/loadEnv.sh local # note: the web app is zero config

# now do:
docker compose -f docker-compose-proxy.yml up -d
docker compose -f docker-compose-data.yml up -d
docker compose -f docker-compose-monolith.yml up -d
```

## Infra components

There are 3 EC2 boxes deployed on AWS for each environment

| EC2 name  | Services             | Description                                                                 |
|-----------|----------------------|-----------------------------------------------------------------------------|
| proxy     | `proxy`              | Handles traffic routing and acts as an intermediary between services.       |
| monolith  | `web`, `api`, `clob` | A single, unified application containing multiple functionalities.          |
| data      | `eventbus`, `db`     | Manages storage, retrieval, and processing of application data.             |

Note: the proxy has a fixed IP address

| environment | IP address     | hostname         |
|-------------|----------------|------------------|
| dev         | 54.210.115.180 | dev.prism.market |
| uat         | TBC            | TBC              |
| prod        | 100.29.115.146 | prism.market     |

*Note: in future, we will use load balancers and not fixed IP addresses.*

Infra design:

![alt text](resources/Predict.drawio.png)

AWS (dev):

![alt text](resources/awsEC2.png)

## Versioning

Each service MUST be versioned.

Semver (semantic versioning) MUST be used.

For example, build a new docker image using the service NAME and the latest VERSION:

```bash
export NAME=eventbus
export VERSION=0.1.0
```

*Note: NAME must be one of {api, clob, db, eventbus, proxy, web, web.eng}*

`docker build -t ghcr.io/prismmarketlabs/${NAME}$:${VERSION} .`

`docker push ghcr.io/prismmarketlabs/${NAME}:$(VERSION)`

*Note: the latest version doesn't just get deployed automatically - a release is assembled together using a number of known-to-be stable service versions*

*Note: version numbers should never go down, always advancing*

## Docker container registry

Please use ghcr (Github container registry) only for images.

https://github.com/orgs/PrismMarketLabs/packages

Create a PAT here: https://github.com/settings/tokens/new - check `read:packages`, `write:packages` and `delete:packages`

Call the token "ghcr"

```bash
 export PAT=ghp_...
echo $PAT | docker login ghcr.io -u zoikhash --password-stdin # note: use your github username, "zoikhash" in this case
# you may have to install `pass` and `docker-credential-pass`
# or delete '{ "credsStore": "pass" }' from ~/.docker/config.json
```

Docker build instructions are at the top of the Dockerfiles

```bash
docker build -t ghcr.io/prismmarketlabs/envoy:0.1.0 . # Note the org name is all lowercase. Note the verison number
docker push ghcr.io/prismmarketlabs/envoy:0.1.0
```

```bash
export PAT=<personal_access_token>
echo $PAT | docker login ghcr.io --username MuzanHash --password-stdin

# example push:
docker push ghcr.io/NAMESPACE/IMAGE_NAME:v0.0.3
```

All (tagged) images should be pushed to this location.

All images **must** use [semantic versioning](https://semver.org/).

## Releases

All releases are specified in `docker-compose-SERVICE.ENV.yml` override files.

[Semantic versioning](https://semver.org/) **must** be used.

There is an **intentional separation** between **configuration** (`.config.ENV`) and **secrets** (`secrets.ENV`):

```bash
# Safe to check in these files
.config.local
.config.dev
.config.prod
```

Create the following files (use `.secrets.ENV.example` for reference):

```bash
# Do NOT check in files containing secrets
.secrets.local
.secrets.dev
.secrets.prod
```

### local

```bash
# load all config/secrets:
source ./api/loadEnv.sh local
source ./clob/loadEnv.sh local
source ./db/loadEnv.sh local
source ./eventbus/loadEnv.sh local
source ./proxy/loadEnv.sh local

docker compose -f docker-compose-proxy.yml up -d
docker compose -f docker-compose-monolith.yml up -d
docker compose -f docker-compose-data.yml up -d
```

### dev

Login to each of the dev boxes. Run:

```bash
# On Proxy:
source ./proxy/loadEnv.sh local
docker compose -f docker-compose-proxy.yml -f docker-compose-proxy.dev.yml up -d
# On Monolith:
source ./api/loadEnv.sh local
source ./clob/loadEnv.sh local
docker compose -f docker-compose-monolith.yml -f docker-compose-monolith.dev.yml up -d
# On Data:
source ./db/loadEnv.sh local
source ./eventbus/loadEnv.sh local
docker compose -f docker-compose-data.yml -f docker-compose-data.dev.yml up -d
```

### prod

Login to each of the prod boxes. Run:

```bash
# On Proxy:
docker compose -f docker-compose-proxy.yml -f docker-compose-proxy.prod.yml up -d
# On Monolith:
source ./api/loadEnv.sh local
source ./clob/loadEnv.sh local
docker compose -f docker-compose-monolith.yml -f docker-compose-monolith.prod.yml up -d
# On Data
source ./db/loadEnv.sh local
source ./eventbus/loadEnv.sh local
docker compose -f docker-compose-data.yml -f docker-compose-data.prod.yml up -d
```

### docker

View container CPU/memory usage:

`docker stats`

### Screencast transcode

Reduce to 480p:

`ffmpeg -i 'Screencast from 2025-11-17 14-14-57.webm' -vf scale=1280:-1 -c:v libvpx-vp9 -crf 32 -b:v 0 -c:a libopus output.webm`

### kubernetes

*Note: in the future, we may move to k8s*

The deployment prodecure would change in this case.

## hts

[Hedera Token Service](https://hedera.com/token-service) (hts) offers many potential advantages:

Potential advantages:

- near-zero tx fees (there may be interesting economic effects flowing from this)
- security: fewer lines of smart contract code (native tokens are at the protocol level, smart contract interfaces built rigorously by Hedera)
- ability to "pre-approve" funds up to a certain amount (as opposed to user having to "deposit" funds)
- no token association UX flow needed
- small dollar txs may encourage bots! (there may be a SPAM issue with this though...)
- etc.

Potential disadvantages:

- UI experience for the user due to [hts] token association requirements
- cluttering of user wallet with tokens (possible to use a single Fungible/NFT token?)
- ERC20-style smart contracts may cost more
- ERC20-style smart contracts may be incompatible with ed25519 key
- etc.

## Digital signatures

Every transaction initiated by the user has a digital signature.

`sig` is calculated based on the payload below (alphabetical ordering). The payload to construct a sig is a subset of the fields in `PredictionIntentRequest` in `api.proto`.

```golang
type ObjForSigning struct {
  BuySell                boolean // buy is 0, sell is 1
  CollateralUsdAbsScaled uint256
  EvmAdd                 uint256 // a 20-byte EVM address is 160-bits
  MarketIdUUID           uint128
  TxIdUUID               uint128
}
```

See: `assemblePayloadHexForSigning(...)` in ./web.eng/lib/utils.ts

See: `AssemblePayloadHexForSigning(...)` in ./api/server/lib/sign.go
