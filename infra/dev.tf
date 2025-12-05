provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "data" {
  ami           = var.prism_ami
  instance_type = "t3.nano"

  tags = {
    Name = "data"
  }
}

resource "aws_instance" "proxy" {
  ami           = var.prism_ami
  instance_type = "t3.nano"

  tags = {
    Name = "proxy"
  }
}

resource "aws_instance" "monolith" {
  ami           = var.prism_ami
  instance_type = "t3.micro"

  tags = {
    Name = "monolith"
  }
}
