import { Checkbox, FormControlLabel } from '@material-ui/core';
import { FieldAttributes, useField } from 'formik';
import React from 'react';

export const MyCheckbox: React.FC<{ label: string } & FieldAttributes<{}>> = ({
  label,
  ...props
}) => {
  const [field] = useField<{}>(props);
  return <FormControlLabel {...field} control={<Checkbox />} label={label} />;
};
