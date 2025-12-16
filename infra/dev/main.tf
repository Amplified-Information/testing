module "shared" {
  source = "../shared"
  env  = "dev"
  aws_key = "dev"
  aws_az = "us-east-1a"
}

resource "aws_instance" "bastion_dev" {
  ami           = module.shared.ami
  instance_type = "t3.nano"
  key_name      = module.shared.aws_key
  availability_zone = module.shared.aws_az
  
  associate_public_ip_address = true # bastion needs a public IP
  
  subnet_id              = module.shared.aws_subnet_id
  vpc_security_group_ids = [
    module.shared.disable_ipv6_ingress_id,
    # module.shared.disable_egress_id,
    module.shared.allow_web_egress_id,
    module.shared.allow_internal_id,
    module.shared.allow_ssh_ingress_id, # SSH is allowed to Bastion
    # module.shared.allow_web_ingress_id,
  ]

  tags = {
    Name = "dev.bastion"
  }

  user_data = <<-EOF
#!/bin/bash
${module.shared.install_base}

# create non-root bastion user
useradd -m -s /bin/bash bastion

# give bastion sudo privileges without password (optional)
usermod -aG sudo bastion

# setup SSH directory
mkdir -p /home/bastion/.ssh
chown bastion:bastion /home/bastion/.ssh
chmod 700 /home/bastion/.ssh

# remove any existing authorized_keys for default user
rm -f /home/ubuntu/.ssh/authorized_keys
rm -f /home/ec2-user/.ssh/authorized_keys

# copy a non-privileged public key
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDS4Y4saImPHrW8GwlgArdpiTRXUjgNZyR8WgUUa8mnOMscSEuw9qfzKHbzCNOwBpvkajJAmogInYPGyVqZB64+i0ZGUKW4q6onyhlO3ZuwyEKVHW30ZjQuon526U6PmcvtfB7rsgzw8IXUPGLyK6J7cBsvjMWdcniIIpJ/4AGbD/xD19mODs8FAq6TL+O/XFLDHJ4woCsz3dqtmY4I2/En0JW5S6cLIuueYMHlrnWYz5vTI8ruXMgXOCY8ghtZb+vwbV43SlUtRhj50yEU+cnYf7O0dFZSOUlxYwn3Xv/QjDcIRnW137ewxVYXP54Q46NhHU4HSiG3Ns4Tzzt33i/yKO/R1/52MUEzyPk/6njQmHh7R/zqOShuXEPLlIRl4qW0lk02W9ufQTigTBMrnmpESPE2KU/lyywf2BJCjwxZUYIVGZy6zMcrSoYKzQ8v4kyIeTyRTxKGTSOszfmCBdwJF3Q2S2PoNFuqo23y4O5myBxdAMgFO/QQNRmENpGoNk9ih6DVp59wsgm9enxDntCU7rsT1nR69npDEFyFZ0Jj4zssu9RFaDrzPlp+lJ7aB8xymR7RqtM9ATq4/0mQg6LF0oZ82vOAKr/3R2e+3inGZdCwc+EZSxpoKfDUg8QVyqgYUm49dfbSjodpzhcKQvHbA7EPLViEJ/+ZdPUfn/nmnQ==" > /home/bastion/.ssh/authorized_keys
chown bastion:bastion /home/bastion/.ssh/authorized_keys
chmod 600 /home/bastion/.ssh/authorized_keys

EOF
}


resource "aws_instance" "proxy_dev" {
  ami           = module.shared.ami
  instance_type = "t3.nano"
  key_name      = module.shared.aws_key
  availability_zone = module.shared.aws_az

  subnet_id              = module.shared.aws_subnet_id
  private_ip             = module.shared.fixed_ip_proxy

  vpc_security_group_ids = [
    module.shared.disable_ipv6_ingress_id,
    # module.shared.disable_egress_id,
    module.shared.allow_web_egress_id,
    module.shared.allow_internal_id,
    # module.shared.allow_ssh_ingress_id
    module.shared.allow_web_ingress_id,
  ]

  user_data = <<-EOF
    #!/bin/bash
    ${module.shared.install_base}
    ${module.shared.install_docker_runner}
  EOF

  tags = {
    Name = "dev.proxy"
  }
}
# Associate the 'dev' elastic IP with the proxy_dev instance
resource "aws_eip_association" "proxy_dev_eip_assoc" {
  allocation_id = "eipalloc-0a06fd4140fafdd3c"
  instance_id   = aws_instance.proxy_dev.id
}


resource "aws_instance" "monolith_dev" {
  ami           = module.shared.ami
  instance_type = "t3.micro"
  key_name      = module.shared.aws_key
  availability_zone = module.shared.aws_az

  subnet_id              = module.shared.aws_subnet_id
  private_ip             = module.shared.fixed_ip_monolith

  vpc_security_group_ids = [
    module.shared.disable_ipv6_ingress_id,
    # module.shared.disable_egress_id,
    module.shared.allow_web_egress_id,
    module.shared.allow_internal_id,
    # module.shared.allow_ssh_ingress_id
    # module.shared.allow_web_ingress_id,
  ]

  user_data = <<-EOF
    #!/bin/bash
    ${module.shared.install_base}
    ${module.shared.install_docker_runner}
  EOF

  tags = {
    Name = "dev.monolith"
  }
}


resource "aws_instance" "data_dev" {
  ami           = module.shared.ami
  instance_type = "t3.nano"
  key_name      = module.shared.aws_key
  availability_zone = module.shared.aws_az # must be the same as the EBS volume

  subnet_id              = module.shared.aws_subnet_id
  private_ip             = module.shared.fixed_ip_data

   vpc_security_group_ids = [
    module.shared.disable_ipv6_ingress_id,
    # module.shared.disable_egress_id,
    module.shared.allow_web_egress_id,
    module.shared.allow_internal_id,
    # module.shared.allow_ssh_ingress_id
    module.shared.allow_web_ingress_id,
  ]

  user_data = <<-EOF
    #!/bin/bash
    ${module.shared.install_base}
    ${module.shared.install_docker_runner}

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

  tags = {
    Name = "dev.data"
  }
}
# Attach the EBS volume to the data_dev instance
resource "aws_volume_attachment" "data_dev_volume_attachment" {
  device_name = "/dev/xvdf"
  instance_id = aws_instance.data_dev.id
  volume_id   = "vol-0d3a782bdfffc34aa"
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