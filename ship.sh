#!/bin/bash

docker build --platform linux/amd64 -t mluukkai/demoapp:login .; docker push mluukkai/demoapp:login
oc import-image demoapp:login 