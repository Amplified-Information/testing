provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "data_dev" {
  ami           = var.prism_ami
  instance_type = "t3.nano"

  tags = {
    Name = "data_dev"
  }
}

resource "aws_instance" "proxy_dev" {
  ami           = var.prism_ami
  instance_type = "t3.nano"

  tags = {
    Name = "proxy_dev"
  }
}

resource "aws_instance" "monolith_dev" {
  ami           = var.prism_ami
  instance_type = "t3.micro"

  tags = {
    Name = "monolith_dev"
  }
}
