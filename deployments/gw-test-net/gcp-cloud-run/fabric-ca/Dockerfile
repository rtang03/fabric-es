FROM hyperledger/fabric-ca:1.4.4

ENV FABRIC_CA_SERVER_HOME /var/artifacts/crypto-config/HktfpMSP/tls/server
ENV FABRIC_CA_SERVER_TLS_ENABLED false
ENV FABRIC_CA_SERVER_CSR_CN tls-ca.hktfp.com
ENV FABRIC_CA_SERVER_CSR_HOSTS 0.0.0.0
ENV FABRIC_CA_SERVER_DEBUG true
ENV FABRIC_CA_SERVER_CA_NAME=tls-ca.hktfp.com

RUN mkdir -p /var/artifacts/crypto-config/HktfpMSP

COPY assets/HktfpMSP /var/artifacts/crypto-config/HktfpMSP

ENTRYPOINT ["/usr/local/bin/fabric-ca-server", "start", "--cfg.identities.allowremove", "--port", "7054"]

EXPOSE 7054
