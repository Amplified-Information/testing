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
| prod        | TBC            | prism.market     |

*Note: in future, we will use load balancers and not fixed IP addresses.*

Infra design:

![alt text](resources/Predict.drawio.png)

AWS:

![alt text](resources/awsEC2.png)

## Versioning

Each service MUST be versioned. The VERSION file must be kept up-to-date with the latest version of the individual service.

Semver (semantic versioning) MUST be used.

If the version changes, the VERSION file MUST be updated and checked in accordingly.

For example, build a new docker image using the latest VERSION file.

`docker build -t ghcr.io/prismmarketlabs/proxy:$(cat VERSION) .`

`docker push ghcr.io/prismmarketlabs/proxy:$(cat VERSION)`

*Note: the latest version doesn't always get deployed*

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

All releases **must** be recorded in `release-manifest.yaml`

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
source .config.local
source .secrets.local
./release-deploy.sh v0.0.1 local
```

### dev

Login to dev box. Run:

```bash
source .config.dev
source .secrets.dev
./release-deploy.sh v0.0.1 dev
```

### prod

Login to prod box. Run:

```bash
source .config.prod
source .secrets.prod
./release-deploy.sh v0.0.1 prod
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
