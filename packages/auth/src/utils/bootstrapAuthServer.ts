import util from 'util';
import bcrypt from 'bcrypt';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { getLogger } from './getLogger';

const logger = getLogger({ name: '[auth] bootstrapAuthServer.js' });

export const bootstrapAuthServer: (option: {
  orgAdminId: string;
  orgAdminSecret: string;
  orgAdminEmail: string;
  applicationName: string;
  clientSecret: string;
}) => any = async ({ orgAdminId, orgAdminSecret, orgAdminEmail, applicationName, clientSecret }) => {
  const orgAdminExist = await User.findOne({ where: { username: orgAdminId } });
  let newOrgAdmin: User;

  if (orgAdminExist) {
    logger.info(`org admin already exists: ${orgAdminExist.id}`);
  } else {
    const hashPassword = await bcrypt.hash(orgAdminSecret, 10);
    newOrgAdmin = User.create({ username: orgAdminId, password: hashPassword, email: orgAdminEmail, is_admin: true });
    await User.insert(newOrgAdmin);
    logger.info(`org admin ${newOrgAdmin.id} is created`);
  }

  const rootClientExist = await Client.findOne({ where: { application_name: applicationName } });

  if (rootClientExist) {
    logger.info(`root_client already exists: ${rootClientExist.id}`);
  } else {
    const client = Client.create({
      application_name: 'root_client',
      client_secret: clientSecret,
      user_id: orgAdminExist?.id || newOrgAdmin.id,
      is_system_app: true,
      redirect_uris: [],
      grants: ['password', 'authorization_code', 'refresh_token', 'client_credentials', 'implicit']
    });
    await Client.insert(client);
    logger.info(`${applicationName} ${client.id} is created`);
  }
};
