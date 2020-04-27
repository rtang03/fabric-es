import pick from 'lodash/pick';
import * as yup from 'yup';

export const getValidationSchema = (fields: string[]) =>
  pick(
    {
      username: yup
        .string()
        .required()
        .min(5),
      email: yup
        .string()
        .required()
        .email(),
      password: yup
        .string()
        .required()
        .trim()
        .min(8)
    },
    fields
  );
