#####
# variable definitions
#####
variable "env" {
  type        = string
  description = "Environment (dev, uat, prod)"
}
output "env" { value = var.env }

variable "aws_key_internal" {
  description = "The name of the key pair to use for SSH access to internal boxes"
  type        = string
}
output "aws_key_internal" { value = var.aws_key_internal }

variable "aws_key_bastion" {
  description = "The name of the key pair to use for SSH access to the bastion host"
  type        = string
}
output "aws_key_bastion" { value = var.aws_key_bastion }

variable "aws_az" {
  description = "The AWS availability zone"
  type        = string
  default     = "us-east-1a"
}
output "aws_az" { value = var.aws_az }

variable "eip" {
  description = "The Elastic IP for the environment"
  type        = string
}
output "eip" { value = var.eip }

variable "aws_region" {
  description = "The AWS region to use"
  type        = string
  default     = "us-east-1"
}
output "aws_region" { value = var.aws_region }

variable "ebs_volume_id" {
  description = "The EBS volume ID to attach to the data instance"
  type        = string
}
output "ebs_volume_id" { value = var.ebs_volume_id }

output "ami" { value = "ami-0f9c27b471bdcd702" } // Debian 13
output "fixed_ip_bastion" { value = "10.0.0.9" } // N.B. bastion is on the public subnet 
output "fixed_ip_proxy" { value = "10.0.0.10" } // N.B. proxy is on the public subnet 
output "fixed_ip_monolith" { value = "10.0.1.11" }
output "fixed_ip_data" { value = "10.0.1.12" }

output "install_base" {
  value = <<-EOF
#!/bin/bash

wait_for_machine_ready() {
  local retries=100
  local delay=5

  for ((i=1; i<=retries; i++)); do
    echo "Checking if the machine is ready (attempt $i)..."
    if curl -I --silent http://google.com | head -n 1 | grep "HTTP" > /dev/null; then
      echo "Machine is ready."
      return 0
    fi

    echo "Machine not ready. Retrying in $delay seconds..."
    sleep "$delay"
  done

  echo "Machine did not become ready after $((retries * delay)) seconds."
  return 1
}

###
# First, wait for the machine to be ready
###
wait_for_machine_ready || exit 1

sudo apt-get update
sudo apt-get install -y unzip jq yq
sudo apt-get install -y dnsutils telnet

# Enable automatic security updates
sudo apt-get install -y unattended-upgrades
sudo DEBIAN_FRONTEND=noninteractive dpkg-reconfigure -plow unattended-upgrades


# fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban

EOF
}

output "install_docker_runner" {
  value = <<-EOF
#!/bin/bash

# S3 cli (for pulling container images and configs):
sudo apt install -y awscli

# Docker
# remove any conflicting packages:
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-doc podman-docker containerd runc | cut -f1)

# Add Docker's official GPG key:
sudo apt update
sudo apt install -y ca-certificates curl 
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<DOCKER_EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
DOCKER_EOF

sudo apt-get update -y && sudo apt-get dist-upgrade -y

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

newgrp docker # admin user must be in the docker group
sudo usermod -aG docker admin

sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker

sudo usermod -aG docker admin # N.B. 'admin' is the default user on AWS Debian AMIs

sudo systemctl restart docker

newgrp docker # don't have to logout and log back in again...







#####
# Devops: Create a deploy.sh script
#####
cat <<'SCRIPT' > /home/admin/deploy.sh
#!/bin/bash

# Variables
ENVIRONMENT="${var.env}"
AWS_REGION="${var.aws_region}"
SECRET_NAME="read_ghcr"
MACHINE=$(hostname) # should be 'proxy', 'monolith', or 'data'
S3_BUCKET="prismlabs-deployment"
# Retrieve the service names from docker-compose-$MACHINE.yml:

login_to_github() {
  echo "Logging in to GitHub Container Registry..."
  GITHUB_PAT=$(aws ssm get-parameter --name "$SECRET_NAME" --with-decryption --region "$AWS_REGION" | jq ".Parameter.Value" -r)
  if [ -z "$GITHUB_PAT" ]; then
    echo "Failed to retrieve GitHub PAT from AWS Secrets Manager."
    exit 1
  fi
  echo "$GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
}

