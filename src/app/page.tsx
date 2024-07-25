'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import PreviewScreen from '@/components/preview-screen';
import { Input } from '@/components/ui/input';
import {
  CopilotTask,
  useCopilotContext,
  useMakeCopilotReadable,
} from '@copilotkit/react-core';

import CodeEditor from '@/components/codemirror';
import { LocalContext } from '@/app/shared';
import { EndpointsContext } from '@/app/agent';
import { useActions } from '../../utils/client';
const defualtUI = [
  `function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>Hello, React in CodeMirror!</h1>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`,
];
export default function Home() {
  const [code, setCode] = useState<string[]>(defualtUI);
  const [codeToDisplay, setCodeToDisplay] = useState<string>(code[0] || '');
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [codeCommand, setCodeCommand] = useState<string>('');
  const [tuneCommand, setTuneCommand] = useState<string>('');
  const [componentIds, setComponentIds] = useState<string[]>([]);
  const readableCode = useMakeCopilotReadable(codeToDisplay);
  const [previewRef, setPreviewRef] = useState<HTMLDivElement | null>(null);
  const [newComponentName, setNewComponentName] = useState<string>('');

  const actions = useActions<typeof EndpointsContext>();

  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState('');
  async function onSubmit(input: string) {
    const newElements = [...code];

    console.log(actions);
    const result = await actions.agent({
      input,
      chat_history: history,
      file: undefined,
    });
    console.log('Result:', result);
    setCode((prev) => [...prev, result.code]);
    setNewComponentName(result.name);
    // consume the value stream to obtain the final value
    // after which we can append to our chat history state
    // (async () => {
    //   let lastEvent = await element.lastEvent;
    //   if (typeof lastEvent === 'object') {
    //     if (lastEvent['invokeModel']['result']) {
    //       setHistory((prev) => [
    //         ...prev,
    //         ['user', input],
    //         ['assistant', lastEvent['invokeModel']['result']],
    //       ]);
    //     } else if (lastEvent['invokeTools']) {
    //       setHistory((prev) => [
    //         ...prev,
    //         ['user', input],
    //         [
    //           'assistant',
    //           `Tool result: ${JSON.stringify(
    //             lastEvent['invokeTools']['toolResult'],
    //             null
    //           )}`,
    //         ],
    //       ]);
    //     } else {
    //       console.log('ELSE!', lastEvent);
    //     }
    //   }
    // })();

    setInput('');
  }
  const generateCode = new CopilotTask({
    instructions: codeCommand,
    actions: [
      {
        name: 'generateCode',
        description:
          'generate a single page react app, only react code is allowed, and do not include the import and export lines',
        // '生成一个完整的HTML页面代码，只能生成html! 做到页面美观， 生成的每一个element都有一个唯一的id',
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'Code to be generated',
            required: true,
          },
        ],
        handler: async ({ code }) => {
          setCode((prev) => [...prev, code]);
          setCodeToDisplay(code);
        },
      },
    ],
  });
  const tuneComponents = new CopilotTask({
    instructions: tuneCommand,
    actions: [
      {
        name: 'generateCode',
        description: `修改且仅修改id为${componentIds.join(
          ','
        )}的元素的样式，使其更美观, 其余的html文件内容保持不变, 返回修改后的html代码`,
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'Code to be generated',
            required: true,
          },
        ],
        handler: async ({ code }) => {
          setCode((prev) => [...prev, code]);
          setCodeToDisplay(code);
        },
      },
    ],
  });
  const context = useCopilotContext();
  const ConfirmDeploy = async () => {
    try {
      console.log(
        typeof codeToDisplay,
        JSON.stringify({ htmlData: codeToDisplay }),
        { htmlData: codeToDisplay }
      );
      const response = await fetch('http://10.10.10.84:8080/api/saveHtml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: codeToDisplay,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const textResult = await response.text();
      console.log('Received text:', textResult);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  return (
    <>
      <main className="bg-white min-h-screen px-4">
        <Header openCode={() => setShowDialog(true)} />
        <div className="w-full h-full min-h-[70vh] flex justify-between gap-x-1 ">
          <Sidebar>
            <div className="space-y-2 p-4">
              {code.map((c, i) => (
                <div
                  key={i}
                  className={`w-full h-20 p-1 rounded-md border border-slate-600 items-center justify-center flex cursor-pointer ${
                    selectedIndex === i ? 'bg-slate-900 text-white' : 'bg-white'
                  }`}
                  onClick={() => {
                    setSelectedIndex(i);
                    setCodeToDisplay(c);
                  }}
                >
                  v{i}
                </div>
              ))}
            </div>
          </Sidebar>

          {/* <LocalContext.Provider value={onSubmit}>
            <div className="flex flex-col w-full gap-1 mt-auto">{code}</div>
          </LocalContext.Provider> */}

          <div className="w-10/12">
            <div className="w-full mx-auto p-1 rounded-md bg-primary flex my-4 outline-0">
              <Input
                type="text"
                placeholder="Enter your code command"
                className="w-10/12 p-6 rounded-l-md  outline-0 bg-primary text-white"
                // value={codeCommand}
                // onChange={(e) => setCodeCommand(e.target.value)}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                className="w-2/12 bg-white text-primary rounded-r-md"
                // onClick={() => generateCode.run(context)}
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  await onSubmit(input);
                }}
              >
                Generate
              </button>
            </div>
            <CodeEditor
              code={codeToDisplay}
              setCode={setCodeToDisplay}
              setComponentIds={setComponentIds}
            />
            {/* <div> Changing components: {componentIds}</div> */}
            {/* <div className="w-full mx-auto p-1 rounded-md bg-primary flex my-4 outline-0">
              <Input
                type="text"
                placeholder="Enter your code command"
                className="w-10/12 p-6 rounded-l-md  outline-0 bg-primary text-white"
                value={tuneCommand}
                onChange={(e) => setTuneCommand(e.target.value)}
              />
              <button
                className="w-2/12 bg-white text-primary rounded-r-md"
                onClick={() => tuneComponents.run(context)}
              >
                Change
              </button>
            </div> */}
            {/* <PreviewScreen previewRef={previewRef} /> */}
          </div>
        </div>
      </main>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Code.</DialogTitle>
            <DialogDescription>
              You can use the following code to start integrating into your
              application.
            </DialogDescription>
            <textarea className="p-4 rounded bg-primary text-white my-2 h-64 overflow-y-auto overflow-x-hidden max-w-inherit">
              {codeToDisplay}
            </textarea>
          </DialogHeader>
          <Button onClick={ConfirmDeploy}>Confirm Deploy</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
