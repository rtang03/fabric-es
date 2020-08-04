{{/* vim: set filetype=mustache: */}}
{{/*
define common properties
*/}}
{{- define "hlf-common.ordererDomain" -}}
{{ .Values.ordererDomain }}
{{- end -}}

{{- define "hlf-common.o0" -}}
{{- printf "orderer0.%s" .Values.ordererDomain }}
{{- end -}}

{{- define "hlf-common.o1" -}}
{{- printf "orderer1.%s" .Values.ordererDomain }}
{{- end -}}

{{- define "hlf-common.o2" -}}
{{- printf "orderer2.%s" .Values.ordererDomain }}
{{- end -}}

{{- define "hlf-common.o3" -}}
{{- printf "orderer3.%s" .Values.ordererDomain }}
{{- end -}}

{{- define "hlf-common.o4" -}}
{{- printf "orderer4.%s" .Values.ordererDomain }}
{{- end -}}
