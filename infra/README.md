# infra

Cloud platform -agnostic infrastructure deployment files (Terraform)

## Manually-created resources

The following resources (static - not to be deleted) should be created manually for each env:

- EIP (elastic IP address)
- EBS (elastic block storage) for persistent data storage
- S3 bucket - a landing zone for deploying docker-compose* files

## AWS elastic IP addresses

| Environment | Allocation ID               | Public IP       | Network border group |
|-------------|-----------------------------|-----------------|----------------------|
| dev         | eipalloc-0a06fd4140fafdd3c  | 54.210.115.180  | us-east-1            |
| prod        |                             | 100.29.115.146  | us-east-1            |

## AWS EBS resources

| Environment | Volume Id                   | Name            | Size   |
| ------------|-----------------------------|-----------------|--------|
| dev         | vol-0d3a782bdfffc34aa       | datamnt_dev     | 4GB    |
| prod        | TBC                         | datamnt_prod    | 20GB   |

## S3 bucket

| Environent |  Name                | arn                                | region    | url                                                       |
| -----------|----------------------|------------------------------------|-----------|-----------------------------------------------------------|
| all        | prismlabs-deployment | arn:aws:s3:::prismlabs-deployment  | us-east-1 | https://prismlabs-deployment.s3.us-east-1.amazonaws.com/* |

A new S3 bucket called `prismlabs-deployment` has been set up.

One-time setup (clickops):

- Block all public access
- ACLs disabled (AWS IAM is used for access)
- Enable bucket key

Now create a new policy called `s3-landing-zone-policy` (so github Actions can add files to S3):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowWriteToSpecificBucket",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:AbortMultipartUpload",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-ci-artifacts-bucket",
        "arn:aws:s3:::my-ci-artifacts-bucket/*"
      ]
    }
  ]
}
```

- Now create a new IAM user: IAM -> users
- Create user called `github-actions-s3-writer`
- Attach the policy `s3-landing-zone-policy` to `github-actions-s3-writer`

### EC2 boxes accessing the files on S3

*Note: Terraform applies a (combined) policy (./infra/shared) to allow S3 reads to happen.*

`aws s3 ls s3://prismlabs-deployment/docker-compose`

## github PAT

*Note: Terraform applies a (combined) policy (./infra/shared) to allow ssm reads to happen.*

So `proxy`, `monolith` and `data` can pull images from ghcr.io, need to create a new github PAT.

Create a new PAT: https://github.com/settings/apps

- New personal access token (classic)
- scope: `read:packages`

On your laptop, save this PAT in the aws secrets manager:

`aws ssm put-parameter --name "read_ghcr" --value "XXXXXXXX" --type "SecureString" --region "us-east-1"`

Now, on the EC2 instance, can do (Terraform has already set the permsissions for you)

`aws ssm get-parameter --name "read_ghcr" --with-decryption --region "us-east-1"`

## AWS login

Login to AWS here:

https://063088900305.signin.aws.amazon.com/console

Make sure you have an AWS access key: https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/security_credentials?section=IAM_credentials

Have `aws` installed: https://aws.amazon.com/cli/

Then run:

`aws configure`

Use your AWS access key from above.

## Access the boxes

The terraform file has configured the boxes to require a specific key (e.g. `dev`, `dev-bastion`, etc.)

**Note: you cannot login directly from the Internet to `proxy`, `monolith` or `data`. You must connect via `bastion`.**

The `dev` key and `dev-bastion` key are .pem files (ed25519 key type) and were generated using the AWS Web UI:

https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#CreateKeyPair:

Please contact Ethan or the CTO to get the key to enable you to login.

**Do not share these keys! Do not check this file in to source code!**

To login without the keys ever leaving your laptop, do:

```bash
# start ssh agent:
eval "$(ssh-agent -s)"
# add the bastion key and the key for the internal boxes:
ssh-add ~/Desktop/dev-bastion.pem
ssh-add ~/Desktop/dev.pem
# Can now do:
ssh -A admin@<bastion_hostname_aws>
ssh -A admin@10.0.1.11
```

**Do NOT save keys on the bastion**

## Architecture

The system is designed with simplicity, cost and ease-of-use in mind.

Eventually we may move to kubernetes.

System design diagram:

![alt text](../resources/Predict.drawio.png)

## terraform

Init terraform (only have to do this once):

`cd` into the environment you want to deploy to (`dev`, `prod`, etc.)

`terraform init`

Deploy AWS resources:

`terraform apply`

Tear down AWS resources:

`terraform destroy`

## docker-compose

