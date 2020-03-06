From: fabric@lists.hyperledger.org <fabric@lists.hyperledger.org> on behalf of Eryargi, Hakan via Lists.Hyperledger.Org <hakan.eryargi=accenture.com@lists.hyperledger.org>
Sent: Friday, February 28, 2020 7:00 AM
To: fabric@lists.hyperledger.org <fabric@lists.hyperledger.org>
Cc: fabric@lists.hyperledger.org <fabric@lists.hyperledger.org>
Subject: Re: [Hyperledger Fabric] Hyperledger Fabric meets Kubernetes

  Dear All,



Below is a summary of recent updates to our Helm charts:



  Support for hybrid networks. We also provided a sample of spreading the Fabric network over three Kubernetes clusters, covering all possible scenarios, with orderer, without orderer, etc.
  The same mechanism can be used for any combination of hybrid networks, some parts running on premises as plain Docker containers, or on bare metal or whatever.
  https://github.com/APGGroeiFabriek/PIVT/blob/master/README.md#cross-cluster-raft-network

  Declaratively make almost arbitrary channel config updates. There is still room to improve here but it’s quite easy to extend and add more functionality
  https://github.com/APGGroeiFabriek/PIVT/blob/master/README.md#updating-channel-configuration

  Support for Raft orderer without enabling TLS globally.  Thanks to Fabric 1.4.5 release, this is possible since FAB-15648 is backported to 1.4 branch.
  We were waiting for this feature since long time for transparent load balancing inside Kubernetes. Already applied to our environments and works great.
  But eventually we need to enable TLS and lose transparent load balancing again.
  I believe it will be really useful separating client and cluster facing ports on peers and orderers.  Please vote for FAB-17111 if you think similar.
  https://github.com/APGGroeiFabriek/PIVT/blob/master/README.md#scaled-up-raft-network-without-tls

  Support and sample for Golang chaincode. Due to GOPATH variable they should be handled differently.
  Nobody reported any issue about Java chaincode, so possibly it just works out of the box.

  So, cheers and happy Fabricing in Kubernetes as always!

  Hakan
