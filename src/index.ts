/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { info, install, ok, onTelegramUpdate } from './routes';
import { getBotEndpoint } from './utils/env';

type Handler = (req: Request, env: Env) => Promise<Response>;

const buildMapping = (env: Env): Record<string, Handler> => ({
  '/install': install,
  '/': ok,
  '/info': info,
  [getBotEndpoint(env)]: onTelegramUpdate,
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    ctx.passThroughOnException();
    const mapping = buildMapping(env);
    const { pathname } = new URL(request.url);
    const handler = mapping[pathname];
    if (!handler) {
      return new Response(null, { status: 404 });
    }
    return handler(request, env);
  },
};

export { ThreadDurableObject } from './durable-objects/thread.do';
