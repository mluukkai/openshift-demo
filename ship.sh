#!/bin/bash

docker build --platform linux/amd64 -t mluukkai/demoapp:staging .; docker push mluukkai/demoapp:staging
oc import-image demoapp:staging 