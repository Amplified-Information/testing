module "shared" {
  source = "../shared"
  
  env  = "dev"
  aws_key_bastion = "dev-bastion"
  aws_key_internal = "dev"
  domain_name = "dev.prism.market"
  # eip = "eipalloc-0a06fd4140fafdd3c"
  ebs_volume_id = "vol-0d3a782bdfffc34aa"
  ssl_cert_arn = "arn:aws:acm:us-east-1:063088900305:certificate/fdb39519-526b-48d2-a96e-307381465c05" # https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/list
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

  subnet_id              = module.shared.aws_subnet_private_id # aws_subnet_public_id # PUBLIC subnet
  private_ip             = module.shared.fixed_ip_proxy

  vpc_security_group_ids = [
    module.shared.allow_web_egress_id,
    module.shared.allow_web_ingress_id,
    # module.shared.allow_internal_vpc_id,
    module.shared.allow_internal_private_subnet_id,
    # module.shared.allow_ssh_ingress_id
    module.shared.allow_ssh_from_public_subnet_id,
    # module.shared.allow_8090_from_internet_id,
    # module.shared.allow_proxy_ingress_id,
    # module.shared.allow_monolith_egress_id,
    module.shared.allow_alb_ingress_id
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

output "monolith_dev_private_dns" {
  description = "Private DNS name of the monolith_dev instance"
  value       = aws_instance.monolith_dev.private_dns
}

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

output "alb_name" {
  value = aws_lb.alb_dev.name
}

output "alb_arn" {
  value = aws_lb.alb_dev.arn
}

output "alb_dns_name" {
  value = aws_lb.alb_dev.dns_name
}
















#####
# Application Load Balancer (ALB) for proxy
#####
resource "aws_lb" "alb_dev" {
  name               = "${module.shared.env}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [
    module.shared.allow_web_ingress_id,
    module.shared.allow_web_egress_id,
    module.shared.allow_alb_egress_id
  ]
  subnets            = [
    module.shared.aws_subnet_public_id,
    module.shared.aws_subnet_public_id_2
  ]

  enable_deletion_protection = false

  tags = {
    Name = "${module.shared.env}-alb"
  }
}

# Create a target group for the proxy_dev instance
resource "aws_lb_target_group" "alb_proxy_target_group_dev" {
  name        = "${module.shared.env}-alb-proxy-tg"
  port        = 8090
  protocol    = "HTTP"
  vpc_id      = module.shared.vpc_id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${module.shared.env}-alb-proxy-tg"
  }
}

# ALB listener uses HTTPS on port 443
resource "aws_lb_listener" "alb_listener_443" {
  load_balancer_arn = aws_lb.alb_dev.arn
  port              = 443
  protocol          = "HTTPS"

  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = module.shared.ssl_cert_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_proxy_target_group_dev.arn
  }
}

# Register the proxy_dev instance with the target group
resource "aws_lb_target_group_attachment" "proxy_dev_attachment" {
  target_group_arn = aws_lb_target_group.alb_proxy_target_group_dev.arn
  target_id        = aws_instance.proxy_dev.id
  port             = 8090
}















#####
# Route 53 - connect the ALB to the domain
#####

# Add an alias record pointing to the ALB
resource "aws_route53_record" "alb_alias" {
  zone_id = "Z07868573V3HLWHKP9WV6" # yes, this is fixed
  name    = "${module.shared.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.alb_dev.dns_name
    zone_id                = aws_lb.alb_dev.zone_id
    evaluate_target_health = true
  }
}
