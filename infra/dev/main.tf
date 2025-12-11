module "security_groups" {
  source = "../modules/security_groups"
}

provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "proxy_dev" {
  ami           = var.prism_ami
  instance_type = "t3.nano"
  key_name      = var.aws_key_dev

  vpc_security_group_ids = [module.security_groups.closed_network_id, module.security_groups.web_traffic_id]

  user_data = <<-EOF
    #!/bin/bash
    ${local.install_script}
  EOF

  tags = {
    Name = "proxy_dev"
  }
}

# Associate the 'dev' elastic IP with the proxy_dev instance
resource "aws_eip_association" "proxy_dev_eip_assoc" {
  allocation_id = "eipalloc-0a06fd4140fafdd3c"
  instance_id   = aws_instance.proxy_dev.id
}


resource "aws_instance" "monolith_dev" {
  ami           = var.prism_ami
  instance_type = "t3.micro"
  key_name      = var.aws_key_dev

  vpc_security_group_ids = [module.security_groups.closed_network_id]

  user_data = <<-EOF
    #!/bin/bash
    ${local.install_script}
  EOF

  tags = {
    Name = "monolith_dev"
  }
}

resource "aws_instance" "data_dev" {
  ami           = var.prism_ami
  instance_type = "t3.nano"
  key_name      = var.aws_key_dev

  vpc_security_group_ids = [module.security_groups.closed_network_id]

  user_data = <<-EOF
    #!/bin/bash
    ${local.install_script}
  EOF

  tags = {
    Name = "data_dev"
  }
}




#####
# Outputs
#####
output "proxy_dev_public_dns" {
  description = "Public DNS name of the proxy_dev instance"
  value       = aws_instance.proxy_dev.public_dns
}

output "proxy_dev_private_dns" {
  description = "Private DNS name of the proxy_dev instance"
  value       = aws_instance.proxy_dev.private_dns
}

output "monolith_dev_public_dns" {
  description = "Public DNS name of the monolith_dev instance"
  value       = aws_instance.monolith_dev.public_dns
}

output "monolith_dev_private_dns" {
  description = "Private DNS name of the monolith_dev instance"
  value       = aws_instance.monolith_dev.private_dns
}

output "data_dev_public_dns" {
  description = "Public DNS name of the data_dev instance"
  value       = aws_instance.data_dev.public_dns
}

output "data_dev_private_dns" {
  description = "Private DNS name of the data_dev instance"
  value       = aws_instance.data_dev.private_dns
}
