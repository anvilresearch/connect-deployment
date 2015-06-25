# connect-deployment

## Setup

### Digital Ocean

```
# Set DO_TOKEN environment variable with Personal Access Token
# created here: https://cloud.digitalocean.com/settings/applications#access-tokens
$ DO_TOKEN=11111111111111111111111111111111111

# Create a new Droplet and generate a hosts file for Ansible
$ ./bin/digitalocean

# Provision the machine with everything needed to run Anvil Connect securely
$ ansible-playbook playbook.yml -i hosts -l anvil-connect

# SSH into the machine
$ ssh smith@IP_ADDRESS
```
