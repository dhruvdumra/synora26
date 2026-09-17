# AWS setup

Everything here is done once, by hand, in the AWS console or CLI. Region: **ap-south-1 (Mumbai)**.
Replace `ACCOUNT_ID`, `REGION`, `BUCKET`, `DISTRIBUTION_ID`, `ECR_REPOSITORY` and `INSTANCE_ID` as you go.

The shape: the site is static files on S3 behind CloudFront. `/api/*` on the same CloudFront domain goes to
an EC2 instance running the indexer in Docker behind Nginx. One domain means no CORS and no mixed content,
and no certificate to buy.

```
GitHub push to main
  ├── Actions job "frontend" ──► S3 bucket ──► CloudFront (default behaviour)
  └── Actions job "indexer"  ──► ECR image ──► SSM Run Command ──► EC2: docker compose up
                                                                    └── Nginx :80 ──► indexer :3001
CloudFront behaviour /api/* ──────────────────────────────────────► EC2 (HTTP origin)
```

## 1. Before anything else

- Turn on MFA for the root user.
- Billing → Budgets → create a **$5 monthly cost budget** with an email alert.
- Check Billing → Free tier to see which instance sizes are free on your account. Accounts opened after
  mid-2025 get credits instead of the 12-month free tier, and `t3.micro` is usually the eligible size.

## 2. S3 bucket for the site

1. S3 → Create bucket, name it something like `loyl-site-<random>`, region ap-south-1.
2. Leave **Block all public access ON**. CloudFront reaches it privately; nothing is public directly.
3. No static website hosting. CloudFront serves the files.

## 3. CloudFront distribution

1. CloudFront → Create distribution.
2. Origin: the S3 bucket. Origin access: **Origin access control (OAC)**, then let the console update the
   bucket policy for you.
3. Default root object: `index.html`.
4. Default behaviour: redirect HTTP to HTTPS, allow GET/HEAD, cache policy **CachingOptimized**.
5. Functions → Create function, paste `infra/cloudfront-spa-rewrite.js`, publish, and attach it to the
   default behaviour on **Viewer request**. This makes client-side routes like `/badge/9` work.
6. Note the distribution ID and the `d111111abcdef8.cloudfront.net` domain.

## 4. ECR repository

```bash
aws ecr create-repository --repository-name loyl-indexer --region REGION
```

## 5. EC2 instance for the indexer

1. EC2 → Launch instance. Amazon Linux 2023, `t3.micro`.
2. **Key pair: none.** Deploys and shell access both go through SSM, so port 22 stays shut.
3. Network: allow inbound **TCP 80 from the CloudFront managed prefix list**
   (`com.amazonaws.global.cloudfront.origin-facing`), and nothing else. No 22, no 443.
4. Advanced details → User data: paste `infra/ec2-user-data.sh`.
5. IAM instance profile: a role with the managed policy **AmazonSSMManagedInstanceCore** plus
   `infra/iam/ec2-instance-policy.json`.
6. Allocate an **Elastic IP** and associate it, so the origin address survives a reboot.
7. Once it boots, connect with **Session Manager** (no SSH) and place three files in `/opt/loyl`:
   - `docker-compose.yml` from `infra/`
   - `nginx.conf` from `infra/`
   - `indexer.env`, from `indexer/.env.example`, with `CHAIN=sepolia`, the Alchemy `RPC_URL`,
     `BADGE_ADDRESS`, `BADGE_START_BLOCK`, `ALLOWED_ORIGINS=https://<your CloudFront domain>`,
     and a `SESSION_SECRET` from `openssl rand -hex 32`. Keep it `chmod 600`.

## 6. Point /api at the instance

Back in CloudFront → the distribution → Behaviours → Create behaviour:

- Path pattern: `/api/*`
- Origin: **Create a new origin** first, pointing at the instance's public DNS name, protocol **HTTP only**,
  port 80.
- Viewer protocol policy: Redirect HTTP to HTTPS.
- Allowed methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE** (the perk gate posts).
- Cache policy: **CachingDisabled**.
- Origin request policy: **AllViewerExceptHostHeader**.

The live stream (`/api/stream`) works through CloudFront because caching is disabled and Nginx does not
buffer it.

## 7. Let GitHub deploy without stored keys

1. IAM → Identity providers → Add provider → OpenID Connect:
   - Provider URL `https://token.actions.githubusercontent.com`
   - Audience `sts.amazonaws.com`
2. IAM → Roles → Create role → Web identity → that provider. Use
   `infra/iam/github-deploy-role-trust.json` as the trust policy and
   `infra/iam/github-deploy-policy.json` as the permission policy. Name it `loyl-github-deploy`.
3. In GitHub → repository → Settings → Secrets and variables → Actions:

   **Secrets**
   | Name | Value |
   |---|---|
   | `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::ACCOUNT_ID:role/loyl-github-deploy` |
   | `SEPOLIA_RPC_URL` | Alchemy Sepolia HTTPS URL |
   | `WALLETCONNECT_PROJECT_ID` | Reown project ID |

   **Variables**
   | Name | Value |
   |---|---|
   | `AWS_REGION` | `ap-south-1` |
   | `SITE_BUCKET` | the bucket name |
   | `CLOUDFRONT_DISTRIBUTION_ID` | the distribution ID |
   | `SITE_DOMAIN` | `d111111abcdef8.cloudfront.net` |
   | `ECR_REPOSITORY` | `loyl-indexer` |
   | `EC2_INSTANCE_ID` | `i-0123456789abcdef0` |
   | `BADGE_ADDRESS` | deployed contract address on Sepolia |
   | `BADGE_START_BLOCK` | deployment block from `contracts/deployments/11155111.json` |

Push to `main` and both jobs run: the site syncs to S3 and the CDN is invalidated, while the indexer image
is built, pushed to ECR and rolled out over SSM. The deploy finishes by polling
`https://SITE_DOMAIN/api/health` until it reports `"ok":true`.

## 8. Watching it

- CloudWatch → Log groups → `/loyl/indexer` and `/loyl/nginx` (shipped by the awslogs driver).
- `https://SITE_DOMAIN/api/health` shows the sync cursor, the chain head and how many blocks behind it is.
- EC2 → Monitoring for basic instance metrics.

## Costs

S3, CloudFront, ECR, SSM and CloudWatch at this size are pennies or free-tier. The two things that can
actually bill are the EC2 instance hours and the Elastic IP, so **stop the instance when the event is over**.
