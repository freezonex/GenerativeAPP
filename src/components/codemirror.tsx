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
  setShowTuneDialog: (show: boolean) => void;
}

const CodeEditorWithPreview: React.FC<CodeEditorWithPreviewProps> = ({
  code,
  setCode,
  setComponentIds,
  setShowTuneDialog,
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
    if (previewElement) {
      if (!previewElement.shadowRoot) {
        const shadowRoot = previewElement.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        const scriptElement = document.createElement('script');

        styleElement.textContent = `
        * {
          transition: outline 0.1s ease-in-out;
        }
        *[id]:hover, .hover-highlight {
          background-color: rgba(0, 0, 0, 0.5);
        }
      `;

        scriptElement.textContent = `
        document.body.addEventListener('mouseover', (e) => {
          if (e.target.id) {
            console.log('hover', e.target.id);
            e.target.classList.add('hover-highlight');
          }
        });
        document.body.addEventListener('mouseout', (e) => {
          if (e.target.id) {
            e.target.classList.remove('hover-highlight');
          }
        });
      
      `;
        shadowRoot.appendChild(styleElement);

        shadowRoot.innerHTML = code;
        shadowRoot.appendChild(scriptElement);
      } else {
        previewElement.shadowRoot.innerHTML = code;
        const styleElement = document.createElement('style');
        const scriptElement = document.createElement('script');

        styleElement.textContent = `
       * {
          transition: outline 0.1s ease-in-out;
        }
        *[id]:hover, .hover-highlight {
          background-color: rgba(0, 0, 0, 0.5);
        }
      `;

        scriptElement.textContent = `
       document.body.addEventListener('mouseover', (e) => {
          if (e.target.id) {
            console.log('hover', e.target.id);
            e.target.classList.add('hover-highlight');
          }
        });
        document.body.addEventListener('mouseout', (e) => {
          if (e.target.id) {
            e.target.classList.remove('hover-highlight');
          }
        });
      `;

        previewElement.shadowRoot.prepend(scriptElement);
        previewElement.shadowRoot.prepend(styleElement);
      }
      bindClicks();
      blindHovers();
    }
  };
  const blindHovers = (): void => {
    const previewElement = document.getElementById('preview');
    if (previewElement && previewElement.shadowRoot) {
      previewElement.shadowRoot.addEventListener(
        'mouseover',
        handleHover as EventListener
      );
      previewElement.shadowRoot.addEventListener(
        'mouseover',
        updateTooltipPosition as EventListener
      );
      previewElement.shadowRoot.addEventListener(
        'mouseout',
        hideTooltip as EventListener
      );
    }
  };
  const handleHover = (event: MouseEvent): void => {
    const path = event.composedPath();
    for (let i = 0; i < path.length; i++) {
      const element = path[i] as HTMLElement;
      if (element.id) {
        showTooltip(element.id, event);
        break;
      }
    }
  };
  let tooltip: HTMLDivElement | null = null;

  const createTooltip = (): void => {
    tooltip = document.createElement('div');
    tooltip.id = 'id-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = '#C7F564';
    tooltip.style.color = 'black';
    tooltip.style.fontSize = '12px';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '10px';
    document.body.appendChild(tooltip);
  };

  const showTooltip = (id: string, event: MouseEvent): void => {
    if (!tooltip) createTooltip();
    if (tooltip) {
      tooltip.textContent = id;
      tooltip.style.display = 'block';
      updateTooltipPosition(event);
    }
  };

  const hideTooltip = (): void => {
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  const updateTooltipPosition = (event: MouseEvent): void => {
    if (tooltip && tooltip.style.display === 'block') {
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
    }
  };
  const bindClicks = (): void => {
    const previewElement = document.getElementById('preview');
    if (previewElement && previewElement.shadowRoot) {
      previewElement.shadowRoot.addEventListener(
        'click',
        handlePreviewClick as EventListener
      );
    }
  };

  const handlePreviewClick = (event: MouseEvent): void => {
    const path = event.composedPath();
    for (let i = 0; i < path.length; i++) {
      const element = path[i] as HTMLElement;
      if (element.id) {
        console.log('id', element.id);
        setComponentIds([element.id]);
        setShowTuneDialog(true);
        break;
      }
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
