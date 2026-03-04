/**
 * WebSocket client for real-time price streaming.
 *
 * Handles:
 * - Fetching a short-lived WS token via /api/auth/ws-token
 * - Connecting to /ws/prices?token=...
 * - Auto-reconnect with exponential backoff
 * - Ping/pong keepalive
 */

import type {
  InstrumentCategory,
  IRealtimePrice,
  IWSServerMessage,
  WSConnectionState,
} from '@/types/websocket';

type PriceCallback = (price: IRealtimePrice) => void;
type StateCallback = (state: WSConnectionState) => void;

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const PING_INTERVAL_MS = 25000;

export class PriceWSClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private backoff = INITIAL_BACKOFF_MS;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private subscribedTypes: InstrumentCategory[] = [];

  private onPrice: PriceCallback | null = null;
  private onStateChange: StateCallback | null = null;

  private _state: WSConnectionState = 'disconnected';

  get state(): WSConnectionState {
    return this._state;
  }

  private setState(s: WSConnectionState): void {
    this._state = s;
    this.onStateChange?.(s);
  }

  /** Register callbacks. */
  listen(onPrice: PriceCallback, onState: StateCallback): void {
    this.onPrice = onPrice;
    this.onStateChange = onState;
  }

  /** Connect and subscribe to the given instrument categories. */
  async connect(types: InstrumentCategory[]): Promise<void> {
    this.subscribedTypes = types;
    this.intentionalClose = false;
    await this._connect();
  }

  /** Gracefully disconnect. */
  disconnect(): void {
    this.intentionalClose = true;
    this._cleanup();
    this.setState('disconnected');
  }

  /** Update subscription on an active connection. */
  subscribe(types: InstrumentCategory[]): void {
    this.subscribedTypes = types;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', types }));
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async _connect(): Promise<void> {
    this.setState('connecting');

    // Fetch a short-lived WS token
    try {
      const res = await fetch('/api/auth/ws-token', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn('WS token fetch failed', res.status);
        this.setState('error');
        this._scheduleReconnect();
        return;
      }
      const data = await res.json();
      this.token = data.token;
    } catch (err) {
      console.warn('WS token fetch error', err);
      this.setState('error');
      this._scheduleReconnect();
      return;
    }

    // Build WS URL — always relative so Next.js proxy handles it
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws/prices?token=${this.token}`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.setState('error');
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.backoff = INITIAL_BACKOFF_MS;
      this.setState('connected');
      // Subscribe to desired types
      if (this.subscribedTypes.length > 0) {
        this.ws?.send(
          JSON.stringify({ action: 'subscribe', types: this.subscribedTypes }),
        );
      }
      this._startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: IWSServerMessage = JSON.parse(event.data);

        if (msg.type === 'price' && msg.data && typeof msg.data === 'object' && !Array.isArray(msg.data)) {
          this.onPrice?.(msg.data as IRealtimePrice);
        } else if (msg.type === 'snapshot' && Array.isArray(msg.data)) {
          for (const tick of msg.data as IRealtimePrice[]) {
            this.onPrice?.(tick);
          }
        }
        // pong / error — no action needed
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this._stopPing();
      if (!this.intentionalClose) {
        this.setState('disconnected');
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will also fire, which handles reconnect
    };
  }

  private _scheduleReconnect(): void {
    if (this.intentionalClose) return;
    this.reconnectTimer = setTimeout(() => {
      this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
      this._connect();
    }, this.backoff);
  }

  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  }

  private _stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private _cleanup(): void {
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
