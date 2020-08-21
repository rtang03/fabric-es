{{/* vim: set filetype=mustache: */}}
{{/*
Notes for rca-orgx
*/}}
{{- define "rcaorg.notes" -}}
########  ======= setup.rcax.sh =======
#!/bin/bash
. ./scripts/setup.sh
######## post-install notes for {{ .Release.Name }}/{{ .Chart.Name }}
######## Objective: These steps:
######## - enroll rca0 ca admin
######## - create secret {{ .Values.caName }}-tls , secret for tls, using k8s convention
######## - register and enroll org1 org-admin
######## - register and enroll peers -> rca0
######## - rename private keys
######## - prepare org admin and its admin-certs
########
######## 1. Get the name of the pod running rca:
export POD_RCA=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA
######## 2. Enrol peer's ca admin: rca-org1:
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- fabric-ca-client enroll -u http://{{ .Values.caAdmin }}:{{ .Values.caAdminPW }}@0.0.0.0:7054
printMessage "enroll {{ .Values.caAdmin }}" $?
######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, {{ .Release.Name }}-tls , you need to remove it with:
# kubectl -n {{ .Release.Namespace }} delete secret {{ .Values.caName }}-tls
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mv ./{{ .Values.mspId }}/ca/server/msp/keystore/*_sk ./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem"

export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA} -- cat ./{{ .Values.mspId }}/ca/server/ca-cert.pem)
preventEmptyValue "./{{ .Values.mspId }}/ca/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA} -- cat ./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem)
preventEmptyValue "./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem" $KEY

kubectl -n {{ .Release.Namespace }} create secret generic {{ .Values.caName }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret {{ .Values.caName }}-tls" $?
{{- with .Values.peerOrg }}
######## 4. Register and enroll {{ $.Values.mspId }} org admin:
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "fabric-ca-client register --id.name {{ .orgadmin }} --id.secret {{ .orgadminPW }} --id.type admin --id.attrs \"hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert\" -u http://0.0.0.0:7054 > /dev/null"
printMessage "register orgadmin {{ .orgadmin }}" $?

kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/admin fabric-ca-client enroll -u http://{{ .orgadmin }}:{{ .orgadminPW }}@0.0.0.0:7054"
printMessage "enroll orgadmin {{ .orgadmin }}" $?
{{- end }}
######## 5. Register peer(s) for {{ $.Values.mspId }}
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "fabric-ca-client register --id.name {{ .id }} --id.secret {{ .pass }} --id.type peer -u http://0.0.0.0:7054 > /dev/null"
printMessage "register peer {{ .id }}" $?
{{- end }}
######## 6. Enroll peer(s) for {{ $.Values.mspId }}
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/{{ .id }} fabric-ca-client enroll -u http://{{ .id }}:{{ .pass }}@0.0.0.0:7054"
printMessage "enroll peer {{ .id }}" $?
{{- end }}
######## 7. Rename private key
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "mv ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/*_sk ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem"
printMessage "rename private key" $?
{{- end }}
sleep 1
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./{{ $.Values.mspId }}/{{ .id }}/{{ $.Values.peerOrg.domain }}-ca-cert.pem"
{{- end }}
######## 8. Copy admin cert
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "mkdir -p ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts"
printMessage "cp admin cert" $?
{{- end }}
sleep 1
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/admin/msp/signcerts/cert.pem ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts/{{ $.Values.peerOrg.domain }}-admin-cert.pem"
{{- end }}
######## 9. Create admincert from org admin cert
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mkdir -p ./{{ $.Values.mspId }}/admin/msp/admincerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mkdir -p ./{{ $.Values.mspId }}/msp/admincerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mkdir -p ./{{ $.Values.mspId }}/msp/cacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mkdir -p ./{{ $.Values.mspId }}/msp/tlscacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.peerOrg.firstPeer }}/msp/admincerts/{{ .Values.peerOrg.domain }}-admin-cert.pem ./{{ $.Values.mspId }}/admin/msp/admincerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.peerOrg.firstPeer }}/msp/admincerts/{{ .Values.peerOrg.domain }}-admin-cert.pem ./{{ $.Values.mspId }}/msp/admincerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.peerOrg.firstPeer }}/tls-ca-cert.pem ./{{ $.Values.mspId }}/msp/tlscacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.peerOrg.firstPeer }}/{{ .Values.peerOrg.domain }}-ca-cert.pem ./{{ $.Values.mspId }}/msp/cacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mv ./{{ $.Values.mspId }}/admin/msp/keystore/*_sk ./{{ $.Values.mspId }}/admin/msp/keystore/key.pem"
printMessage "create admin cert" $?
# ======= END setup.rcax.sh =======

########  ======= create-secret.rca1.sh =======
#!/bin/bash
. ./scripts/setup.sh
######## post-install notes for {{ .Release.Name }}/{{ .Chart.Name }}
######## Objective: These steps, create secret
{{- range .Values.peers }}
######## - {{ .id }}-cert {{ .id }}-key
######## - {{ .id }}-cacert {{ .id }}-tls {{ .id }}-tlsrootcert {{ .id }}-admincert
{{- end }}
######## - {{ .Values.peerOrg.org1cacert }}
######## - {{ .Values.peerOrg.org1admincerts }}
######## - {{ .Values.peerOrg.org1tlscacerts }}
########
######## 1. secret: {{ .Release.Name }}-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64)
# export CA_PASSWORD=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64)
export POD_RCA=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA
######## 2. secret: cert and key
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/signcerts/cert.pem)
preventEmptyValue "./{{ $.Values.mspId }}/{{ .id }}/msp/signcerts/cert.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret {{ .id }}-cert" $?
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem)
preventEmptyValue "./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-key --from-literal=key.pem="$CONTENT"
printMessage "create secret {{ .id }}-key" $?
{{- end }}
######## 3. secret: CA cert
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/cacerts/0-0-0-0-7054.pem)
preventEmptyValue "./{{ $.Values.mspId }}/{{ .id }}/msp/cacerts/0-0-0-0-7054.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret {{ .id }}-cacert" $?
{{- end }}
######## 4. secret: tls cert and key
{{- range .Values.peers }}
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/signcerts/cert.pem)
preventEmptyValue "./{{ $.Values.mspId }}/{{ .id }}/tls-msp/signcerts/cert.pem" $CONTENT
export KEY=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/keystore/key.pem)
preventEmptyValue "./{{ $.Values.mspId }}/{{ .id }}/tls-msp/keystore/key.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret {{ .id }}-tls" $?
{{- end }}
######## 5. secret: tls root CA cert
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
preventEmptyValue "./{{ $.Values.mspId }}/{{ .id }}/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret {{ .id }}-tlsrootcert" $?
{{- end }}
######## 6. create secret for {{ .Values.peerOrg.domain }}-admin-cert.pem
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "cat ./{{ $.Values.mspId }}/admin/msp/admincerts/*.pem")
preventEmptyValue "./{{ $.Values.mspId }}/admin/msp/admincerts/*.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-admincert --from-literal={{ $.Values.peerOrg.domain }}-admin-cert.pem="$CONTENT"
printMessage "create secret {{ .id }}-admincert" $?
{{- end }}
######## 7. create secret for {{ .Values.peerOrg.domain }}-admin-key.pem
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "cat ./{{ $.Values.mspId }}/admin/msp/keystore/key.pem")
preventEmptyValue "./{{ $.Values.mspId }}/admin/msp/keystore/key.pem" $CONTENT
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-adminkey --from-literal={{ $.Values.peerOrg.domain }}-admin-key.pem="$CONTENT"
printMessage "create secret {{ .id }}-adminkey" $?
{{- end }}
######## 8. create secret {{ .Values.peerOrg.domain }}-ca-cert.pem for Org0
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./Org1MSP/msp/cacerts/{{ .Values.peerOrg.domain }}-ca-cert.pem)
preventEmptyValue "./Org1MSP/msp/cacerts/{{ .Values.peerOrg.domain }}-ca-cert.pem" $CONTENT
kubectl -n n0 create secret generic {{ .Values.peerOrg.org1cacert }} --from-literal={{ .Values.peerOrg.domain }}-ca-cert.pem="$CERT"
printMessage "create secret {{ .Values.peerOrg.org1cacert }}" $?
######## 9. create secret {{ .Values.peerOrg.domain }}-admin-cert.pem for Org0
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./Org1MSP/msp/admincerts/{{ .Values.peerOrg.domain }}-admin-cert.pem)
preventEmptyValue "./Org1MSP/msp/admincerts/{{ .Values.peerOrg.domain }}-admin-cert.pem" $CONTENT
kubectl -n n0 create secret generic {{ .Values.peerOrg.org1admincerts }} --from-literal={{ .Values.peerOrg.domain }}-admin-cert.pem="$CERT"
printMessage "create secret {{ .Values.peerOrg.org1admincerts }}" $?
######## 10. create secret org1.net-ca-cert.pem for Org0
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./Org1MSP/msp/tlscacerts/tls-ca-cert.pem)
preventEmptyValue "./Org1MSP/msp/tlscacerts/tls-ca-cert.pem" $CONTENT
kubectl -n n0 create secret generic {{ .Values.peerOrg.org1tlscacerts }} --from-literal=tls-ca-cert.pem="$CERT"
printMessage "create secret {{ .Values.peerOrg.org1tlscacerts }}" $?
# ======= END create-secret.rca1.sh =======

=== WORKING WITH Admin0
Switch back to terminal for Admin0 chart, and continue with genesis.block and channel.tx creation.

{{- end }}
