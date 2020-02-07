import concurrently from 'concurrently';
import { startGateway } from './start-gateway';

concurrently(['npm:service-*'])
  .then(
    value => {
      console.log('Success: ', value);
      return startGateway;
    },
    error => {
      console.error('Error to start federated services');
      console.error(error);
      process.exit();
    }
  )
  .then(async startGateway => await startGateway()).catch(error => {
    console.error('Error');
    process.exit();
});
