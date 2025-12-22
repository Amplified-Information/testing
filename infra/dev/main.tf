module "shared" {
  source = "../shared"
  
  env  = "dev"
  aws_key_bastion = "dev-bastion"
  aws_key_internal = "dev"
  eip = "eipalloc-0a06fd4140fafdd3c"
  ebs_volume_id = "vol-0d3a782bdfffc34aa"
}

resource "aws_instance" "bastion_dev" {
  ami           = module.shared.ami
  instance_type = "t3.nano"
  key_name      = module.shared.aws_key_bastion
  availability_zone = module.shared.aws_az
  
  associate_public_ip_address = true                            # bastion needs a public IP
  
  subnet_id              = module.shared.aws_subnet_public_id   # PUBLIC subnet
  private_ip             = module.shared.fixed_ip_bastion

  vpc_security_group_ids = [
    module.shared.allow_web_egress_id,
    module.shared.allow_web_ingress_id,
    module.shared.allow_internal_vpc_id,
    # module.shared.allow_internal_private_subnet_id,
    module.shared.allow_ssh_ingress_id                          # SSH is allowed to Bastion
    # module.shared.allow_ssh_from_public_subnet_id,
    # module.shared.allow_8090_from_internet_id
  ]

  tags = {
    Name = "${module.shared.env}.bastion"
  }

  user_data = <<-EOF
    #!/bin/bash
    ${module.shared.install_base}
    ${module.shared.install_bastion}

    # for good measure
    reboot
  EOF
}



resource "aws_instance" "proxy_dev" {
  ami           = module.shared.ami
  instance_type = "t3.nano"
  key_name      = module.shared.aws_key_internal
  availability_zone = module.shared.aws_az

  subnet_id              = module.shared.aws_subnet_public_id # PUBLIC subnet
  private_ip             = module.shared.fixed_ip_proxy

  vpc_security_group_ids = [
    module.shared.allow_web_egress_id,
    module.shared.allow_web_ingress_id,
    module.shared.allow_internal_vpc_id,
    # module.shared.allow_internal_private_subnet_id,
    # module.shared.allow_ssh_ingress_id
    module.shared.allow_ssh_from_public_subnet_id,
    module.shared.allow_8090_from_internet_id,
    # module.shared.allow_proxy_ingress_id,
    module.shared.allow_monolith_egress_id,
  ]

  iam_instance_profile = module.shared.combined_iam_policy_name # combined IAM

  user_data = <<-EOF
    #!/bin/bash

    hostnamectl set-hostname proxy # script needs to know

    ${module.shared.install_base}
    ${module.shared.install_docker_runner}

    # for good measure
    reboot
  EOF

  tags = {
    Name = "${module.shared.env}.proxy"
  }
}
# Associate the 'dev' elastic IP with the proxy_dev instance
resource "aws_eip_association" "proxy_dev_eip_assoc" {
  allocation_id = module.shared.eip
  instance_id   = aws_instance.proxy_dev.id
}




resource "aws_instance" "monolith_dev" {
  ami           = module.shared.ami
  instance_type = "t3.micro"
  key_name      = module.shared.aws_key_internal
  availability_zone = module.shared.aws_az

  subnet_id              = module.shared.aws_subnet_private_id
  private_ip             = module.shared.fixed_ip_monolith

  vpc_security_group_ids = [
    module.shared.allow_web_egress_id,
    module.shared.allow_web_ingress_id,
    # module.shared.allow_internal_vpc_id,
    module.shared.allow_internal_private_subnet_id,
    # module.shared.allow_ssh_ingress_id,
    module.shared.allow_ssh_from_public_subnet_id,
    # module.shared.allow_8090_from_internet_id, 
    module.shared.allow_proxy_ingress_id,
    # module.shared.allow_monolith_egress_id,
  ]

  iam_instance_profile = module.shared.combined_iam_policy_name # combined IAM

  user_data = <<-EOF
    #!/bin/bash

    hostnamectl set-hostname monolith # script needs to know

    ${module.shared.install_base}
    ${module.shared.install_docker_runner}

    # for good measure
    reboot
  EOF

  tags = {
    Name = "${module.shared.env}.monolith"
  }
}


resource "aws_instance" "data_dev" {
  ami           = module.shared.ami
  instance_type = "t3.nano"
  key_name      = module.shared.aws_key_internal
  availability_zone = module.shared.aws_az                      # must be the same as the EBS volume

  subnet_id              = module.shared.aws_subnet_private_id
  private_ip             = module.shared.fixed_ip_data

   vpc_security_group_ids = [
    module.shared.allow_web_egress_id,
    module.shared.allow_web_ingress_id,
    # module.shared.allow_internal_vpc_id,
    module.shared.allow_internal_private_subnet_id,
    # module.shared.allow_ssh_ingress_id,
    module.shared.allow_ssh_from_public_subnet_id,
    # module.shared.allow_8090_from_internet_id,
    # module.shared.allow_proxy_ingress_id,
    # module.shared.allow_monolith_egress_id,
    module.shared.allow_bastion_db_id # Warning: allow 5432 from bastion
  ]

  iam_instance_profile = module.shared.combined_iam_policy_name # combined IAM

  user_data = <<-EOF
    #!/bin/bash

    hostnamectl set-hostname data # script needs to know

    ${module.shared.install_base}
    ${module.shared.install_docker_runner}
    ${module.shared.install_data}

    # for good measure
    reboot
  EOF

  tags = {
    Name = "${module.shared.env}.data"
  }
}
# Attach the EBS volume to the data_dev instance
resource "aws_volume_attachment" "data_dev_volume_attachment" {
  device_name = "/dev/xvdf"
  instance_id = aws_instance.data_dev.id
  volume_id   = module.shared.ebs_volume_id
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

# output "monolith_dev_public_dns" {
#   description = "Public DNS name of the monolith_dev instance"
#   value       = aws_instance.monolith_dev.public_dns
# }

output "monolith_dev_private_dns" {
  description = "Private DNS name of the monolith_dev instance"
  value       = aws_instance.monolith_dev.private_dns
}

# output "data_dev_public_dns" {
#   description = "Public DNS name of the data_dev instance"
#   value       = aws_instance.data_dev.public_dns
# }

output "data_dev_private_dns" {
  description = "Private DNS name of the data_dev instance"
  value       = aws_instance.data_dev.private_dns
}

output "bastion_dev_public_dns" {
  description = "Public DNS name of the bastion_dev instance"
  value       = aws_instance.bastion_dev.public_dns
}

output "bastion_dev_private_dns" {
  description = "Private DNS name of the bastion_dev instance"
  value       = aws_instance.bastion_dev.private_dns
}
