Job will perform:
{{- if .Values.bootstrap.tasks.create_channel.enabled }}
  - create channel
{{- end }}
{{- if .Values.bootstrap.tasks.join_channel.enabled }}
  - join channel
{{- end }}
{{- if .Values.bootstrap.tasks.getchannnelinfo.enabled }}
  - get channel info
{{- end }}
{{- if .Values.bootstrap.tasks.update_anchor_peer.enabled }}
  - update anchor peer
{{- end }}
{{- if .Values.bootstrap.tasks.package_chaincode.enabled }}
  - package chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.install_chaincode.enabled }}
  - install chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.queryinstalled.enabled }}
  - query installed chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.approve_chaincode.enabled }}
  - approve chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.queryapproved.enabled }}
  - query approved chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.checkcommitreadiness.enabled }}
  - check commit readiness
{{- end }}
{{- if .Values.bootstrap.tasks.commit_chaincode.enabled }}
  - commit chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.querycommitted.enabled }}
  - query committed chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.init_chaincode.enabled }}
  - init chaincode
{{- end }}
{{- if .Values.bootstrap.tasks.dev_invoke.enabled }}
  - smoke test: invoke
{{- end }}
{{- if .Values.bootstrap.tasks.dev_query.enabled }}
  - smoke test: query
{{- end }}
--- End ---
