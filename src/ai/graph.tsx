// import { BaseMessage } from '@langchain/core/messages';
// import { RunnableConfig } from '@langchain/core/runnables';
// import { StateGraph, START, END } from '@langchain/langgraph';
// import {
//   ChatPromptTemplate,
//   MessagesPlaceholder,
// } from '@langchain/core/prompts';
// // import { githubTool, invoiceTool, weatherTool, websiteDataTool } from './tools';
// import { ChatOpenAI } from '@langchain/openai';

// interface AgentExecutorState {
//   input: string;
//   chat_history: BaseMessage[];
//   /**
//    * The plain text result of the LLM if
//    * no tool was used.
//    */
//   result?: string;
//   /**
//    * The parsed tool result that was called.
//    */
//   toolCall?: {
//     name: string;
//     parameters: Record<string, any>;
//   };
//   /**
//    * The result of a tool.
//    */
//   toolResult?: Record<string, any>;
// }

// const invokeModel = async (
//   state: AgentExecutorState,
//   config?: RunnableConfig
// ): Promise<Partial<AgentExecutorState>> => {
//   const initialPrompt = ChatPromptTemplate.fromMessages([
//     [
//       'system',
//       `generate react a react app, all codes are wrapped in the same component APP, only react code is allowed.
//      Do not include the import and export lines and also do not include the ReactDOM.render.
//      Make sure the UI is beautiful and responsive. Please refer to the shadcn components styles.
//      Very important: Return me only the code, do not chat with me ! do not say anything else !`,
//     ],

//     ['human', '{input}'],
//   ]);
//   //   const tools = [githubTool, invoiceTool, weatherTool, websiteDataTool];

//   const llm = new ChatOpenAI({
//     temperature: 0,
//     model: 'gpt-4o',
//     streaming: true,
//   });
//   const chain = initialPrompt.pipe(llm);
//   const result = await chain.invoke(
//     {
//       input: state.input,
//       chat_history: state.chat_history,
//     },
//     config
//   );

//   return {
//     result: result.content as string,
//   };
// };

// // const invokeToolsOrReturn = (state: AgentExecutorState) => {
// //   if (state.toolCall) {
// //     return 'invokeTools';
// //   }
// //   if (state.result) {
// //     return END;
// //   }
// //   throw new Error('No tool call or result found.');
// // };

// // const invokeTools = async (
// //   state: AgentExecutorState,
// //   config?: RunnableConfig
// // ): Promise<Partial<AgentExecutorState>> => {
// //   if (!state.toolCall) {
// //     throw new Error('No tool call found.');
// //   }
// //   const toolMap = {
// //     [githubTool.name]: githubTool,
// //     [invoiceTool.name]: invoiceTool,
// //     [weatherTool.name]: weatherTool,
// //     [websiteDataTool.name]: websiteDataTool,
// //   };

// //   const selectedTool = toolMap[state.toolCall.name];
// //   if (!selectedTool) {
// //     throw new Error('No tool found in tool map.');
// //   }
// //   const toolResult = await selectedTool.invoke(
// //     state.toolCall.parameters,
// //     config
// //   );
// //   return {
// //     toolResult: JSON.parse(toolResult),
// //   };
// // };

// export function agentExecutor() {
//   const workflow = new StateGraph<AgentExecutorState>({
//     channels: {
//       input: null,
//       chat_history: null,
//       result: null,
//       toolCall: null,
//       toolResult: null,
//     },
//   })
//     .addNode('invokeModel', invokeModel)
//     // .addNode('invokeTools', invokeTools)
//     // .addConditionalEdges('invokeModel', invokeToolsOrReturn)
//     .addEdge(START, 'invokeModel')
//     .addEdge('invokeModel', END);

