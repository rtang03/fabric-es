import { IconButton } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import SearchIcon from '@material-ui/icons/Search';
import { Field } from 'formik';
import { TextField } from 'formik-material-ui';
import React, { Fragment } from 'react';
import { useStyles } from 'utils';

const SearchInputField: React.FC<{
  isSubmitting: boolean;
  autoFocus: boolean;
  placeholder: string;
  label: string;
  total: number;
}> = ({ autoFocus, label, placeholder, isSubmitting, total }) => {
  const classes = useStyles();

  return (
    <>
      <Grid item xs={12}>
        <Field
          className={classes.textField}
          label={label}
          size="small"
          component={TextField}
          name={'query'}
          placeholder={placeholder}
          variant="outlined"
          margin="normal"
          fullwidth="true"
          autoFocus={autoFocus}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton disabled={isSubmitting} type="submit">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12}>
        {total >= 0 ? <Typography variant="caption">Total: {total}</Typography> : <Fragment />}
      </Grid>
    </>
  );
};

export default SearchInputField;
