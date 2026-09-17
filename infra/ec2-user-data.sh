#!/bin/bash
# EC2 user data for Amazon Linux 2023. Paste this into "User data" when launching the instance.
# Installs Docker, prepares /opt/loyl, and leaves the host ready for SSM deploys. No SSH needed.
set -euxo pipefail

dnf update -y
dnf install -y docker
systemctl enable --now docker

# Compose v2 as a docker plugin.
mkdir -p /usr/libexec/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# The SSM agent ships with AL2023; make sure it is running so deploys can reach this host.
systemctl enable --now amazon-ssm-agent

mkdir -p /opt/loyl
touch /opt/loyl/indexer.env
chmod 600 /opt/loyl/indexer.env

echo "Host ready. Put indexer.env, nginx.conf and docker-compose.yml in /opt/loyl, then deploy."