//   const graph = workflow.compile();
//   return graph;
// }
import { BaseMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { StateGraph, START, END } from '@langchain/langgraph';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';
import fs from 'fs';
import { designComponents } from './designComponents';

interface AgentExecutorState {
  input: string;
  chat_history: BaseMessage[];
  componentDesign?: any;
  componentContent?: string;
}

const loadJSON = (filename: string) => {
  return JSON.parse(fs.readFileSync(filename, 'utf-8'));
};

const componentsData = loadJSON('src/ai/shadcn-components.json');

const findRelevantComponents = (input: any) => {
  const componentsNames = input.map((component: any) => component.name);
  return componentsData.filter((component: any) =>
    componentsNames
      .map((name: string) => name.toLowerCase())
      .includes(component.name.toLowerCase())
  );
};

const generateComponentContent = async (
  state: AgentExecutorState,
  config?: RunnableConfig
): Promise<Partial<AgentExecutorState>> => {
  const relevantComponents = findRelevantComponents(
    state.componentDesign.components
  );
  console.log(relevantComponents);
  function escapeTemplateVariables(text: string): string {
    return text.replace(/({|})/g, (match, offset, string) => {
      return match === '{' ? '{{' : '}}';
    });
  }
  const component_context = relevantComponents.map((e: any, idx: number) => {
    const examples_block = !e.docs.examples.length
      ? ''
      : '\n\n' +
        `# full code examples of Nextjs react components that use ${e.name} :\n` +
        e.docs.examples
          .map((example: any) => {
            return (
              '```' + example.source + '\n' + example.code.trim() + '\n```'
            );
          })
          .join(`\n\n`);
    let promptText =
      `Library components can be used while making the new Nextjs react component

Suggested library component (${idx + 1}/${relevantComponents.length}): ${
        e.name
      } - ${e.description}
Suggested usage: ${state.componentDesign.components[idx].usage}


# ${e.name} can be imported into the new component like this:
\`\`\`tsx
${e.docs.import.code.trim()}
\`\`\`
# ${e.name} can be used in the new component like this:
\`\`\`tsx
${e.docs.use
  .map((block: any) => {
    return '```tsx' + '\n' + block.code.trim() + '\n```';
  })
  .join(`\n\n`)}
`.trim();
    promptText = escapeTemplateVariables(promptText);
    return ['human', promptText];
  });
  console.log(component_context);
  const componentPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at writing NextJS components.\n` +
        `Your task is to write a new NextJS component for a web app, according to the provided task details.\n` +
        `The NextJs component you write can make use of Tailwind classes for styling.\n` +
        `If you judge it is relevant to do so, you can use library components and icons.\n\n` +
        `You will write the full NextJS component code, which should include all imports.` +
        `Your generated code will be directly written to a react (NextJS) component file and used in production. \n`,
    ],
    ...component_context,
    [
      'human',
      `- COMPONENT NAME : ${state.componentDesign.name}\n\n` +
        `- COMPONENT DESCRIPTION :\n` +
        '```\n' +
        state.componentDesign.description.user +
        '\n```\n\n' +
        `- additional component suggestions :\n` +
        '```\n' +
        state.componentDesign.description.llm +
        '\n```\n\n\n' +
        `Write the full code for the new react (NextJS) web component, which uses Tailwind classes if needed (add tailwind dark: classes too if you can; backgrounds in dark: classes should be black), and optionally, library components and icons, based on the provided design task.\n` +
        'The full code of the new react (NextJS) component that you write will be written directly to a .ts file inside the ' +
        ' react (NextJS) project. Make sure all necessary imports are done, and that your full code is enclosed with ```' +
        ' a react ts file blocks.\n' +
        'Answer with generated code only. DO NOT ADD ANY EXTRA TEXT DESCRIPTION OR COMMENTS BESIDES THE CODE. Your answer contains code only ! component code only !\n' +
        `Important :\n` +
        `- Make sure you import provided components libraries and icons that are provided to you if you use them !\n` +
        `- Tailwind classes should be written directly in the elements class tags (or className in case of React). DO NOT WRITE ANY CSS OUTSIDE OF CLASSES. DO NOT USE ANY <style> IN THE CODE ! CLASSES STYLING ONLY !\n` +
        `- Do not use libraries or imports except what is provided in this task; otherwise it would crash the component because not installed. Do not import extra libraries besides what is provided above !\n` +
        `- DO NOT HAVE ANY DYNAMIC DATA OR DATA PROPS ! Components are meant to be working as is without supplying any variable to them when importing them ! Only write a component that render directly with placeholders as data, component not supplied with any dynamic data.\n` +
        `- DO NOT HAVE ANY DYNAMIC DATA OR DATA PROPS ! ` +
        `- Only write the code for the component; Do not write extra code to import it! The code will directly be stored in an individual react .js file !\n` +
        `- Very important : Your component should be exported as default !\n` +
        `Write the react component code as the creative genius and react component genius you are - with good ui formatting.\n`,
    ],
  ]);

  const llm = new ChatOpenAI({
    temperature: 0,
    model: 'gpt-4',
    streaming: true,
  });

  const chain = componentPrompt.pipe(llm);
  const result = await chain.invoke(
    {
      componentDesign: state.componentDesign,
      relevantComponents: relevantComponents,
    },
    config
  );

  return {
    componentContent: result.content as string,
  };
};

export function agentExecutor() {
  const workflow = new StateGraph<AgentExecutorState>({
    channels: {
      input: null,
      chat_history: null,
      componentDesign: null,
      componentContent: null,
    },
  })
    .addNode('designComponents', designComponents)
    .addNode('generateComponentContent', generateComponentContent)
    .addEdge(START, 'designComponents')
    .addEdge('designComponents', 'generateComponentContent')
    .addEdge('generateComponentContent', END);

  const graph = workflow.compile();
  return graph;
}
