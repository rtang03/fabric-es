import { CounterCommandHandler, CounterRepo } from './types';

export const commandHanlder: (option: {
  enrollmentId: string;
  counterRepo: CounterRepo;
}) => CounterCommandHandler = ({ enrollmentId, counterRepo }) => ({
  Increment: async ({ userId, payload: { counterId, timestamp } }) =>
    counterRepo.create({ enrollmentId, id: counterId }).save({
      events: [
        {
          type: 'Increment',
          payload: {
            counterId,
            timestamp,
          },
        },
      ],
    }),
  Decrement: async ({ userId, payload: { counterId, timestamp } }) =>
    counterRepo.create({ enrollmentId, id: counterId }).save({
      events: [
        {
          type: 'Decrement',
          payload: {
            counterId,
            timestamp,
          },
        },
      ],
    }),
});
