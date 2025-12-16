#####
# variable definitions
#####
variable "env" {
  type        = string
  description = "Environment (dev, uat, prod)"
}
output "env" { value = var.env }

variable "aws_key" {
  description = "The name of the key pair to use for SSH access"
  type        = string
}
output "aws_key" { value = var.aws_key }

variable "aws_az" {
  description = "The AWS availability zone"
  type        = string
  default     = "us-east-1a"
}
output "aws_az" { value = var.aws_az }

output "ami" { value = "ami-0f9c27b471bdcd702" } // Debian 13
output "aws_region" { value = "us-east-1" }
output "fixed_ip_proxy" { value = "10.0.1.10" }
output "fixed_ip_monolith" { value = "10.0.1.11" }
output "fixed_ip_data" { value = "10.0.1.12" }

output "install_base" {
  value = <<-EOF
#!/bin/bash

sudo apt-get update -y && sudo apt-get dist-upgrade -y

# Enable automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

sudo apt-get install -y unzip jq

# fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban

# harden SSH
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config

# restart SSH service
systemctl restart ssh

EOF
}

output "install_docker_runner" {
  value = <<-EOF
#!/bin/bash

# 'internal' user for running internal services
sudo useradd -m internal

# ssh password so the 'internal' user can access boxes on 10.0.1.0/24 using ssh password auth:
sudo usermod -p '$6$UjG7OyUN1qVaHENZ$RvQl8XNox9k8Qzl151LuhE4uJSLBe9TNGrN0lZ13QrvzH5tOg7LtfEOveVjPYuNI2wCOGq0NUZA3b7d4yH8Iz.' internal
# Allow password authentication in SSH
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
# Restart SSH service to apply changes
sudo systemctl restart sshd

# Docker
# remove any conflicting packages:
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-doc podman-docker containerd runc | cut -f1)

# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
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

sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker

sudo usermod -aG docker admin # N.B. 'admin' is the default user on AWS Debian AMIs
sudo usermod -aG docker internal
sudo systemctl restart docker

EOF
}


#####
# VPC and Subnet
#####
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "${var.env}-vpc"
  }
}

resource "aws_subnet" "main" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.aws_az
  map_public_ip_on_launch = false
  tags = {
    Name = "${var.env}-subnet"
  }
}








###
# Internet Gateway, Route Table, and Association
###
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.env}-igw"
  }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.env}-route-table"
  }
}

resource "aws_route_table_association" "main" {
  subnet_id      = aws_subnet.main.id
  route_table_id = aws_route_table.main.id
}





#####
# Security Groups
#####
resource "aws_security_group" "disable_ipv6_ingress" {
  name        = "disable_ipv6_ingress"
  description = "Security group blocking all IPv6 traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port      = 0
    to_port        = 0
    protocol       = "-1"
    ipv6_cidr_blocks = []
  }
}

resource "aws_security_group" "disable_egress" {
  name   = "disable_egress"
  vpc_id = aws_vpc.main.id

  revoke_rules_on_delete = true

  # No egress blocks at all
}

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

resource "aws_security_group" "allow_internal" {
  name        = "allow_internal"
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
}

resource "aws_security_group" "allow_web_ingress" {
  name        = "allow_web_ingress"
  description = "Security group allowing HTTP (port 80) and HTTPS (port 443) ingress for IPv4"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow inbound HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


#####
# Outputs
#####
output "disable_ipv6_ingress_id" {
  value       = aws_security_group.disable_ipv6_ingress.id
}

output "disable_egress_id" {
  value       = aws_security_group.disable_egress.id
}

output "allow_web_egress_id" {
  value       = aws_security_group.allow_web_egress.id
}

output "allow_internal_id" {
  value       = aws_security_group.allow_internal.id
}

output "allow_ssh_ingress_id" {
  value       = aws_security_group.allow_ssh_ingress.id
}

output "allow_web_ingress_id" {
  value       = aws_security_group.allow_web_ingress.id
}



output "aws_subnet_id" {
  description = "ID of the main subnet"
  value       = aws_subnet.main.id
}

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}