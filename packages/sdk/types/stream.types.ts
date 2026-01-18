/**
 * Stream Types
 * ============
 *
 * Types for the WebSocket streaming layer.
 */

import { z } from 'zod';

/**
 * Zod schema for validating incoming client messages.
 * Provides runtime type safety for WebSocket messages.
 */
export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribe'),
    symbols: z.array(z.string().min(1)).min(1).max(100),
    timestamp: z.number().optional(),
  }),
  z.object({
    type: z.literal('unsubscribe'),
    symbols: z.array(z.string().min(1)).min(1),
    timestamp: z.number().optional(),
  }),
  z.object({
    type: z.literal('ping'),
    timestamp: z.number().optional(),
  }),
]);

/**
 * Client subscription state.
 */
export interface ClientSubscription {
  /** Client's unique connection ID */
  clientId: string;

  /** Symbols this client is subscribed to */
  symbols: Set<string>;

  /** When the client connected */
  connectedAt: number;

  /** Last activity timestamp */
  lastActiveAt: number;
}

/**
 * Message types for client-server communication.
 */
export type ClientMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'ping';

export type ServerMessageType =
  | 'tick'
  | 'snapshot'
  | 'subscribed'
  | 'unsubscribed'
  | 'error'
  | 'pong';

/**
 * Base message structure.
 */
interface BaseMessage {
  type: string;
  timestamp: number;
}

/**
 * Client -> Server messages.
 */
export interface SubscribeMessage extends BaseMessage {
  type: 'subscribe';
  symbols: string[];
}

export interface UnsubscribeMessage extends BaseMessage {
  type: 'unsubscribe';
  symbols: string[];
}

export interface PingMessage extends BaseMessage {
  type: 'ping';
}

export type ClientMessage = SubscribeMessage | UnsubscribeMessage | PingMessage;

/**
 * Server -> Client messages.
 */
export interface TickMessage extends BaseMessage {
  type: 'tick';
  data: {
    symbol: string;
    last: number;
    bid?: number;
    ask?: number;
    changePercent?: number;
    volume?: number;
  };
}

export interface SnapshotMessage extends BaseMessage {
  type: 'snapshot';
  data: Record<string, {
    symbol: string;
    last: number;
    bid?: number;
    ask?: number;
    changePercent?: number;
  }>;
}

export interface SubscribedMessage extends BaseMessage {
  type: 'subscribed';
  symbols: string[];
}

export interface UnsubscribedMessage extends BaseMessage {
  type: 'unsubscribed';
  symbols: string[];
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  code: string;
  message: string;
}

export interface PongMessage extends BaseMessage {
  type: 'pong';
}

export type ServerMessage =
  | TickMessage
  | SnapshotMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | ErrorMessage
  | PongMessage;
