{{/* vim: set filetype=mustache: */}}
{{/*
Notes for tls-ca-org1
*/}}
{{- define "tlscaorg.notes" -}}
########  ======= setup.tlscaX.sh =======
#!/bin/bash
######## post-install notes for {{ .Release.Name }}/{{ .Chart.Name }}
######## Objective: These steps:
######## - enroll tls-ca
######## - create secret {{ .Release.Name }}-tls , secret for tls, using k8s convention
######## - register peers -> tlsca
######## - enrol peers -> tlsca
######## - rename private keys
########
######## 1. Get the name of the pod running tls-ca:
export POD_TLSCA1=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol tls-ca admin:
kubectl -n {{ .Release.Namespace }} exec $POD_TLSCA1 -- sh -c "fabric-ca-client enroll -d -u http://{{ .Values.caAdmin }}:{{ .Values.caAdminPW }}@0.0.0.0:7054"

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, {{ .Release.Name }}-tls , you need to remove it with:
# kubectl -n {{ .Release.Namespace }} delete secret {{ .Release.Name }}-tls
kubectl -n {{ .Release.Namespace }} exec $POD_TLSCA1 -- sh -c "mv ./{{ .Values.mspId }}/tls/server/msp/keystore/*_sk ./{{ .Values.mspId }}/tls/server/msp/keystore/key.pem"
export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_TLSCA1} -- cat ./{{ .Values.mspId }}/tls/server/ca-cert.pem)
export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_TLSCA1} -- cat ./{{ .Values.mspId }}/tls/server/msp/keystore/key.pem)
kubectl -n {{ .Release.Namespace }} create secret generic {{ .Release.Name }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 4. Register peer:
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLSCA1 -- sh -c "fabric-ca-client register -d --id.name {{ .id }} --id.secret {{ .pass }} --id.type peer -u http://0.0.0.0:7054"
{{- end }}

######## 5. Enrol tls-ca for peer
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLSCA1 -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/{{ $.Values.mspId }}/{{ .id }} fabric-ca-client enroll -d -u http://{{ .id }}:{{ .pass }}@0.0.0.0:7054 --enrollment.profile tls --csr.hosts \"{{ .csrHost }},127.0.0.1\""
{{- end }}
sleep 1

######## 6. Rename private key
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLSCA1 -- sh -c "cp ./{{ $.Values.mspId }}/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./{{ $.Values.mspId }}/{{ .id }}/tls-ca-cert.pem"
{{- end }}
sleep 2
{{- range .Values.peers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLSCA1 -- sh -c "mv ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/keystore/*_sk ./{{ $.Values.mspId }}/{{ .id }}/tls-msp/keystore/key.pem"
{{- end }}

# ======= END of tlscaX.sh =======
{{- end }}
