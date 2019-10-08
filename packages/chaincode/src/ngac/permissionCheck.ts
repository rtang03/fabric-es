import { Context } from 'fabric-contract-api';
import { ngacRepo } from './ngacRepo';
import { policyDecisionEngine } from './policyDecisionEngine';
import { Attribute, createResource, RESOURCE } from './types';

export const permissionCheck: (
  context: Context
) => Promise<any> = async context => {
  const { stub, clientIdentity } = context;
  const mspAttrs = await ngacRepo(context).getAttrByMSPID(
    clientIdentity.getMSPID()
  );
  const resourceAttrs: Attribute[] = [];
  const { fcn, params } = stub.getFunctionAndParameters();
  if (fcn === 'createCommit') {
    const [entityName, entityId, version, evenStr] = params;
    const entityAttrs = await ngacRepo(context).getAttrByEntityName(entityName);
    const commonName = clientIdentity.getX509Certificate().subject.commonName;
    const id = clientIdentity.getID();
    const mspid = clientIdentity.getMSPID();

    if (version === '0') {
      resourceAttrs.push({
        type: '1',
        key: RESOURCE.ENTITYNAME,
        value: entityName,
        immutable: true
      });
      resourceAttrs.push({
        type: '1',
        key: RESOURCE.VERSION,
        value: version
      });
      resourceAttrs.push({
        type: '1',
        key: RESOURCE.CREATOR_MSPID,
        value: mspid,
        immutable: true
      });
      resourceAttrs.push({
        type: '1',
        key: RESOURCE.CREATOR_CN,
        value: commonName,
        immutable: true
      });
      resourceAttrs.push({
        type: '1',
        key: RESOURCE.CREATOR_ID,
        value: id,
        immutable: true
      });
      const eventsJson: any[] = JSON.parse(evenStr);
      const policies = await ngacRepo(context).getPolicyById(id);
      return policyDecisionEngine(policies, context).request({
        eventTypes: eventsJson.map(({ type }) => type),
        target: createResource({
          context,
          entityName,
          entityId,
          resourceAttrs,
          mspAttrs,
          entityAttrs
        })
      });
      // save to new Attr to Resource DB in afterTransaction
    } else {
      // perform check
    }
  }

  // perform check for other fcn
  return true;
};
