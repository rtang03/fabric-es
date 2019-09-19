import '../env';
import { Context } from './types';
import { enrolCAAdmin, getClientForOrg } from './utils';
import { getFabricCAServices } from './utils/getFabricCAServices';

export const enrolUser: (
  enrollmentID: string,
  enrollmentSecret: string,
  url: string,
  orgName: string,
  context?: Context
) => Promise<string> = async (
  enrollmentID,
  enrollmentSecret,
  url,
  orgName,
  context = {
    connProfileNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    pathToNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const caAdmin = await getClientForOrg(
    context.connProfileNetwork,
    process.env.CONNECTION_ORG1_CA_ADMIN
  );
  await enrolCAAdmin(caAdmin, orgName, context);
  const registrar = await caAdmin.getUserContext(`${orgName}CAAdmin`, true);
  return getFabricCAServices(caAdmin, url, context).then(caService =>
    caService.register(
      {
        enrollmentID,
        enrollmentSecret,
        maxEnrollments: -1,
        affiliation: '',
        role: 'client'
      },
      registrar
    )
  );
};
