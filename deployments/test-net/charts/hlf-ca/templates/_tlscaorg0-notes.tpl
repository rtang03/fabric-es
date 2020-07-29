{{/* vim: set filetype=mustache: */}}
{{/*
Notes for tls-ca-org0
*/}}
{{- define "tlscaorg0.notes" -}}

# ======= Init steps to bootstrap this CA =======

######## 1. Get the name of the pod running tls-ca:
export POD_TLS_CA=$(kubectl get pods -n {{ .Release.Namespace }} -l "app=hlf-ca,release={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol tls-ca admin:
kubectl exec $POD_TLS_CA -- sh -c "fabric-ca-client enroll -d -u http://{{ .Values.adminUsername }}:{{ .Values.adminPassword }}@0.0.0.0:7054"

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, {{ .Release.Name }}-tls , you need to remove it with:
# kubectl -n {{ .Release.Namespace }} delete secret {{ .Release.Name }}-tls
kubectl exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/tls/server/msp/keystore/*_sk ./Org0MSP/tls/server/msp/keystore/key.pem"
export CERT=$(kubectl -n {{ .Release.Namespace }} exec ${POD_TLS_CA} -- cat ./Org0MSP/tls/server/ca-cert.pem)
export KEY=$(kubectl -n {{ .Release.Namespace }} exec ${POD_TLS_CA} -- cat ./Org0MSP/tls/server/msp/keystore/key.pem)
kubectl -n {{ .Release.Namespace }} create secret generic {{ .Release.Name }}-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 4. Register orderers:
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name {{ . }} --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"
{{- end }}

######## 5. Enrol tls-ca for orderer0
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/{{ . }} fabric-ca-client enroll -d -u http://{{ . }}:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
{{- end }}
sleep 2

######## 6. Rename private key
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLS_CA -- sh -c "cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/{{ . }}/tls-ca-cert.pem"
{{- end }}
sleep 2
{{- range .Values.orderers }}
kubectl -n {{ $.Release.Namespace }} exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/{{ . }}/tls-msp/keystore/*_sk ./Org0MSP/{{ . }}/tls-msp/keystore/key.pem"
{{- end }}
# ======= END of bootstrap=======
{{- end -}}
