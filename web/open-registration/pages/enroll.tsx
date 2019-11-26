import Typography from '@material-ui/core/Typography';
import { Form } from 'formik';
import React from 'react';
import DisplayErrorMessage from '../components/DisplayErrorMessage';
import Layout from '../components/Layout';
import { useGetPublicClientsQuery } from '../generated/graphql';

const Enroll: React.FC<any> = () => {
  const { data, error, loading } = useGetPublicClientsQuery();
  const body = loading ? null : data?.getPublicClients ? (
    <React.Fragment>
      <pre>{JSON.stringify(data.getPublicClients, null, 2)}</pre>
      <p>No of available hosts: {data.getPublicClients.length}</p>
    </React.Fragment>
  ) : null;

  return (
    <Layout title="Account | Enroll">
      <div>
        <Typography component="h1" variant="h5">
          Available Hosts for User Enrollment
        </Typography>
      </div>
      {body}
      <DisplayErrorMessage error={error} />
      <hr />
    </Layout>
  );
};

export default Enroll;
