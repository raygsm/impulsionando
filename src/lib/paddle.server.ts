import { Environment, Paddle, EventName } from '@paddle/paddle-node-sdk';

const getEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export { EventName };
export type PaddleEnv = 'sandbox' | 'live';

function gatewayBaseUrl(): string {
  return getEnv('PADDLE_GATEWAY_BASE_URL').replace(/\/$/, '');
}

export function getConnectionApiKey(env: PaddleEnv): string {
  return env === 'sandbox' ? getEnv('PADDLE_SANDBOX_API_KEY') : getEnv('PADDLE_LIVE_API_KEY');
}

export function getPaddleClient(env: PaddleEnv): Paddle {
  const connectionApiKey = getConnectionApiKey(env);
  const gatewayApiKey = getEnv('PADDLE_GATEWAY_API_KEY');
  return new Paddle(connectionApiKey, {
    environment: gatewayBaseUrl() as unknown as Environment,
    customHeaders: {
      'X-Connection-Api-Key': connectionApiKey,
      'X-Gateway-Api-Key': gatewayApiKey,
    },
  });
}

export async function gatewayFetch(env: PaddleEnv, path: string, init?: RequestInit): Promise<Response> {
  const connectionApiKey = getConnectionApiKey(env);
  const gatewayApiKey = getEnv('PADDLE_GATEWAY_API_KEY');
  return fetch(`${gatewayBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Connection-Api-Key': connectionApiKey,
      'X-Gateway-Api-Key': gatewayApiKey,
      ...init?.headers,
    },
  });
}

export function getWebhookSecret(env: PaddleEnv): string {
  return env === 'sandbox' ? getEnv('PAYMENTS_SANDBOX_WEBHOOK_SECRET') : getEnv('PAYMENTS_LIVE_WEBHOOK_SECRET');
}

export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const signature = req.headers.get('paddle-signature');
  const body = await req.text();
  const secret = getWebhookSecret(env);
  if (!signature || !body) throw new Error('Missing signature or body');
  const paddle = getPaddleClient(env);
  return await paddle.webhooks.unmarshal(body, secret, signature);
}
