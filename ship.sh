#!/bin/bash

docker build --platform linux/amd64 -t mluukkai/demoapp:oidc .; docker push mluukkai/demoapp:oidc
oc import-image demoapp:oidc
while kubectl get pods -l app=demoapp | grep -q 'ContainerCreating'; do
  echo "Waiting for pods to be ready..."
  sleep 2
done
while kubectl get pods -l app=demoapp | grep -q 'Terminating'; do
  echo "Waiting for pods to be ready..."
  sleep 1
done
kubectl logs -f -l app=demoapp --max-log-requests=2
