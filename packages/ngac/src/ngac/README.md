## Access Control

### Tagging

_PrincipalTag_ may include:

- orgname (inherit)
- x509id (inherit)

_ResourceTag_ may include:

- orgname (inherit)
- entityname (inherit)
- entityid (inherit)
- collaborator (user-defined)
- delegation (user-defined)

_InputTag_ may include:

- user defined attribute

### Naming Convention

_Administrative Action_

```text
// use fixed value
iam/org1msp/createuser

// use descriptor
iam/organization?id=org1msp/action?actionname=createuser
```

Mandatory tag: `id`, `actionname`

`organization` may be defined as

- fixed value, with optional array of filter `attr:value`
- `*` wildcard means applicable to any

_Event Action_

```text
// use fixed value
model/org1msp/document/documentcreated

// use descriptor
model?projectname=tradefinance/organization?id=org1msp]/entity?id=document]/documentcreated
```

Mandatory tag: `id`, `entityname`

_IAM Resource_

```text
// use fixed value
iam/org1msp/actn1234

// use descriptor
iam/organization?id=org1msp/account?id=actn1234]
```

Mandatory tag: `id`

_Entity Resource_

```text
// use fixed value
model/org1msp/document/document1234

// use descriptor
model/organization?id=org1msp/entity?id=document/entityid?id=document1234
```

Mandatory tag: `id`

### Policy Statement

_OrgAmin create and update user for his org_

```yaml
effect: allow
action:
  - iam/*/createuser
  - iam/*/updateuser
resource:
condition:
  stringEquals:
    PrincipalTag.type: admin
```

_User can tag his own user defined tag_

```yaml
effect: allow
action:
  - iam/*/listusertags
  - iam/*/taguser
  - iam/*/untaguser
resource: iam/organization?id=${ResourceTag.orgName}/account?id=${PrincipalTag.x509id}
condition:
  stringEquals:
    ResourceTag.accountnumber: ${PrincipalTag.x509id}
```

_User create Entity object_

```yaml
effect: allow
action:
  - model/*/entity?id=document/DocumentCreated
  - model/*/entity?id=document/DocumentSubmitted
resource: model/*/entity?id=document/entityid?id=${ResourceTag.entityId}
condition:
  stringEquals:
    ResourceTag.owner: ${PrincipalTag.x509id}
```

_Any user can read Entity object in his organization_

```yaml
effect: allow
action:
  - model/*/listentity
resource: model/organization?id=${PrincipalTag.orgname}/*/*
condition:
  stringEquals:
    ResourceTag.orgname: ${PrincipalTag.orgname}
```

_Contract owner allows signer to sign eContract in different organization_

```yaml
effect: allow
action:
  - model/organization?id=${InputTag.signerorgname}/signcontract
resource: model/organization?id=${PrincipalTag.orgname}/${entityName}/${entityId}
```
