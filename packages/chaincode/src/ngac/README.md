## Access Control

### Tagging

_ContextAttr_ may include:

- orgname (inherit)
- x509id (inherit)

_ResourceAttr_ may include:

- orgname (inherit)
- entityname (inherit)
- entityid (inherit)
- collaborator (user-defined)
- delegation (user-defined)

_InputTag_ may include:

- user defined attribute

### Naming Convention
*Every params and field are case sensitive*  

_Entity Resource_

```text
// use fixed value
model/Org1MSP/document/document1234

// use descriptor
model/org?id=Org1MSP/entity?id=document/entityid?id=document1234
```

Mandatory tag: `id`

### Policy Statement

_Principal creates new entity object his org_

```yaml
# Example 1
policyClass: event-creation
sid: allowCreateDocument
effect: Allow
allowedEvents:
  - DocumentCreated
attributes:
  uri: `${NAMESPACE.MODEL}/${NAMESPACE.ORG}?id=resourceAttrs:${RESOURCE.CREATOR_MSPID}/${NAMESPACE.ENTITY}?id=resourceAttrs:${RESOURCE.ENTITYNAME}`
condition:
  can:
    createDocument: `${RESOURCE.CREATOR_ID}`
```

_Principal create new events on pre-existing entity object_

```yaml
# Example 2
policyClass: event-creation
sid: allowUpdateUsername
effect: Allow
allowedEvents:
  - UsernameUpdated
  - UserTypeUpdated
attributes: 
  uri: `${NAMESPACE.MODEL}/${NAMESPACE.ORG}?id=resourceAttrs:${RESOURCE.CREATOR_MSPID}/${NAMESPACE.ENTITY}?id=resourceAttrs:${RESOURCE.ENTITYNAME}/${NAMESPACE.ENTITYID}?id=resourceAttrs:${RESOURCE.ENTITYID}`
condition:
  can:
    updateUsername: `${RESOURCE.???}`
  stringEquals:
    ContextAttr.MSPID: ${ResourceAttr.creator_mspid}
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
