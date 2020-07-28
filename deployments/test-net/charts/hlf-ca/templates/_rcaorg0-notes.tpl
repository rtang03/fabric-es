{{/* vim: set filetype=mustache: */}}
{{/*
Notes for rca-org0
*/}}
{{- define "rcaorg0.notes" -}}

# ======= Init steps to bootstrap this CA =======

######## 1. Get the name of the pod running rca:
export POD_RCA_ORG0=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol orderer's ca admin: rca-org0:
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- fabric-ca-client enroll -d -u http://rca-org0-admin:rca-org0-adminPW@0.0.0.0:7054

######## 3. Create secret for tls, used by ingress controller
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- sh -c "mv ./Org0MSP/ca/server/msp/keystore/*_sk ./Org0MSP/ca/server/msp/keystore/key.pem"
export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA_ORG0} -- cat ./Org0MSP/ca/server/ca-cert.pem)
export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA_ORG0} -- cat ./Org0MSP/ca/server/msp/keystore/key.pem)
kubectl -n {{ .Release.Namespace }} create secret generic rca-org0-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 4. Register ordererMSP org admin:
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- fabric-ca-client register -d --id.name admin-{{ .Values.ordererDomain }} --id.secret admin-org0.comPW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert" -u http://0.0.0.0:7054

######## 5. Enroll ordererMSP org admin and create
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/admin fabric-ca-client enroll -d -u http://admin-{{ .Values.ordererDomain }}:admin-org0.comPW@0.0.0.0:7054"
# kubectl  -n {{ .Release.Namespace }} create secret generic rcaorg0-cred

######## 6. Register and Enroll orderer orderer0-org0
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- fabric-ca-client register -d --id.name {{ . }} --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ . }} fabric-ca-client enroll -d -u http://{{ . }}:orderer0.org0.comPW@0.0.0.0:7054"
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- sh -c "mv ./Org0MSP/{{ . }}/msp/keystore/*_sk ./Org0MSP/{{ . }}/msp/keystore/key.pem"
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cp ./Org0MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ . }}/{{ $.Values.ordererDomain }}-ca-cert.pem
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- mkdir -p ./Org0MSP/{{ . }}/msp/admincerts
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cp ./Org0MSP/admin/msp/signcerts/cert.pem ./Org0MSP/{{ . }}/msp/admincerts/{{ $.Values.ordererDomain }}-admin-cert.pem
{{- end }}

######## 7. Create admincert from org admin cert
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- mkdir -p ./Org0MSP/msp/admincerts
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- mkdir -p ./Org0MSP/msp/cacerts
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- mkdir -p ./Org0MSP/msp/tlscacerts
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- cp ./Org0MSP/{{ include "hlf-common.o0" . }}/msp/admincerts/{{ .Values.ordererDomain }}-admin-cert.pem ./Org0MSP/msp/admincerts
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- cp ./Org0MSP/{{ include "hlf-common.o0" . }}/tls-ca-cert.pem ./Org0MSP/msp/tlscacerts
kubectl -n {{ .Release.Namespace }} exec $POD_RCA_ORG0 -- cp ./Org0MSP/{{ include "hlf-common.o0" . }}/{{ .Values.ordererDomain }}-ca-cert.pem ./Org0MSP/msp/cacerts

=== WORKING WITH secret
######## 1. secret: rcaorg0-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
export CA_ADMIN=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64 -d)
export CA_PASSWORD=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64 -d) )

######## 2. secret: cert and key
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/msp/signcerts/cert.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/msp/keystore/key.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-key --from-literal=key.pem="$CONTENT"
{{- end }}

######## 2. secret: CA cert
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-cacert --from-literal=/0-0-0-0-7054.pem="$CONTENT"
{{- end }}

######## 3. secret: tls cert and key
{{- range .Values.orderers }}
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/tls-msp/key/key.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
{{- end }}

######## 4. secret: tls root CA cert
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-tlsrootcert --from-literal=/tls-0-0-0-0-7054.pem="$CONTENT"
{{- end }}

######## 5. secret: genesis.block
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- cat ./Org0MSP/{{ . }}/genesis/genesis.block)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-genesis --from-literal=genesis.block="$CONTENT"
{{- end }}

######## 6. create secret for org0.com-admin-cert.pem
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA_ORG0 -- sh -c "cat ./Org0MSP/{{ . }}/msp/admincerts/*.pem")
kubectl -n {{ $.Release.Namespace }} create secret generic {{ . }}-admincert --from-file={{ $.Values.ordererDomain }}-admin-cert.pem="$CONTENT"
{{- end }}

{{- end -}}