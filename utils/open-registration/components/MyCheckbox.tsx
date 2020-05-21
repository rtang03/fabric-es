import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { FieldAttributes, useField } from 'formik';
import React from 'react';

export const MyCheckbox: React.FC<{
  label: string;
  labelPlacement: any;
} & FieldAttributes<{}>> = ({ label, labelPlacement, ...props }) => {
  const [field] = useField<{}>(props);
  return (
    <FormControlLabel
      {...field}
      control={<Checkbox />}
      label={label}
      labelPlacement={labelPlacement}
    />
  );
};
