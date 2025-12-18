module "shared" {
  source = "../shared"
  
  env  = "prod"
  aws_key_bastion = "prod-bastion"
  aws_key_internal = "prod"
  eip = "eipalloc-0353847e553f59021"
  ebs_volume_id = "vol-0e4912ca44f31c1f5"
}

resource "aws_instance" "bastion_prod" {
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



resource "aws_instance" "proxy_prod" {
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
# Associate the 'prod' elastic IP with the proxy_prod instance
resource "aws_eip_association" "proxy_prod_eip_assoc" {
  allocation_id = module.shared.eip
  instance_id   = aws_instance.proxy_prod.id
}




resource "aws_instance" "monolith_prod" {
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


resource "aws_instance" "data_prod" {
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
# Attach the EBS volume to the data_prod instance
resource "aws_volume_attachment" "data_prod_volume_attachment" {
  device_name = "/dev/xvdf"
  instance_id = aws_instance.data_prod.id
  volume_id   = module.shared.ebs_volume_id
}




#####
# Outputs
#####
output "proxy_prod_public_dns" {
  description = "Public DNS name of the proxy_prod instance"
  value       = aws_instance.proxy_prod.public_dns
}

output "proxy_prod_private_dns" {
  description = "Private DNS name of the proxy_prod instance"
  value       = aws_instance.proxy_prod.private_dns
}

# output "monolith_prod_public_dns" {
#   description = "Public DNS name of the monolith_prod instance"
#   value       = aws_instance.monolith_prod.public_dns
# }

output "monolith_prod_private_dns" {
  description = "Private DNS name of the monolith_prod instance"
  value       = aws_instance.monolith_prod.private_dns
}

# output "data_prod_public_dns" {
#   description = "Public DNS name of the data_prod instance"
#   value       = aws_instance.data_prod.public_dns
# }

output "data_prod_private_dns" {
  description = "Private DNS name of the data_prod instance"
  value       = aws_instance.data_prod.private_dns
}

output "bastion_prod_public_dns" {
  description = "Public DNS name of the bastion_prod instance"
  value       = aws_instance.bastion_prod.public_dns
}

output "bastion_prod_private_dns" {
  description = "Private DNS name of the bastion_prod instance"
  value       = aws_instance.bastion_prod.private_dns
}
