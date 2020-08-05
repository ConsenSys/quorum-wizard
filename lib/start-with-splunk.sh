#!/bin/bash

export CONTRACTS_PATH=$(pwd)/out/config/contracts
export ABI_PATH=$(pwd)/out/config/splunk/abis

docker run -v ${CONTRACTS_PATH}:/txgen/contracts -v ${ABI_PATH}:/txgen/abis --entrypoint=./compile-and-copy.sh splunkdlt/ethereum-transaction-generator

docker-compose -f docker-compose-splunk.yml up -d

sleep 3

echo -n 'Waiting for splunk to start.'
until docker logs splunk | grep -m 1 'Ansible playbook complete'
do
  echo -n "."
  sleep 5
done
echo " "
echo "Splunk started!"

echo "Starting quorum stack..."
docker-compose up -d
