#!/bin/bash


set -e


apt-get update -y
apt-get install -y git curl wget


curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu


wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb


cat <<EOF > /opt/aws/amazon-cloudwatch-agent/bin/config.json
{
  "metrics": {
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "resources": ["/"], "measurement": ["disk_used_percent"] }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*.log",
            "log_group_name": "DockerLogs",
            "log_stream_name": "{instance_id}-frontend"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s


systemctl start docker
systemctl enable docker


cd /home/ubuntu

git clone https://github.com/amar-kesetovic/iso-projekat-docker.git
cd iso-projekat-docker


cat <<EOF > .env
VITE_API_URL=http://<ALB_DNS_NAME>/api
EOF

docker compose -f docker-compose.prod.yml up -d frontend

echo "Frontend deployment complete."
