import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import LinearProgress from '@material-ui/core/LinearProgress';
import Switch from '@material-ui/core/Switch';
import MuiTextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import UpIcon from '@material-ui/icons/ChangeHistory';
import DownIcon from '@material-ui/icons/Details';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { AutocompleteRenderInputParams, ToggleButtonGroup } from 'formik-material-ui-lab';
import { useCreateCommitMutation, useGetEntityInfoQuery } from 'graphql/generated/queryHandler';
import flatten from 'lodash/flatten';
import React, { useState, ChangeEvent, Fragment } from 'react';
import { useStyles } from 'utils';
import LowerCasTextField from './lowerCaseTextField';

const CreateCommit: React.FC<any> = () => {
  const [autoId, setAutoId] = useState<boolean>(false);
  const handleChange = (setFieldValue: Function) => ({ target }: ChangeEvent<HTMLInputElement>) => {
    setAutoId(target.checked);
    target.checked && setFieldValue('id', `counter${Math.floor(Math.random() * 10000)}`);
  };
  const classes = useStyles();
  const [create, { data, loading, error }] = useCreateCommitMutation({
    context: { backend: 'queryHandler' },
  });
  const { data: info, error: entitiesError } = useGetEntityInfoQuery({
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
          <Typography variant="caption" color="secondary">
            For demo purpose only
          </Typography>
          {entitiesError ? <pre>{JSON.stringify(entitiesError, null, 2)}</pre> : <Fragment />}
          <Formik
            initialValues={{ entityName: 'counter', id: '', tag: ['demo'], counter: 'increment' }}
            onSubmit={async (values, { setSubmitting }) => {
              setTimeout(() => {
                setSubmitting(false);
                alert(JSON.stringify(values, null, 2));
              }, 500);
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
                    component={LowerCasTextField}
                    name="id"
                    placeholder="id"
                    variant="outlined"
                    margin="normal"
                    fullwidth="true"
                    disabled={autoId}
                    autoFocus
                  />
                </Box>
                <Box margin={2}>
                  <Field
                    multiple
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
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
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
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
                    <ToggleButton value="increment" aria-label="increment">
                      <UpIcon />
                      Increment
                    </ToggleButton>
                    <ToggleButton value="decrement" aria-label="decrement">
                      <DownIcon />
                      Decrement
                    </ToggleButton>
                  </Field>
                </Box>
                <Box margin={3}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting || !values.counter || !values.id}
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
