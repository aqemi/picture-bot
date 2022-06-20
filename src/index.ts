/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { install } from './routes/install';
import { bot } from './routes/bot';
import { botEndpoint } from './utils/bot-endpoint';
import { Env } from './env';

type Handler = (req: Request, env: Env) => Promise<Response>;

const buildMapping = (env: Env): Record<string, Handler> => ({
  '/install': install,
  [botEndpoint(env.TG_TOKEN)]: bot,
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