pull_docker_compose_files() {
  echo "Retrieving Docker Compose files from S3..."
  FILES=$(aws s3 ls "s3://$S3_BUCKET" --region "$AWS_REGION" | awk '{print $4}')

  # Filter for the base file and the environment-specific file
  BASE_FILE="docker-compose-$MACHINE.yml"
  ENV_FILE="docker-compose-$MACHINE.$ENVIRONMENT.yml"

  if ! echo "$FILES" | grep -q "$BASE_FILE"; then
    echo "Base file $BASE_FILE not found in S3 bucket."
    exit 1
  fi

  if ! echo "$FILES" | grep -q "$ENV_FILE"; then
    echo "Environment file $ENV_FILE not found in S3 bucket."
    exit 1
  fi

  # Download the base file
  echo "Downloading $BASE_FILE..."
  aws s3 cp "s3://$S3_BUCKET/$BASE_FILE" "./$BASE_FILE" --region "$AWS_REGION"

  # Download the environment-specific file
  echo "Downloading $ENV_FILE..."
  aws s3 cp "s3://$S3_BUCKET/$ENV_FILE" "./$ENV_FILE" --region "$AWS_REGION"

  # symlink the base file to docker-compose.yml (for docker compose logging, etc.)
  ln -s "$BASE_FILE" docker-compose.yml
}

pull_config_secrets_files() {
  echo "Retrieving .config* files, .secret file and loadEnv.sh from S3..."
  # Loop through each service as defined in the docker-compose file under "services"
  for SERVICE in $(yq '.services | keys | join(" ")' ./docker-compose-$MACHINE.yml | tr -d '"'); do
    echo "Pulling .config*, .secrets and loadEnv.sh for $SERVICE..."
    mkdir -p "./$SERVICE" # Ensure the local folder exists

    aws s3 cp "s3://$S3_BUCKET/$SERVICE" "./$SERVICE/" --recursive --region "$AWS_REGION"

    chmod +x "./$SERVICE/loadEnv.sh" # make loadEnv.sh executable
  done
}

load_env_vars() {
  # Load environment variables (reads .config* files and loads .secrets from AWS SSM)
  for SERVICE in $(yq '.services | keys | join(" ")' ./docker-compose-$MACHINE.yml | tr -d '"'); do
    source ./$SERVICE/loadEnv.sh $ENVIRONMENT
  done
}

redeploy_if_changed() {
  echo "Checking for changes in Docker Compose files..."
  BASE_FILE="docker-compose-$MACHINE.yml"
  ENV_FILE="docker-compose-$MACHINE.$ENVIRONMENT.yml"

  # Temporary files for comparison
  TMP_BASE_FILE="/tmp/$BASE_FILE"
  TMP_ENV_FILE="/tmp/$ENV_FILE"

  # Ensure the /tmp files exist
  touch /tmp/$BASE_FILE
  touch /tmp/$ENV_FILE

  # Calculate hashes and compare
  if [ -f "$TMP_BASE_FILE" ] && [ -f "$TMP_ENV_FILE" ]; then
    BASE_HASH_NEW=$(sha256sum "$BASE_FILE" | awk '{print $1}')
    BASE_HASH_OLD=$(sha256sum "$TMP_BASE_FILE" | awk '{print $1}')
    ENV_HASH_NEW=$(sha256sum "$ENV_FILE" | awk '{print $1}')
    ENV_HASH_OLD=$(sha256sum "$TMP_ENV_FILE" | awk '{print $1}')

    if [ "$BASE_HASH_NEW" == "$BASE_HASH_OLD" ] && [ "$ENV_HASH_NEW" == "$ENV_HASH_OLD" ]; then
      echo "No changes detected in Docker Compose files. Skipping redeploy."
      return
    fi
  fi

  # Got here? Re-deploy the service...

  # but first, copy new files to /tmp for future comparison
  cp "$BASE_FILE" "$TMP_BASE_FILE"
  cp "$ENV_FILE" "$TMP_ENV_FILE"

  echo "Changes detected in Docker Compose files. Redeploying..."
  
  # Deploy with docker compose
  docker compose -f "$BASE_FILE" -f "$ENV_FILE" up -d # daemon mode
}

