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

## Docker container registry

Please use ghcr (Github container registry) only for images.

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

Create the following files (use `.config.ENV.example` and `.secrets.ENV.example` for reference):

```bash
.config.local
.config.dev
.config.prod

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
