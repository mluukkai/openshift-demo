#!/bin/bash
# Wait until no pods are in ContainerCreating state
while kubectl get pods -l app=demoapp | grep -q 'ContainerCreating'; do
  echo "Waiting for pods to be ready..."
  sleep 2
done
kubectl logs -f -l app=demoapp --max-log-requests=2