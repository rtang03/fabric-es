{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "hlf-ord.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "hlf-ord.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "hlf-ord.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- /*
Credit: @technosophos
https://github.com/technosophos/common-chart/
labels.standard prints the standard Helm labels.
The standard labels are frequently used in metadata.
*/ -}}
{{- define "labels.standard" -}}
app: {{ include "hlf-ord.name" . }}
heritage: {{ .Release.Service | quote }}
release: {{ .Release.Name | quote }}
chart: {{ include "hlf-ord.chart" . }}
{{- end -}}

{{/*
Create Orderer home
*/}}
{{- define "hlf-ord.home" -}}
{{- printf "%s/%s.%s" .Values.ord.ordOrgPath .Values.ord.ordName .Values.ord.ordDomain }}
{{- end -}}

{{/*
Create Orderer host
*/}}
{{- define "hlf-ord.ordererhost" -}}
{{- printf "%s-%s" .Values.ord.ordName .Release.Name }}
{{- end -}}

{{/*
Create Orderer ledger production data
*/}}
{{- define "hlf-ord.ledger" -}}
{{- printf "%s/%s" .Values.ord.ledgerPath .Values.ord.ordName }}
{{- end -}}

{{/*
Create Orderer ledger production data
*/}}
{{- define "hlf-ord.ordDir" -}}
{{- printf "%s/%s.%s" .Values.ord.ordOrgPath .Values.ord.ordName .Values.ord.ordDomain }}
{{- end -}}
