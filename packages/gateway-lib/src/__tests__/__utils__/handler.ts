import { CounterCommandHandler, CounterRepo } from './types';

export const commandHanlder: (option: {
  enrollmentId: string;
  counterRepo: CounterRepo;
}) => CounterCommandHandler = ({ enrollmentId, counterRepo }) => ({
  Increment: async ({ userId, payload: { id } }) =>
    counterRepo
      .create({ enrollmentId, id })
      .save({
        events: [
          {
            type: 'Increment',
            payload: {
              id,
            },
          },
        ],
      })
      .then(({ data }) => data),
  Decrement: async ({ userId, payload: { id } }) =>
    counterRepo
      .create({ enrollmentId, id })
      .save({
        events: [
          {
            type: 'Decrement',
            payload: {
              id,
            },
          },
        ],
      })
      .then(({ data }) => data),
});
