import { Context } from 'fabric-contract-api';
import { ngacRepo } from './ngacRepo';
import { Assertion, policyDecisionEngine } from './policyDecisionEngine';
import { Attribute, createResource, NAMESPACE, RESOURCE } from './types';

enum FCN {
  CREATE_COMMIT = 'createCommit'
}

export const permissionCheck: (
  context: Context
) => Promise<Assertion[]> = async context => {
  const { stub, clientIdentity } = context;
  const { fcn, params } = stub.getFunctionAndParameters();
  const getAttr = (key, value, immutable = true) => ({
    type: '1' as any,
    key,
    value,
    immutable
  });
  const mspAttrs = await ngacRepo(context).getAttrByMSPID(
    clientIdentity.getMSPID()
  );
  let resourceAttrs: Attribute[] = [];
  const id = clientIdentity.getID();
  const cn = clientIdentity.getX509Certificate().subject.commonName;
  const mspid = clientIdentity.getMSPID();
  const assertions: Record<string, () => Promise<Assertion[]>> = {
    [FCN.CREATE_COMMIT]: async (): Promise<Assertion[]> => {
      const [entityName, entityId, version, evenStr] = params;
      if (version === '0') {
        resourceAttrs.push(getAttr(RESOURCE.ENTITYNAME, entityName));
        resourceAttrs.push(getAttr(RESOURCE.VERSION, version, false));
        resourceAttrs.push(getAttr(RESOURCE.CREATOR_MSPID, mspid));
        resourceAttrs.push(getAttr(RESOURCE.CREATOR_CN, cn));
        resourceAttrs.push(getAttr(RESOURCE.CREATOR_ID, id));
      } else {
        const uri = `${NAMESPACE.MODEL}/${mspid}/${entityName}/${entityId}`;
        resourceAttrs = await ngacRepo(context).getResourceAttrByKey(uri);
      }
      const eventsJson: any[] = JSON.parse(evenStr);
      const policies = await ngacRepo(context).getPolicyById(id);
      return policyDecisionEngine(policies, context).request({
        eventTypes: eventsJson.map(({ type }) => type),
        target: createResource({
          context,
          entityName,
          entityId,
          resourceAttrs,
          mspAttrs
        })
      });
    }
  };

  return assertions[fcn]();
};
