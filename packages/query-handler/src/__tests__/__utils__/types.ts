export interface CounterCommands {
  Increment: {
    userId: string;
    payload: {
      counterId: string;
      timestamp: number;
    };
  };
  Decrement: {
    userId: string;
    payload: {
      counterId: string;
      timestamp: number;
    };
  };
}

export interface CounterEvent {
  type: string;
  payload: any;
}

export interface Counter {
  value: number;
}