main() {
  login_to_github
  pull_docker_compose_files
  pull_config_secrets_files
  load_env_vars
  redeploy_if_changed
}

main
SCRIPT



# Make the deploy.sh script executable
chown admin:admin /home/admin/deploy.sh
chmod +x /home/admin/deploy.sh

# and run it:
/home/admin/deploy.sh

EOF
}

output "install_bastion" {
  value = <<-EOF
#!/bin/bash

sudo apt-get install ufw -y

# UFW - only allow ssh
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw enable
EOF
}

output "install_data" {
  value = <<-EOF
#!/bin/bash

# prepare mount point for postgres data volume
mkdir -p /mnt/external

# Check if volume is formatted; format only if needed (i.e. only format on first boot, not on reboots)
if ! file -s /dev/xvdf | grep -q "filesystem"; then
  mkfs -t ext4 /dev/xvdf
fi

# Add to fstab if not present (auto-mount on reboots)
grep -q "/dev/xvdf" /etc/fstab || echo "/dev/xvdf /mnt/external ext4 defaults,nofail 0 2" >> /etc/fstab

# Now mount all:
mount -a

# internal user needs access to the /mnt/external area
mkdir -p /mnt/external/postgresdata
chown -R internal:internal /mnt/external
EOF
}



#####
# VPC
#####
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  # Request an Amazon-provided IPv6 CIDR block
  assign_generated_ipv6_cidr_block = true

  tags = {
    Name = "${var.env}-vpc"
  }
}

#####
# Private Subnet
#####
resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  ipv6_cidr_block          = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 1) # first /64 from VPC
  availability_zone       = var.aws_az
  map_public_ip_on_launch = false

  tags = { Name = "${var.env}-private-subnet" }
}

#####
# Public Subnet
#####
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.0.0/24"
  ipv6_cidr_block          = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 0) # first /64 from VPC
  availability_zone       = var.aws_az
  map_public_ip_on_launch = true

  tags = { Name = "${var.env}-public-subnet" }
}


#####
# Internet Gateway
#####
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.env}-igw" }
}

#####
# NAT Gateway for IPv4 (IPv6 doesn't need NAT)
#####
resource "aws_eip" "nat" { # need another Elastic IP for the NAT Gateway
  tags = { Name = "${var.env}-nat" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "${var.env}-nat"
  }
}


#####
# Route Table for Private Subnet
#####
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # IPv4 default route via NAT
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  # IPv6 default route directly via IGW
  route {
    ipv6_cidr_block = "::/0"
    gateway_id      = aws_internet_gateway.main.id
  }

  # instead use security groups for internal traffic
  # # N.B. Ensure there's a route to the private subnet for internal communication (e.g. proxy accessed on EIP can access 10.0.1.0/24 network)
  # route {
  #   cidr_block = "10.0.1.0/24" # private subnet CIDR
  #   gateway_id = aws_internet_gateway.main.id
  # }

  tags = { Name = "${var.env}-private-rt" }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

#####
# Route Table for Public Subnet
#####
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  # IPv4 via IGW
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  # IPv6 via IGW
  route {
    ipv6_cidr_block = "::/0"
    gateway_id      = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.env}-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}







#####
# Security Groups
#####
resource "aws_security_group" "allow_web_egress" {
  name   = "allow_web_egress"
  vpc_id = aws_vpc.main.id

  egress {
    description      = "Allow IPv4 outbound traffic on port 80"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    description      = "Allow IPv4 outbound traffic on port 443"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    description      = "Allow all IPv6 outbound traffic on port 80"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description      = "Allow all IPv6 outbound traffic on port 443"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "allow_web_ingress" {
  name        = "allow_web_ingress"
  description = "Security group allowing HTTP (port 80) and HTTPS (port 443) ingress for IPv4 and IPv6"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow inbound HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound HTTP traffic ipv6"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description = "Allow inbound HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound HTTPS traffic ipv6"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "allow_internal_vpc" {
  name        = "allow_internal_vpc"
  description = "Allow internal traffic between instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"] # Allow traffic within the VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"] # Allow traffic within the VPC
  }
}

