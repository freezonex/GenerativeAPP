import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { xml } from '@codemirror/lang-xml';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, ViewUpdate, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { nanoid } from 'nanoid';
import './codemirror.module.css';
import { transpileCode } from './getBabel';
import * as ReactDOM from 'react-dom';
interface CodeEditorWithPreviewProps {
  code: string;
  setCode: (code: string) => void;
  setComponentIds: (ids: string[]) => void;
}

const CodeEditorWithPreview: React.FC<CodeEditorWithPreviewProps> = ({
  code,
  setCode,
  setComponentIds,
}) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    updatePreview();
  }, [code]);
  const updatePreview = async (): Promise<void> => {
    try {
      if (!previewRef.current) {
        console.error('Preview element is not available');
        return;
      }

      const transpiled = transpileCode(code);
      const renderComponent = new Function(
        'React',
        'ReactDOM',
        'root',
        `
          ${transpiled}
          if (typeof App === 'undefined') {
            throw new Error('App component is not defined');
          }
          ReactDOM.render(React.createElement(App), root);
        `
      );
      renderComponent(React, ReactDOM, previewRef.current);
    } catch (error) {
      console.error('Error compiling or rendering:', error);
    }
  };

  // const updatePreview = (): void => {
  //   const previewElement = document.getElementById('preview');
  //   console.log('previewElement', previewElement);
  //   if (previewElement) {
  //     //   const parser = new DOMParser();
  //     //   const doc = parser.parseFromString(code, 'text/html');
  //     //   doc.body.childNodes.forEach((node) => {
  //     //     if (node.nodeType === Node.ELEMENT_NODE) {
  //     //       const element = node as Element;
  //     //       if (!element.id) {
  //     //         element.id = `el-${nanoid()}`;
  //     //       }
  //     //     }
  //     //   });
  //     //    previewElement.innerHTML = doc.body.innerHTML;
  //     previewElement.innerHTML = code;
  //     bindClicks();
  //   }
  // };

  const bindClicks = (): void => {
    const previewElement = document.getElementById('preview');
    if (previewElement) {
      previewElement.addEventListener('click', handlePreviewClick);
    }
  };

  const handlePreviewClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const id = target.id;
    console.log('id', id);
    if (id) {
      setComponentIds([id]);
      highlightElementInEditor(id);
    }
  };

  const highlightElementInEditor = (id: string): void => {
    if (editorRef.current) {
      const view = editorRef.current;
      const doc = view.state.doc;
      let start = -1;
      let end = -1;

      for (let i = 0; i < doc.length; i++) {
        const line = doc.line(i);
        const lineContent = line.text;
        const idIndex = lineContent.indexOf(`id="${id}"`);
        if (idIndex !== -1) {
          start = line.from + lineContent.lastIndexOf('<', idIndex);
          end = line.from + lineContent.indexOf('>', idIndex) + 1;
          break;
        }
      }

      if (start !== -1 && end !== -1) {
        const highlightEffect = StateEffect.define<{
          from: number;
          to: number;
        }>();

        const highlightField = StateField.define({
          create() {
            return Decoration.none;
          },
          update(highlights, tr) {
            highlights = highlights.map(tr.changes);
            for (let e of tr.effects) {
              if (e.is(highlightEffect)) {
                highlights = highlights.update({
                  add: [
                    Decoration.mark({ class: 'highlight' }).range(
                      e.value.from,
                      e.value.to
                    ),
                  ],
                });
              }
            }
            return highlights;
          },
          provide: (f) => EditorView.decorations.from(f),
        });

        view.dispatch({
          effects: [
            highlightEffect.of({ from: start, to: end }),
            StateEffect.appendConfig.of([highlightField]),
          ],
        });

        setTimeout(() => {
          view.dispatch({
            effects: StateEffect.appendConfig.of([]),
          });
        }, 3000);
      }
    }
  };

  return (
    <div>
      <div
        id="preview"
        ref={previewRef}
        className="w-full h-full bg-white rounded-lg  shadow-lg p-2 border mb-4"
      >
        {/* {previewError ? (
          <pre>Error: {previewError}</pre>
        ) : (
          PreviewComponent && <PreviewComponent />
        )} */}
      </div>
      <CodeMirror
        value={code}
        height="100%"
        extensions={[javascript({ jsx: true }), xml()]}
        onChange={(value: string, viewUpdate: ViewUpdate) => setCode(value)}
        onCreateEditor={(view: EditorView) => {
          editorRef.current = view;
        }}
      />
    </div>
  );
};

export default CodeEditorWithPreview;
