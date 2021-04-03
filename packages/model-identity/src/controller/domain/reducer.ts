import type { Controller, ControllerEvents } from '../types';

export const controllerReducer: (controller: Controller, event: ControllerEvents) => Controller = (
  controller,
  event
) => {
  switch (event.type) {
    case 'ControllerCreated':
      return {
        id: event.payload.id,
        did: [event.payload.did],
      };
    case 'DidAdded':
      return {
        ...controller,
        did: [...controller.did, event.payload.did],
      };
    case 'DidRemoved':
      return { ...controller, did: controller.did.filter((item) => item !== event.payload.did) };
    default:
      return controller;
  }
};
