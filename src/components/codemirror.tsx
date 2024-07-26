import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { xml } from '@codemirror/lang-xml';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { EditorView, ViewUpdate, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { nanoid } from 'nanoid';
import './codemirror.module.css';
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
  // const updatePreview = async (): Promise<void> => {
  //   try {
  //     if (!previewRef.current) {
  //       console.error('Preview element is not available');
  //       return;
  //     }

  //     if (editorRef.current) {
  //       const state = EditorState.create({
  //         doc: code,
  //         extensions: [html(), EditorView.editable.of(false)],
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error compiling or rendering:', error);
  //   }
  // };

  const updatePreview = (): void => {
    const previewElement = document.getElementById('preview');
    console.log('previewElement', previewElement);
    if (previewElement) {
      //   const parser = new DOMParser();
      //   const doc = parser.parseFromString(code, 'text/html');
      //   doc.body.childNodes.forEach((node) => {
      //     if (node.nodeType === Node.ELEMENT_NODE) {
      //       const element = node as Element;
      //       if (!element.id) {
      //         element.id = `el-${nanoid()}`;
      //       }
      //     }
      //   });
      //    previewElement.innerHTML = doc.body.innerHTML;
      previewElement.innerHTML = code;
      bindClicks();
    }
  };

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
    }
  };

  return (
    <div>
      <div
        id="preview"
        ref={previewRef}
        className="bg-white rounded-lg  shadow-lg p-2 border mb-4"
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
        extensions={[javascript({ jsx: true }), xml(), html()]}
        onChange={(value: string, viewUpdate: ViewUpdate) => setCode(value)}
        onCreateEditor={(view: EditorView) => {
          editorRef.current = view;
        }}
      />
    </div>
  );
};

export default CodeEditorWithPreview;
