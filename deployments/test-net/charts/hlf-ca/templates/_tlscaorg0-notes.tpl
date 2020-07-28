{{/* vim: set filetype=mustache: */}}
{{/*
Notes for tls-ca-org0
*/}}
{{- define "tlscaorg0.notes" -}}

# ======= Init steps to bootstrap this CA =======

######## 1. Get the name of the pod running tls-ca:
export POD_TLS_CA=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol tls-ca admin:
kubectl exec $POD_TLS_CA -- fabric-ca-client enroll -d -u http://{{ .Values.adminUsername }}:{{ .Values.adminPassword }}@0.0.0.0:7054

######## 3. Create secret for tls, used by ingress controller
kubectl exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/tls/server/msp/keystore/*_sk ./Org0MSP/tls/server/msp/keystore/key.pem"
export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_TLS_CA} -- cat ./Org0MSP/tls/server/ca-cert.pem)
export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_TLS_CA} -- cat ./Org0MSP/tls/server/msp/keystore/key.pem)
kubectl -n {{ .Release.Namespace }} create secret generic {{ .Release.Name }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 4. Register orderers:
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- fabric-ca-client register -d --id.name {{ include "hlf-common.o0" . }} --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- fabric-ca-client register -d --id.name {{ include "hlf-common.o1" . }} --id.secret orderer1.org0.comPW --id.type orderer -u http://0.0.0.0:7054
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- fabric-ca-client register -d --id.name {{ include "hlf-common.o2" . }} --id.secret orderer2.org0.comPW --id.type orderer -u http://0.0.0.0:7054
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- fabric-ca-client register -d --id.name {{ include "hlf-common.o3" . }} --id.secret orderer3.org0.comPW --id.type orderer -u http://0.0.0.0:7054
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- fabric-ca-client register -d --id.name {{ include "hlf-common.o4" . }} --id.secret orderer4.org0.comPW --id.type orderer -u http://0.0.0.0:7054
######## 5. Enrol tls-ca for orderer0
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ include "hlf-common.o0" . }} fabric-ca-client enroll -d -u http://{{ include "hlf-common.o0" . }}:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ include "hlf-common.o1" . }} fabric-ca-client enroll -d -u http://{{ include "hlf-common.o1" . }}:orderer1.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer1-org0,127,0.0.1"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ include "hlf-common.o2" . }} fabric-ca-client enroll -d -u http://{{ include "hlf-common.o2" . }}:orderer2.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer2-org0,127,0.0.1"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ include "hlf-common.o3" . }} fabric-ca-client enroll -d -u http://{{ include "hlf-common.o3" . }}:orderer3.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer3-org0,127,0.0.1"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ include "hlf-common.o4" . }} fabric-ca-client enroll -d -u http://{{ include "hlf-common.o4" . }}:orderer4.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer4-org0,127,0.0.1"
######## 6. Copy tls-ca cert
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ include "hlf-common.o0" . }}/tls-ca-cert.pem
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ include "hlf-common.o1" . }}/tls-ca-cert.pem
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ include "hlf-common.o2" . }}/tls-ca-cert.pem
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ include "hlf-common.o3" . }}/tls-ca-cert.pem
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ include "hlf-common.o4" . }}/tls-ca-cert.pem
######## 7. Rename private key
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/{{ include "hlf-common.o0" . }}/tls-msp/keystore/*_sk ./Org0MSP/{{ include "hlf-common.o0" . }}/tls-msp/keystore/key.pem"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/{{ include "hlf-common.o1" . }}/tls-msp/keystore/*_sk ./Org0MSP/{{ include "hlf-common.o1" . }}/tls-msp/keystore/key.pem"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/{{ include "hlf-common.o2" . }}/tls-msp/keystore/*_sk ./Org0MSP/{{ include "hlf-common.o2" . }}/tls-msp/keystore/key.pem"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/{{ include "hlf-common.o3" . }}/tls-msp/keystore/*_sk ./Org0MSP/{{ include "hlf-common.o3" . }}/tls-msp/keystore/key.pem"
kubectl -n {{ .Release.Namespace }} exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/{{ include "hlf-common.o4" . }}/tls-msp/keystore/*_sk ./Org0MSP/{{ include "hlf-common.o4" . }}/tls-msp/keystore/key.pem"

{{- end -}}
