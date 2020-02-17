## Fixture

Below variables are fixed values.

- CHAINCODE_ID=eventstore
- CHAINCODE_ID_PRIVATEDATA=privatedata

_Other fixtures:_
_Rule 1: chaincode version_

- format: chaincode will be '1.0', '2.0', '3.0', etc. No minor version.

### Configuration (.env)

`CA_ENROLLMENT_ID_ADMIN`

- desc: root CA admin ID
- format: rca-[OrgName]-admin
- example: rca-hktfp-admin

### Naming Convention

_Rule 1: MSPID_

- format: '[OrgName]MSP'
- example: EtcMSP, PbctfpMSP

_Rule 2: Collection Name_

- format: '[OrgName]PrivateDetails'
- example: EtcPrivateDetails
- note: collections.json is incorrect now. Will refactor later

_Rule 3: Filename of Connection Profile_

- format: 'connection-org[number].yaml'
- example: connection-org1.yaml

_Rule 4: name field of Connection Profile_

- rule: the name field of each connection profile should be named as the deployment network
- example: `name: lib-dev-net` or `name: app-net`

_Rule 5: CA Identity for peer_

- format: [peer name].[org host name] or [peer name]-[org host name]
- example: peer0.etradeconnect.net

### Port Assignment

_Rule 1: (Apollo) Gateway Port_

- Start with 40XX
- Example: 4001 => Org1, 4002 => Org2, etc

_Rule 2: Reserved Port_

- 4001 => gw-org1 (for EtcMSP)
- 4002 => gw-org2 (for PbcMSP)

_Rule 3: Root CA Port_

- 6052 reserved for rca0: tls-ca
- 6053 reserved for rca1: CA of orderer organization
- Organizational CA shall start with 6054, and increment sequentially

### Dev/Test Environment

_Rule 1: Secret/Password_

- Except CA identity, all secret or password will be default to 'password'.
