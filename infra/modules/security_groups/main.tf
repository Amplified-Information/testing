# passed variables from parent module
variable "aws_az" { # accepts the value passed to it from the parent module
  description = "The availability zone to associate resources with"
  type        = string
}


#####
# VPC and Subnet
#####
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "prism-vpc"
  }
}

resource "aws_subnet" "main" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.aws_az
  map_public_ip_on_launch = false
  tags = {
    Name = "prism-subnet"
  }
}








###
# Internet Gateway, Route Table, and Association
###
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "prism-igw"
  }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "prism-route-table"
  }
}

resource "aws_route_table_association" "main" {
  subnet_id      = aws_subnet.main.id
  route_table_id = aws_route_table.main.id
}





#####
# Security Groups
#####
resource "aws_security_group" "closed_network" {
  name        = "default_closed_network"
  description = "Security group blocking all IPv4 and IPv6 traffic"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port      = 0
    to_port        = 0
    protocol       = "-1"
    ipv6_cidr_blocks = []
  }

  egress {
    from_port      = 0
    to_port        = 0
    protocol       = "-1"
    ipv6_cidr_blocks = []
  }
}

resource "aws_security_group" "allow_internal" {
  name        = "allow-internal"
  description = "Allow internal traffic between instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"]  # allow internal subnet
  }
}

resource "aws_security_group" "ssh" {
  name          = "default_ssh_access"
  description   = "Security group allowing SSH (port 22) ingress for IPv4"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "web_traffic" {
  name        = "default_web_traffic"
  description = "Security group allowing HTTP (port 80) and HTTPS (port 443) ingress for IPv4"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


#####
# Outputs
#####
output "closed_network_id" {
  description = "ID of the closed network security group"
  value       = aws_security_group.closed_network.id
}

output "allow_internal_id" {
  description = "ID of the allow internal traffic security group"
  value       = aws_security_group.allow_internal.id
}

output "ssh_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh.id
}

output "web_traffic_id" {
  description = "ID of the web traffic security group"
  value       = aws_security_group.web_traffic.id
}

output "aws_subnet_id" {
  description = "ID of the main subnet"
  value       = aws_subnet.main.id
}