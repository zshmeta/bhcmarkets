import { z } from 'zod';

export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('subscribe'), symbols: z.array(z.string()) }),
  z.object({ type: z.literal('unsubscribe'), symbols: z.array(z.string()) }),
  z.object({ type: z.literal('ping') }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type PongMessage = {
  type: 'pong';
  timestamp: number;
};

export type SubscribedMessage = {
  type: 'subscribed';
  symbols: string[];
};

export type UnsubscribedMessage = {
  type: 'unsubscribed';
  symbols: string[];
};

export type ErrorMessage = {
  type: 'error';
  code: string;
  message: string;
};

export type SnapshotMessage = {
  type: 'snapshot';
  data: any;
};

export type ConnectedMessage = {
  type: 'connected';
  message: string;
};

export type ServerMessage =
  | PongMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | ErrorMessage
  | SnapshotMessage
  | ConnectedMessage
  | { type: 'update'; data: any }
  | { type: 'tick'; data: any };
