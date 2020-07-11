import MuiTextField from '@material-ui/core/TextField';
import { fieldToTextField, TextFieldProps } from 'formik-material-ui';
import React from 'react';

const LowerCasTextField = (props: TextFieldProps) => {
  const {
    form: { setFieldValue },
    field: { name },
  } = props;
  const onChange = React.useCallback(
    (event) => {
      const { value } = event.target;
      setFieldValue(
        name,
        value
          ? value
              .toLowerCase()
              .replace(/-/g, '_')
              .replace(/:/g, '_')
              .replace(/;/g, '_')
              .replace(/&/g, '_')
              .replace(/#/g, '_')
              .replace(/!/g, '_')
              .replace(/\s/g, '_')
              .replace(/\*/g, '_')
              .replace(/@/g, '_')
              .replace(/%/g, '_')
              .replace(/</g, '_')
              .replace(/>/g, '_')
              .replace(/\?/g, '_')
              .replace(/'/g, '_')
              .replace(/"/g, '_')
              .replace(/`/g, '_')
              .replace(/\[/g, '_')
              .replace(/]/g, '_')
              .replace(/{/g, '_')
              .replace(/}/g, '_')
              .replace(/\+/g, '_')
              .replace(/=/g, '_')
              .replace(/\(/g, '_')
              .replace(/\)/g, '_')
          : ''
      );
    },
    [setFieldValue, name]
  );
  return <MuiTextField {...fieldToTextField(props)} onChange={onChange} />;
};

export default LowerCasTextField;
