{{/* vim: set filetype=mustache: */}}
{{/*
Notes for rca-orgx
*/}}
{{- define "rcaorg.notes" -}}
# ======= bootstrap.sh =======

######## 1. Get the name of the pod running rca:
export POD_RCA=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol peer's ca admin: rca-org1:
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- fabric-ca-client enroll -d -u http://{{ .Values.caAdmin }}:{{ .Values.caAdminPW }}@0.0.0.0:7054

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, {{ .Release.Name }}-tls , you need to remove it with:
# kubectl -n {{ .Release.Namespace }} delete secret {{ .Values.caName }}-tls
kubectl -n {{ .Release.Namespace }} exec $POD_RCA -- sh -c "mv ./{{ .Values.mspId }}/ca/server/msp/keystore/*_sk ./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem"
export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA} -- cat ./{{ .Values.mspId }}/ca/server/ca-cert.pem)
export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_RCA} -- cat ./{{ .Values.mspId }}/ca/server/msp/keystore/key.pem)
kubectl -n {{ .Release.Namespace }} create secret generic {{ .Values.caName }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

{{- with .Values.peerOrg }}
######## 4. Register and enroll {{ $.Values.mspId }} org admin:
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "fabric-ca-client register -d --id.name {{ .orgadmin }} --id.secret {{ .orgadminPW }} --id.type admin --id.attrs \"hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert\" -u http://0.0.0.0:7054"
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/admin fabric-ca-client enroll -d -u http://{{ .orgadmin }}:{{ .orgadminPW }}@0.0.0.0:7054"
{{- end }}

######## 5. Register peer(s) for {{ $.Values.mspId }}
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "fabric-ca-client register -d --id.name {{ .id }} --id.secret {{ .pass }} --id.type peer -u http://0.0.0.0:7054"
{{- end }}

######## 6. Enroll peer(s) for {{ $.Values.mspId }}
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/{{ .id }} fabric-ca-client enroll -d -u http://{{ .id }}:{{ .pass }}@0.0.0.0:7054"
{{- end }}

######## 7. Rename private key
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "mv ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/*_sk ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem"
{{- end }}
sleep 1
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "cp ./{{ $.Values.mspId }}/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./{{ $.Values.mspId }}/{{ .id }}/{{ $.Values.peerOrg.domain }}-ca-cert.pem"
{{- end }}

######## 8. Copy admin cert
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "mkdir -p ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts"
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

=== WORKING WITH secret
######## 1. secret: {{ .Release.Name }}-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64 -d)
# export CA_PASSWORD=$(kubectl -n {{ .Release.Namespace }} get secret {{ .Release.Name }}-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64 -d)
export POD_RCA=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. secret: cert and key
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/signcerts/cert.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/keystore/key.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-key --from-literal=key.pem="$CONTENT"
{{- end }}

######## 3. secret: CA cert
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-cacert --from-literal=cacert.pem="$CONTENT"
{{- end }}

######## 4. secret: tls cert and key
{{- range .Values.peers }}
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/keystore/key.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
{{- end }}

######## 5. secret: tls root CA cert
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
{{- end }}

######## 6. create secret for {{ .Values.peerOrg.domain }}-admin-cert.pem
{{- range .Values.peers }}
export CONTENT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- sh -c "cat ./{{ $.Values.mspId }}/{{ .id }}/msp/admincerts/*.pem")
kubectl -n {{ $.Release.Namespace }} create secret generic {{ .id }}-admincert --from-literal={{ $.Values.peerOrg.domain }}-admin-cert.pem="$CONTENT"
{{- end }}

######## 7. create secret {{ .Values.peerOrg.domain }}-ca-cert.pem for Org0
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./Org1MSP/msp/cacerts/{{ .Values.peerOrg.domain }}-ca-cert.pem)
kubectl -n n0 create secret generic {{ .Values.peerOrg.org1cacert }} --from-literal={{ .Values.peerOrg.domain }}-ca-cert.pem="$CERT"

######## 8. create secret {{ .Values.peerOrg.domain }}-admin-cert.pem for Org0
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./Org1MSP/msp/admincerts/{{ .Values.peerOrg.domain }}-admin-cert.pem)
kubectl -n n0 create secret generic {{ .Values.peerOrg.org1admincerts }} --from-literal={{ .Values.peerOrg.domain }}-admin-cert.pem="$CERT"

######## 9. create secret org1.net-ca-cert.pem for Org0
export CERT=$(kubectl -n {{ $.Release.Namespace }} exec $POD_RCA -- cat ./Org1MSP/msp/tlscacerts/tls-ca-cert.pem)
kubectl -n n0 create secret generic {{ .Values.peerOrg.org1tlscacerts }} --from-literal=tls-ca-cert.pem="$CERT"

=== WORKING WITH Admin0
Switch back to terminal for Admin0 chart, and continue with genesis block creation.

# ======= END =======
{{- end }}
