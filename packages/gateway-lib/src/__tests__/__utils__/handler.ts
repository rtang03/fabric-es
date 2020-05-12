import { CounterCommandHandler, CounterRepo } from './types';

export const commandHanlder: (option: { enrollmentId: string; counterRepo: CounterRepo }) => CounterCommandHandler = ({
  enrollmentId,
  counterRepo
}) => ({
  Increment: async ({ userId, payload: { counterId, timestamp } }) =>
    counterRepo.create({ enrollmentId, id: counterId }).save([
      {
        type: 'Increment',
        payload: {
          counterId,
          timestamp
        }
      }
    ]),
  Decrement: async ({ userId, payload: { counterId, timestamp } }) =>
    counterRepo.create({ enrollmentId, id: counterId }).save([
      {
        type: 'Decrement',
        payload: {
          counterId,
          timestamp
        }
      }
    ])
});
