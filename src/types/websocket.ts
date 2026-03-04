/**
 * WebSocket real-time price streaming types.
 * Maps to backend PriceTick / WSServerMessage models.
 */

export type InstrumentCategory = 'forex' | 'commodity' | 'nse';

export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface IRealtimePrice {
  symbol: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  category: InstrumentCategory;
  ts: string;
}

export type WSMessageType = 'price' | 'snapshot' | 'pong' | 'error';

export interface IWSServerMessage {
  type: WSMessageType;
  data: IRealtimePrice | IRealtimePrice[] | string | null;
  ts: string | null;
}

export type WSAction = 'subscribe' | 'unsubscribe' | 'ping';

export interface IWSClientMessage {
  action: WSAction;
  types?: InstrumentCategory[];
}
