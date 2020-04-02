import { Channel, EventListener, EventService, Eventer, Utils } from 'fabric-common';

export const getEventService: (option: {
  name: string;
  channel: Channel;
  onChannelEventArrived;
}) => {
  getService: () => EventService;
  send: () => any;
  register: () => void;
  unregister: () => void;
} = ({ name, channel, onChannelEventArrived }) => {
  Utils.getLogger('[fabric-cqrs] eventService.js');

  const service: EventService = channel.newEventService(name);
  let listener: EventListener;


  return {
    getService: () => service,
    send: async () => {
      // service.setTargets([{}]);
      // await service.send({} );
    },
    register: () => {
      listener = service.registerChaincodeListener(
        'eventstore',
        (error, event) => {
          console.log('--------------');
          console.log(event);
          const ccEvent = event.chaincodeEvents[0].payload.toString('utf8');
          console.log(ccEvent);
        },
        { unregister: false }
      );
    },
    unregister: () => listener.unregisterEventListener()
  };
};
