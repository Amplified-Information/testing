#!/bin/bash
# Simple GitOps deployment script
# Usage: ./release-deploy.sh <release-version> <environment>
set -e

RELEASE_VERSION=$1
ENVIRONMENT=$2

if [ -z "$RELEASE_VERSION" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <release-version> <environment>"
    echo "Example: $0 v1.0.0 prod"
    echo "Must use semver (semantic versioning)"
    exit 1
fi

echo "🚀 Deploying release $RELEASE_VERSION to $ENVIRONMENT"

# load env vars:
source .config.$ENVIRONMENT
source .secrets.$ENVIRONMENT

# Parse YAML and extract service information
# Requires yq (install: brew install yq or snap install yq)
if ! command -v yq &> /dev/null; then
    echo "❌ Error: yq is required. Install with: brew install yq (Mac), apt-get install brew (Linux)"
    exit 1
fi


# Find the release in the manifest
RELEASE_INDEX=$(yq eval ".releases[] | select(.version == \"$RELEASE_VERSION\") | path | .[-1]" release-manifest.yaml)
if [ -z "$RELEASE_INDEX" ]; then
    echo "❌ Error: Release $RELEASE_VERSION not found in release-manifest.yaml"
    exit 1
fi
echo "✅ Found release $RELEASE_VERSION"


# Get release notes
NOTES=$(yq eval ".releases[$RELEASE_INDEX].notes" release-manifest.yaml)
echo "📝 Release notes: $NOTES"


# Get services
SERVICES=$(yq eval ".releases[$RELEASE_INDEX].services[].name" release-manifest.yaml)

echo ""
echo "📦 Services to deploy:"
echo "$SERVICES"
echo ""

# Deploy services in order (respecting dependencies)
for service in $SERVICES; do
    SERVICE_VERSION=$(yq eval ".releases[$RELEASE_INDEX].services[] | select(.name == \"$service\") | .version" release-manifest.yaml)
    SERVICE_IMAGE=$(yq eval ".releases[$RELEASE_INDEX].services[] | select(.name == \"$service\") | .image" release-manifest.yaml)
    
    echo "🔄 Deploying $service:$SERVICE_VERSION"
    echo "   Image: $SERVICE_IMAGE"
    
    # Check dependencies
    DEPS=$(yq eval ".releases[$RELEASE_INDEX].services[] | select(.name == \"$service\") | .dependencies[].service" release-manifest.yaml)
    if [ ! -z "$DEPS" ]; then
        echo "   Dependencies: $DEPS"
    fi
    
    # Deploy the service
    # Replace this with your actual deployment command
    # Examples:
    # - Docker: docker pull $SERVICE_IMAGE && docker run -d --env-file $ENVIRONMENT.env $SERVICE_IMAGE
    # - Kubernetes: kubectl set image deployment/$service $service=$SERVICE_IMAGE
    # - Docker Compose: docker-compose -f docker-compose.$ENVIRONMENT.yml up -d $service
    
    echo "   ✅ $service deployed"
    echo ""
done

echo "🎉 Deployment of $RELEASE_VERSION to $ENVIRONMENT completed!"
