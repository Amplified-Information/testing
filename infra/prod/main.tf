module "shared" {
  source = "../shared"
  
  env  = "prod"
  aws_key_bastion = "prod-bastion"
  aws_key_internal = "prod"
  ebs_volume_id = "vol-0e4912ca44f31c1f5"
  ssl_cert_arn = "arn:aws:acm:us-east-1:063088900305:certificate/93dfad7f-8a67-43f3-a2e1-7f1f2f4b91c7" # https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/list
}
