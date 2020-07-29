######## 10. Create secret for cacert of current org
kubectl -n {{ .Release.Namespace }} delete secret {{ .Values.ordererDomain }}-ca-cert.pem
kubectl -n {{ .Release.Namespace }} create secret {{ .Values.ordererDomain }}-ca-cert.pem
