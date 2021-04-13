Deployment
==========

Dev-net
-------

`dev-net` provisions different development networks, based on docker-compose. Notice that the upcoming production
deployment will be running with k8s. For common development scenario, may use `./dn-run.sh 2 auth`,
which is 2-org Fabric setup, with Redis, and auth-server.

.. code:: bash

    cd deployments/dev-net
    ./dn-run.sh 2 auth

Test-net
--------

The test-net by Kubernetes + Istio + ArgoCD is under construction; with `GitOps <https://www.gitops.tech/>`__ included.

