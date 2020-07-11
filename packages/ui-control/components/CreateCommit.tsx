import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import Switch from '@material-ui/core/Switch';
import MuiTextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import UpIcon from '@material-ui/icons/ChangeHistory';
import DownIcon from '@material-ui/icons/Details';
import LaunchIcon from '@material-ui/icons/Launch';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { Field, Form, Formik } from 'formik';
import { AutocompleteRenderInputParams, ToggleButtonGroup } from 'formik-material-ui-lab';
import { useGetWalletQuery } from 'graphql/generated/gateway';
import { useCreateCommitMutation, useGetEntityInfoQuery } from 'graphql/generated/queryHandler';
import flatten from 'lodash/flatten';
import Router from 'next/router';
import React, { useState, ChangeEvent, Fragment } from 'react';
import { lowerCasing, useStyles } from 'utils';
import { useDispatchAlert } from './AlertProvider';
import LowerCaseTextField from './lowerCaseTextField';

const options = { context: { backend: 'gateway' } };
const ERROR = 'Fail to create commit';

const CreateCommit: React.FC<any> = () => {
  const { data: wallet } = useGetWalletQuery({
    ...options,
    fetchPolicy: 'cache-and-network',
  });
  const dispatchAlert = useDispatchAlert();
  const [autoId, setAutoId] = useState<boolean>(false);
  const handleChange = (setFieldValue: Function) => ({ target }: ChangeEvent<HTMLInputElement>) => {
    setAutoId(target.checked);
    target.checked && setFieldValue('id', `counter${Math.floor(Math.random() * 10000)}`);
  };
  const classes = useStyles();
  const [create, { loading }] = useCreateCommitMutation({
    context: { backend: 'queryHandler' },
  });
  const { data: info } = useGetEntityInfoQuery({
    context: { backend: 'queryHandler' },
    fetchPolicy: 'cache-only',
  });

  const tags = flatten(info?.getEntityInfo.map(({ tagged }) => tagged)).map((tag) => ({ tag }));
  tags.push({ tag: 'demo' });

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Divider />
          <Typography variant="h6">Counter Example</Typography>
          <Typography variant="caption" color="primary">
            For demo purpose only
          </Typography>
          <p>
            {!wallet?.getWallet ? (
              <>
                <Typography variant="caption" color="secondary">
                  No digital wallet found; please create one.
                </Typography>
                <IconButton onClick={() => Router.push('/control/profile')}>
                  <LaunchIcon />
                </IconButton>
              </>
            ) : (
              <Fragment />
            )}
          </p>
          <Formik
            initialValues={{ entityName: 'counter', id: '', tag: ['demo'], counter: 'Increment' }}
            onSubmit={async ({ entityName, id, counter, tag }, { setSubmitting }) => {
              setSubmitting(true);
              const tagString = tag.reduce((prev, curr) => (!!prev ? `${prev},${curr}` : curr), '');
              try {
                const { data } = await create({
                  variables: {
                    entityName,
                    id,
                    type: counter,
                    payloadString: `{"id":"${id}","desc":"no desc","tag":"${tagString}"}`,
                  },
                });
                setTimeout(() => {
                  setSubmitting(false);
                  setAutoId(false);
                  dispatchAlert({
                    type: 'SUCCESS',
                    message: `${data?.createCommit.commitId} created`,
                  });
                }, 500);
              } catch (e) {
                setTimeout(() => {
                  console.error(e);
                  setAutoId(false);
                  setSubmitting(false);
                  dispatchAlert({ type: 'ERROR', message: ERROR });
                }, 500);
              }
            }}>
            {({ values, isSubmitting, submitForm, touched, errors, setFieldValue }) => (
              <Form className={classes.form}>
                <Box margin={2}>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={autoId}
                          onChange={handleChange(setFieldValue)}
                          value="editMode"
                          color={autoId ? 'primary' : 'secondary'}
                        />
                      }
                      label={
                        autoId ? (
                          <Typography variant="caption" color="primary">
                            auto
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="secondary">
                            manual
                          </Typography>
                        )
                      }
                    />
                  </FormGroup>
                  <Field
                    size="small"
                    label="id"
                    component={LowerCaseTextField}
                    name="id"
                    placeholder="id"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    disabled={autoId || !wallet?.getWallet}
                    autoFocus
                  />
                </Box>
                <Box margin={2}>
                  <Field
                    multiple
                    freeSolo
                    selectOnFocus
                    handleHomeEndKeys
                    disabled={!wallet?.getWallet}
                    component={Autocomplete}
                    size="small"
                    options={tags.map((option: any) => option.tag)}
                    style={{ width: 500 }}
                    defaultValue={['demo']}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                      <MuiTextField
                        {...params}
                        error={touched.tag && !!errors.tag}
                        helperText={touched.tag && errors.tag}
                        label="tag"
                        variant="outlined"
                      />
                    )}
                    renderTags={(val: string[], getTagProps: any) =>
                      val.map((option: string, index: number) => (
                        <Chip
                          variant="outlined"
                          size="small"
                          label={lowerCasing(option)}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    onChange={(_: ChangeEvent<HTMLInputElement>, val: string[]) =>
                      setFieldValue('tag', val)
                    }
                  />
                </Box>
                <Box margin={2}>
                  <Typography variant="caption" color="primary">
                    Counter Events
                  </Typography>
                </Box>
                <Box margin={2}>
                  <Field exclusive component={ToggleButtonGroup} name="counter" type="checkbox">
                    <ToggleButton value="Increment" aria-label="increment">
                      <UpIcon />{' '}
                      <Typography variant="caption" color="inherit">
                        Increment
                      </Typography>
                    </ToggleButton>
                    <ToggleButton value="Decrement" aria-label="decrement">
                      <DownIcon />{' '}
                      <Typography variant="caption" color="inherit">
                        Decrement
                      </Typography>
                    </ToggleButton>
                  </Field>
                </Box>
                <Box margin={3}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={!wallet?.getWallet || isSubmitting || !values.counter || !values.id}
                    onClick={submitForm}>
                    Submit
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </>
      )}
    </>
  );
};

export default CreateCommit;
