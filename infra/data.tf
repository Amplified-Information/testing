# A server to store data
# postgres DB
# backup

# TBC:
# docker registry
# S3 buckets

variable "prism_ami" {
  description = "The AMI ID for the data instance"
  type        = string
  default     = "ami-0f9c27b471bdcd702" // Debian 13
}
