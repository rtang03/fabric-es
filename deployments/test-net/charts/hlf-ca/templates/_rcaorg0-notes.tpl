{{/* vim: set filetype=mustache: */}}
{{/*
Notes for rca-org0
*/}}
{{- define "rcaorg0.notes" -}}
########  ======= setup.rca0.sh =======
#!/bin/bash
######## post-install notes for {{ .Release.Name }}/{{ .Chart.Name }}
######## Objective: These steps:
######## - enroll rca0 ca admin
######## - create secret {{ .Values.caName }}-tls , secret for tls, using k8s convention
######## - register and enroll org0 org-admin
######## - register orderers -> rca0
######## - rename private keys
######## - prepare org admin and its admin-certs
########
######## 1. Get the name of the pod running rca:
export POD_RCA0=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol orderer's ca admin: rca-org0:
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- fabric-ca-client enroll -d -u http://{{ .Values.caAdmin }}:{{ .Values.caAdminPW }}@0.0.0.0:7054

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, {{ .Release.Name }}-tls , you need to remove it with:
# kubectl -n {{ .Release.Namespace }} delete secret {{ .Values.caName }}-tls
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "mv ./{{ .Values.mspId }}/ca/server/msp/keystore/*_sk ./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem"
export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA0} -- cat ./{{ .Values.mspId }}/ca/server/ca-cert.pem)
export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA0} -- cat ./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem)
kubectl -n {{ .Release.Namespace }} create secret generic {{ .Values.caName }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

{{- with .Values.ordererOrg }}
######## 4. Register and enroll ordererMSP org admin:
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "fabric-ca-client register -d --id.name {{ .orgadmin }} --id.secret {{ .orgadminPW }} --id.type admin --id.attrs \"hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert\" -u http://0.0.0.0:7054"
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/admin fabric-ca-client enroll -d -u http://{{ .orgadmin }}:{{ .orgadminPW }}@0.0.0.0:7054"
{{- end }}

######## 5. Register orderer orderer0-org0
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "fabric-ca-client register -d --id.name {{ .id }} --id.secret {{ .pass }} --id.type orderer -u http://0.0.0.0:7054"
{{- end }}

######## 6. Enroll orderer orderer0-org0
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/{{ .id }} fabric-ca-client enroll -d -u http://{{ .id }}:{{ .pass }}@0.0.0.0:7054"
{{- end }}

######## 7. Rename private key
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "mv ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/*_sk ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem"
{{- end }}
sleep 1
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "cp ./{{ $.Values.mspId }}/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./{{ $.Values.mspId }}/{{ .id }}/{{ $.Values.ordererOrg.domain }}-ca-cert.pem"
{{- end }}
sleep 1

######## 8. Copy org0 admin cert
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "mkdir -p ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts"
{{- end }}
sleep 1
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "cp ./{{ $.Values.mspId }}/admin/msp/signcerts/cert.pem ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts/{{ $.Values.ordererOrg.domain }}-admin-cert.pem"
{{- end }}

######## 9. Create admincert from org admin cert
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "mkdir -p ./{{ $.Values.mspId }}/msp/admincerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "mkdir -p ./{{ $.Values.mspId }}/msp/cacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "mkdir -p ./{{ $.Values.mspId }}/msp/tlscacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.ordererOrg.firstOrderer }}/msp/admincerts/{{ .Values.ordererOrg.domain }}-admin-cert.pem ./{{ $.Values.mspId }}/msp/admincerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.ordererOrg.firstOrderer }}/tls-ca-cert.pem ./{{ $.Values.mspId }}/msp/tlscacerts"
kubectl -n {{ .Release.Namespace }} exec $POD_RCA0 -- sh -c "cp ./{{ $.Values.mspId }}/{{ .Values.ordererOrg.firstOrderer }}/{{ .Values.ordererOrg.domain }}-ca-cert.pem ./{{ $.Values.mspId }}/msp/cacerts"

# ======= END setup.rca0.sh =======

########  ======= create-secret.rca0.sh =======
#!/bin/bash
######## post-install notes for {{ .Release.Name }}/{{ .Chart.Name }}
######## Objective: These steps, create secret
{{- range .Values.orderers }}
######## - {{ .id }}-cert {{ .id }}-key
######## - {{ .id }}-cacert {{ .id }}-tls {{ .id }}-tlsrootcert {{ .id }}-admincert
{{- end }}
########
######## 1. secret: {{ .Release.Name }}-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64 -d)
# export CA_PASSWORD=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64 -d)
export POD_RCA0=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. secret: cert and key
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/signcerts/cert.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-key --from-literal=key.pem="$CONTENT"
{{- end }}

######## 3. secret: CA cert
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-cacert --from-literal=cacert.pem="$CONTENT"
{{- end }}

######## 4. secret: tls cert and key
{{- range .Values.orderers }}
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/keystore/key.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
{{- end }}

######## 5. secret: tls root CA cert for both n0 and n1
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
kubectl -n n1 create secret generic {{ .id }}-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
{{- end }}

######## 6. create secret for {{ .Values.ordererOrg.domain }}-admin-cert.pem
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- sh -c "cat ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts/*.pem")
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-admincert --from-literal={{ $.Values.ordererOrg.domain }}-admin-cert.pem="$CONTENT"
{{- end }}

######## 7. create secret from orderer's public cert, for use by peers
{{- range .Values.orderers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA0 -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/signcerts/cert.pem)
kubectl -n n1 create secret generic {{ .id }}-tlssigncert --from-literal=cert.pem="$CONTENT"
{{- end }}

# ======= END create-secret.rca0.sh =======
{{- end -}}
