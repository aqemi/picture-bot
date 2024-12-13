import { ChatCompletionResponse } from '@mistralai/mistralai/models/components';
import { env } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { config } from './config';
import { MistraleAgent } from './mistrale-agent';

describe('MistraleAgent', () => {
  let agent: MistraleAgent;
  let spy: MockInstance;

  beforeEach(() => {
    agent = new MistraleAgent(env);
    spy = vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ text: 'valid' }),
          },
        },
      ],
    } as ChatCompletionResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valid response (text and sticker)', async () => {
    const aiResponse = JSON.stringify({ text: 'text', sticker: 'sticker' });
    vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: aiResponse,
          },
        },
      ],
    } as ChatCompletionResponse);
    const response = await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(response.valid).toEqual(true);
    expect(response.raw).toEqual(aiResponse);
    expect(response.text).toEqual('text');
    expect(response.sticker).toEqual('sticker');
  });

  it('should return valid response (text)', async () => {
    const aiResponse = JSON.stringify({ text: 'text' });
    vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: aiResponse,
          },
        },
      ],
    } as ChatCompletionResponse);
    const response = await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(response.valid).toEqual(true);
    expect(response.raw).toEqual(aiResponse);
    expect(response.text).toEqual('text');
  });
  it('should return valid response (sticker)', async () => {
    const aiResponse = JSON.stringify({ sticker: 'sticker' });
    vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: aiResponse,
          },
        },
      ],
    } as ChatCompletionResponse);
    const response = await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(response.valid).toEqual(true);
    expect(response.raw).toEqual(aiResponse);
    expect(response.sticker).toEqual('sticker');
  });
  it('should return invalid response', async () => {
    const aiResponse = 'malformed';
    vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: aiResponse,
          },
        },
      ],
    } as ChatCompletionResponse);
    const response = await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(response.valid).toEqual(false);
    expect(response.raw).toEqual('malformed');
  });
  it('should return invalid response (text wrong type)', async () => {
    const aiResponse = JSON.stringify({ text: ['test'] });
    vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: aiResponse,
          },
        },
      ],
    } as ChatCompletionResponse);
    const response = await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(response.valid).toEqual(false);
    expect(response.raw).toEqual('{"text":["test"]}');
  });
  it('should return invalid response (sticker wrong type)', async () => {
    const aiResponse = JSON.stringify({ text: 'valid', sticker: null });
    vi.spyOn(agent['client']['agents'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: aiResponse,
          },
        },
      ],
    } as ChatCompletionResponse);
    const response = await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(response.valid).toEqual(false);
    expect(response.raw).toEqual('{"text":"valid","sticker":null}');
  });

  it('should format user input', async () => {
    await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          {
            content: '[USERNAME]test[/USERNAME]: test',
            role: 'user',
          },
        ]),
      }),
    );
  });

  it('should pass static prompt', async () => {
    await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining(config.demo.aggressive),
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining(config.demo.basic),
      }),
    );
  });

  it('should pass dynamic prompt', async () => {
    await env.DB.prepare('INSERT INTO prompts (role, content) VALUES (?,?)').bind('system', 'test').run();
    await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([{ role: 'system', content: 'test' }]),
      }),
    );
  });

  it('should pass previous replies', async () => {
    await env.DB.prepare('INSERT INTO threads (chatId, role, content) VALUES (?,?,?)')
      .bind(0, 'assistant', 'test')
      .run();
    await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([{ role: 'assistant', content: 'test' }]),
      }),
    );
  });

  it('should not pass previous replies from other chat', async () => {
    await env.DB.prepare('INSERT INTO threads (chatId, role, content) VALUES (?,?,?)')
      .bind(1, 'assistant', 'other')
      .run();
    await agent.completion({ query: 'test', chatId: 0, username: 'test' });
    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([{ role: 'assistant', content: 'other' }]),
      }),
    );
  });

  it('store thread', async () => {
    await agent.completion({ query: 'test', chatId: 0, username: 'test' });

    const { results } = await env.DB.prepare('SELECT * FROM threads WHERE chatId = ?').bind(0).all();
    console.log('🚀 ~ it ~ results:', results);
    expect(results).toHaveLength(2);
    expect(results).toContainEqual({
      chatId: 0,
      role: 'user',
      content: '[USERNAME]test[/USERNAME]: test',
      createdAt: expect.any(String),
    });
    expect(results).toContainEqual({
      chatId: 0,
      role: 'assistant',
      content: '{"text":"valid"}',
      createdAt: expect.any(String),
    });
  });
});