resource "aws_security_group" "allow_internal_private_subnet" {
  name        = "allow_internal_private_subnet"
  description = "Allow internal traffic between instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.1.0/24"]  # allow internal subnet
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.1.0/24"]  # allow internal subnet
  }
}


resource "aws_security_group" "allow_ssh_ingress" {
  name          = "allow_ssh_ingress"
  description   = "Security group allowing SSH (port 22) ingress for IPv4"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow inbound SSH traffic"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound SSH traffic ipv6"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "allow_ssh_from_public_subnet" {
  name        = "allow_ssh_from_public_subnet"
  description = "Allow ssh traffic from the public subnet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/24"] # Public subnet CIDR 10.0.0.0/24 and NOT 10.0.1.0/24
  }
}

resource "aws_security_group" "allow_8090_from_internet" {
  name        = "allow_8090_from_internet"
  description = "Allow 8090 traffic from the internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 8090
    to_port     = 8090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Allow from anywhere on the internet
  }
}

resource "aws_security_group" "allow_proxy_ingress" {
  name        = "allow_proxy_ingress"
  description = "Allow proxy ingress traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 8888
    to_port     = 8888
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/24"] # Public subnet CIDR
  }

  ingress {
    from_port   = 50051
    to_port     = 50051
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/24"]
  }

  ingress {
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/24"]
  }
}

resource "aws_security_group" "allow_monolith_egress" {
  name        = "allow_monolith_egress"
  description = "Allow monolith egress traffic"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 8888
    to_port     = 8888
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"] # Private subnet CIDR
  }

  egress {
    from_port   = 50051
    to_port     = 50051
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"]
  }

  egress {
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"]
  }
}

#####
# IAM roles
# - view files with `aws s3 ls s3://prismlabs-deployment --region us-east-1`
# - access `aws ssm get-parameter ...` - so can acccess the "read_ghcr" secret
#####

resource "aws_iam_role" "combined_role" {
   name = "${var.env}-combined-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "combined_policy" {
  name        = "${var.env}-combined-policy"
  description = "Combined policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      // S3 read access
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          "arn:aws:s3:::prismlabs-deployment",
          "arn:aws:s3:::prismlabs-deployment/*"
        ]
      },
      // ssm read access
      {
        Effect = "Allow",
        Action = "ssm:GetParameter",
        Resource = [
          "arn:aws:ssm:us-east-1:063088900305:parameter/read_ghcr",
          "arn:aws:ssm:us-east-1:063088900305:parameter/*"    # TODO reduce scope for /prod/*
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "combined_policy_attach" {
  role       = aws_iam_role.combined_role.name
  policy_arn = aws_iam_policy.combined_policy.arn
}

resource "aws_iam_instance_profile" "combined_instance_profile" {
  name = "${var.env}-combined-instance-profile"
  role = aws_iam_role.combined_role.name
}













#####
# Outputs
#####
output "allow_web_egress_id" {
  value       = aws_security_group.allow_web_egress.id
}

output "allow_web_ingress_id" {
  value       = aws_security_group.allow_web_ingress.id
}

output "allow_internal_vpc_id" {
  value       = aws_security_group.allow_internal_vpc.id
}

output "allow_internal_private_subnet_id" {
  value       = aws_security_group.allow_internal_private_subnet.id
}

output "allow_ssh_ingress_id" {
  value       = aws_security_group.allow_ssh_ingress.id
}

output "allow_ssh_from_public_subnet_id" {
  value       = aws_security_group.allow_ssh_from_public_subnet.id
}

output "allow_8090_from_internet_id" {
  value       = aws_security_group.allow_8090_from_internet.id
}

output "allow_proxy_ingress_id" {
  value       = aws_security_group.allow_proxy_ingress.id
}

output "allow_monolith_egress_id" {
  value       = aws_security_group.allow_monolith_egress.id
}




output "aws_subnet_public_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "aws_subnet_private_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}




output "combined_iam_policy_name" {
  value = aws_iam_instance_profile.combined_instance_profile.name
}