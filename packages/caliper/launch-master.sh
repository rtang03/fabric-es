#npx caliper launch master \
#    --caliper-bind-sut fabric:2.1.0 \
#    --caliper-workspace . \
#    --caliper-benchconfig benchmarks/scenario/simple/config.yaml \
#    --caliper-networkconfig networks/fabric/fabric-v1.4.1/2org1peergoleveldb/fabric-go.yaml

npm run build

npx caliper launch master \
    --caliper-workspace . \
    --caliper-benchconfig benchmarks/base.yaml \
    --caliper-networkconfig caliper.yaml \
    --caliper-fabric-gateway-usegateway
