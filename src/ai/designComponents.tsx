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
import { format } from 'path';

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

export const designComponents = async (
  state: AgentExecutorState,
  config?: RunnableConfig
): Promise<Partial<AgentExecutorState>> => {
  const componentsSchema = z.object({
    new_component_name: z.string(),
    new_component_description: z.string(),
    new_component_icons_elements: z.object({
      does_new_component_need_icons_elements: z.boolean(),
      if_so_what_new_component_icons_elements_are_needed: z
        .array(z.string())
        .optional(),
    }),
    use_library_components: z.array(
      z.object({
        library_component_name: z.enum(componentsData.map((e: any) => e.name)),
        library_component_usage_reason: z.string().optional(),
      })
    ),
  });
  const parser = StructuredOutputParser.fromZodSchema(componentsSchema);
  const formatInstructions = `Please provide the output in the following JSON format:
  {
    "new_component_name": "string",
    "new_component_description": "string",
    "new_component_icons_elements": {
      "does_new_component_need_icons_elements": true/false,
      "if_so_what_new_component_icons_elements_are_needed": ["string"]
    },
    "use_library_components": [
      {
        "library_component_name": "string",
        "library_component_usage_reason": "string"
      }
    ]
  }`;
  const componentsList = componentsData
    .map((e: any) => {
      return `${e.name} : ${e.description};`;
    })
    .join('\n');
  console.log(typeof componentsList);
  const structurePrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Your task is to modify a NextJS component for a web app, according to the user's request.
      If you judge it is relevant to do so, you can specify pre-made library components to use in the component update.
      You can also specify the use of icons if you see that the user's update request requires it.
      {format_instructions}`,
    ],
    [
      'human',
      'Shadcn library components can be used while creating a new component in order to help you do a better design job, faster.\n\nAVAILABLE LIBRARY COMPONENTS:\n```\n' +
        '{components_list} ',
    ],
    [
      'human',
      `USER QUERY: {input}\nDesign the new NextJS web component task for the user as the creative genius you are.`,
    ],
  ]);

  const llm = new ChatOpenAI({
    temperature: 0,
    model: 'gpt-4',
    streaming: true,
  });

  const chain = structurePrompt.pipe(llm);
  const result = await chain.invoke(
    {
      input: state.input,
      format_instructions: formatInstructions,
      components_list: componentsList,
    },
    config
  );

  const component_design = JSON.parse(result.content as string);

  const component_task = {
    name: `${component_design.new_component_name}_${Math.random()
      .toString(36)
      .substr(2, 5)}`,
    description: {
      user: state.input,
      llm: component_design?.new_component_description,
    },
    icons: !component_design.new_component_icons_elements
      ? false
      : !(
          component_design.new_component_icons_elements
            .does_new_component_need_icons_elements &&
          component_design.new_component_icons_elements
            .if_so_what_new_component_icons_elements_are_needed &&
          component_design.new_component_icons_elements
            .if_so_what_new_component_icons_elements_are_needed.length
        )
      ? false
      : component_design.new_component_icons_elements.if_so_what_new_component_icons_elements_are_needed.map(
          (e: any) => e.toLowerCase()
        ),
    components: !component_design.use_library_components
      ? false
      : component_design.use_library_components.map((e: any) => {
          return {
            name: e.library_component_name,
            usage: e.library_component_usage_reason,
          };
        }),
  };

  return {
    componentDesign: component_task,
  };
};
