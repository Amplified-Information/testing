# infra

Cloud platform -agnostic infrastructure deployment files (Terraform)

### Manually-created resources

The following resources (static - not to be deleted) should be created manually for each env:

- EIP (elastic IP address)
- EBS (elastic block storage) for persistent data storage
- S3 bucket - a landing zone for deploying docker-compose* files

### AWS elastic IP addresses

| Environment | Allocation ID               | Public IP       | Network border group |
|-------------|-----------------------------|-----------------|----------------------|
| dev         | eipalloc-0a06fd4140fafdd3c  | 54.210.115.180  | us-east-1            |
| prod        |                             | 100.29.115.146  | us-east-1            |

### AWS EBS resources

| Environment | Volume Id                   | Name            | Size   |
| ------------|-----------------------------|-----------------|--------|
| dev         | vol-0d3a782bdfffc34aa       | datamnt_dev     | 4GB    |
| prod        | TBC                         | datamnt_prod    | 20GB   |

### S3 bucket

| Environent |  Name                | arn                                | region    | url                                                       |
| -----------|----------------------|------------------------------------|-----------|-----------------------------------------------------------|
| all        | prismlabs-deployment | arn:aws:s3:::prismlabs-deployment  | us-east-1 | https://prismlabs-deployment.s3.us-east-1.amazonaws.com/* |

A new S3 bucket called `prismlabs-deployment` has been set up.

One-time setup (clickops):

- Block all public access
- ACLs disabled (AWS IAM is used for access)
- Enable bucket key

Next create two new policies:

1. Create a new policy called `s3-landing-zone-policy` (so github Actions can add files to S3):

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

2. Create another new policy called `ec2-s3-reader` (so the EC2 instance can read the S3)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

- Now create a new IAM user: IAM -> users
- Create user called `github-actions-s3-writer`
- Attach the policy `s3-landing-zone-policy` to `github-actions-s3-writer`

github actions will need the following info:

```bash
AWS_ACCESS_KEY_ID=<>      # "github-actions-s3-writer" user from IAM
AWS_SECRET_ACCESS_KEY=<>	# from IAM
AWS_REGION=us-east-1
S3_BUCKET=prismlabs-deployment 
```

### AWS login

Login to AWS here:

https://063088900305.signin.aws.amazon.com/console

Make sure you have an AWS access key: https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/security_credentials?section=IAM_credentials

Have `aws` installed: https://aws.amazon.com/cli/

Then run:

`aws configure`

Use your AWS access key from above.

### Access the boxes

The terraform file has configured the boxes to require a specific key (e.g. `dev`)

The `dev` key (.pem file) is a ed25519 key type and was generated using the AWS Web UI:

https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#CreateKeyPair:

Please contact Ethan or the CTO to get the key to enable you to login.

The key should be saved in:

`./secrets/dev.pem`

Do not share this file! Do not check this file in to source code!

You can then login with:

```bash
cd prism/infra
ssh -i ./.secrets/dev.pem admin@54.210.115.180
```

### Architecture

The system is designed with simplicity, cost and ease-of-use in mind.

Eventually we may move to kubernetes.

System design diagram:

![alt text](../resources/Predict.drawio.png)

### terraform

Init terraform (only have to do this once):

`cd` into the environment you want to deploy to (`dev`, `prod`, etc.)

`terraform init`

Deploy AWS resources:

`terraform apply`

Tear down AWS resources:

`terraform destroy`

### docker-compose

