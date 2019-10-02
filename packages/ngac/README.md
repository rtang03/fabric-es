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
iam/organization+[orgname:org1msp]/action+[actionname:createuser]
```

Mandatory tag: `orgname`, `actionname`

`organization` may be defined as

- fixed value, with optional array of filter `attr:value`
- `*` wildcard means applicable to any

_Event Action_

```text
// use fixed value
model/org1msp/document/documentcreated

// use descriptor
model+[projectname:tradefinance]/organization+[orgname:org1msp]/entity+[entityname/document]/documentcreated
```

Mandatory tag: `orgname`, `entityname`

_IAM Resource_

```text
// use fixed value
iam/org1msp/actn1234

// use descriptor
iam/organization+[orgname:org1msp]/account+[acountnumber:actn1234]
```

Mandatory tag: `orgname`, `accountnumber`

_Entity Resource_

```text
// use fixed value
model/org1msp/document/document1234

// use descriptor
model/organization+[orgname:org1msp]/entity+[entityname:document]/entityId+[entityid:document1234]
```

Mandatory tag: `entityname`, `entityid`

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
resource: iam/organization+[orgname:${ResourceTag.orgName}]:account+[acountnumber/${PrincipalTag.x509id}]
condition:
  stringEquals:
    ResourceTag.accountnumber: ${PrincipalTag.x509id}
```

_User create Entity object_

```yaml
effect: allow
action:
  - model/*/entity+[entityname:document]/DocumentCreated
  - model/*/entity+[entityname:document]/DocumentSubmitted
resource: model/*/entity+[entityname:document]/entityid+[id:${ResourceTag.entityId}]
condition:
  stringEquals:
    ResourceTag.owner: ${PrincipalTag.x509id}
```

_Any user can read Entity object in his organization_

```yaml
effect: allow
action:
  - model/*/listentity
resource: model/*/entity+[entityname:*]/*
condition:
  stringEquals:
    ResourceTag.orgname: ${PrincipalTag.orgname}
```

_Contract owner allows signer to sign eContract in different organization_

```yaml
effect: allow
action:
  - model/organization+[orgname:${InputTag.signerorgname}]/signcontract
resource: model/organization+[orgname:${PrincipalTag.orgname}]/${entityName}/${entityId}
```
