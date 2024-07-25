import { agentExecutor } from '@/ai/graph';
import { exposeEndpoints, streamRunnableUI } from '../../utils/server';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { generateComponent } from '../../utils/generateComponent';

const convertChatHistoryToMessages = (
  chat_history: [role: string, content: string][]
) => {
  return chat_history.map(([role, content]) => {
    switch (role) {
      case 'human':
        return new HumanMessage(content);
      case 'assistant':
      case 'ai':
        return new AIMessage(content);
      default:
        return new HumanMessage(content);
    }
  });
};

function processFile(input: {
  input: string;
  chat_history: [role: string, content: string][];
  file?: {
    base64: string;
    extension: string;
  };
}) {
  if (input.file) {
    const imageTemplate = new HumanMessage({
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:image/${input.file.extension};base64,${input.file.base64}`,
          },
        },
      ],
    });
    return {
      input: input.input,
      chat_history: [
        ...convertChatHistoryToMessages(input.chat_history),
        imageTemplate,
      ],
    };
  } else {
    return {
      input: input.input,
      chat_history: convertChatHistoryToMessages(input.chat_history),
    };
  }
}

async function agent(inputs: {
  input: string;
  chat_history: [role: string, content: string][];
  file?: {
    base64: string;
    extension: string;
  };
}) {
  'use server';
  const processedInputs = processFile(inputs);
  const executor = agentExecutor();
  const resultState = await executor.invoke(processedInputs);
  console.log('Result state:', resultState);
  if (resultState.componentContent) {
    generateComponent(
      resultState.componentDesign.name,
      resultState.componentContent
    );
    return {
      type: 'component',
      name: resultState.componentDesign.name,
      code: resultState.componentContent,
    };
  }
  if (resultState.result) {
    return resultState.result;
  } else {
    throw new Error('No result found in agentExecutor state.');
  }
}

export const EndpointsContext = exposeEndpoints({ agent });
