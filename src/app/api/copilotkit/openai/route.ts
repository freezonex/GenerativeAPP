import { CopilotBackend, OpenAIAdapter } from '@copilotkit/backend';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const copilotKit = new CopilotBackend();

  return copilotKit.response(req, new OpenAIAdapter({ model: 'gpt-4o' }));
}
