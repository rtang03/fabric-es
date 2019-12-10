import TextField from '@material-ui/core/TextField';
import { FieldAttributes, useField } from 'formik';
import React from 'react';

export const MyTextField: React.FC<FieldAttributes<any>> = ({
  placeholder,
  disabled = false,
  ...props
}) => {
  const [field, meta] = useField<{}>(props);
  const errorText = meta.error && meta.touched ? meta.error : '';
  return (
    <TextField
      placeholder={placeholder}
      disabled={disabled}
      {...field}
      helperText={errorText}
      error={!!errorText}
    />
  );
};
