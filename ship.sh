#!/bin/bash

docker build --platform linux/amd64 -t mluukkai/demoapp:oidc .; docker push mluukkai/demoapp:oidc
oc import-image demoapp:oidc 