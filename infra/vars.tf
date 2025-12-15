variable "prism_ami" {
  description = "The AMI ID for the data instance"
  type        = string
  default     = "ami-0f9c27b471bdcd702" // Debian 13
}

variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "aws_az" {
  description = "The AWS availability zone"
  type        = string
  default     = "us-east-1a"
}

variable "aws_key_dev" {
  description = "The name of the key pair to use for SSH access"
  type        = string
  default     = "dev"
}

variable "aws_key_prod" {
  description = "The name of the key pair to use for SSH access"
  type        = string
  default     = "prod"
}

variable "fixed_ip_proxy" {
  description = "The fixed private IP address for the proxy instance"
  type        = string
  default     = "10.0.1.10"
}

variable "fixed_ip_monolith" {
  description = "The fixed private IP address for the monolith instance"
  type        = string
  default     = "10.0.1.11"
}

variable "fixed_ip_data" {
  description = "The fixed private IP address for the data instance"
  type        = string
  default     = "10.0.1.12"
}

locals {
  install_script = <<-EOF
#!/bin/bash
sudo apt-get update -y && sudo apt-get dist-upgrade -y

# Enable automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

sudo apt-get install -y unzip jq

# add a 'internal' user for running internal services
sudo useradd internal

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

# fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban


# ssh password so the 'internal' user can access boxes on 10.0.1.0/24 using ssh password auth:
echo "internal:$6$UjG7OyUN1qVaHENZ$RvQl8XNox9k8Qzl151LuhE4uJSLBe9TNGrN0lZ13QrvzH5tOg7LtfEOveVjPYuNI2wCOGq0NUZA3b7d4yH8Iz." | sudo chpasswd
# Allow password authentication in SSH
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
# Restart SSH service to apply changes
sudo systemctl restart sshd

EOF
}
