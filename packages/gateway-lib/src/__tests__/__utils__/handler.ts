import { CounterCommandHandler, CounterRepo } from './types';

export const commandHanlder: (option: {
  enrollmentId: string;
  counterRepo: CounterRepo;
}) => CounterCommandHandler = ({ enrollmentId, counterRepo }) => ({
  Increment: async ({ userId, payload: { id } }) => {
    const { data, error } = await counterRepo.create({ enrollmentId, id }).save({
      events: [
        {
          type: 'Increment',
          payload: {
            id,
          },
        },
      ],
    });

    if (error) throw error;

    return data;
  },
  Decrement: async ({ userId, payload: { id } }) => {
    const { data, error } = await counterRepo.create({ enrollmentId, id }).save({
      events: [
        {
          type: 'Decrement',
          payload: {
            id,
          },
        },
      ],
    });
    if (error) throw error;

    return data;
  },
});
