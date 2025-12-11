resource "aws_security_group" "closed_network" {
  name        = "default_closed_network"
  description = "Security group allowing only port 22 ingress for IPv4 and blocking all IPv6 traffic"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

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

resource "aws_security_group" "web_traffic" {
  name        = "default_web_traffic"
  description = "Security group allowing HTTP (port 80) and HTTPS (port 443) ingress for IPv4"

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

output "closed_network_id" {
  description = "ID of the closed network security group"
  value       = aws_security_group.closed_network.id
}

output "web_traffic_id" {
  description = "ID of the web traffic security group"
  value       = aws_security_group.web_traffic.id
}
