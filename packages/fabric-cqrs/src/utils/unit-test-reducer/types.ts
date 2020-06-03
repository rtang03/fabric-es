export interface CounterCommands {
  Increment: {
    userId: string;
    payload: {
      id: string;
      desc: string;
      tag: string;
    };
  };
  Decrement: {
    userId: string;
    payload: {
      id: string;
      desc: string;
      tag: string;
    };
  };
}

export interface CounterEvent {
  type: string;
  payload: any;
}

export interface Counter {
  id: string;
  desc: string;
  tag: string;
  value: number;
  ts: number;
}

