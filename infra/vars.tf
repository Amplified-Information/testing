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

locals {
  install_script = <<-EOF
#!/bin/bash
sudo apt-get update -y && sudo apt-get dist-upgrade -y

sudo apt-get install -y unzip jq

# add a 'prism' user for running prism services
sudo useradd prism

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
sudo usermod -aG docker prism
sudo systemctl restart docker

# fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban

EOF
}
