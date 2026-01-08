module "shared" {
  source = "../shared"
  
  env  = "uat"
  aws_key_bastion = "uat-bastion"
  aws_key_internal = "uat"
  domain_name = "uat.prism.market"
  ebs_volume_id = "vol-043410f6197ee2c31"
  ssl_cert_arn = "arn:aws:acm:us-east-1:063088900305:certificate/48dc07e4-d1c2-488e-a085-3e499893a4e4" # https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/list
}