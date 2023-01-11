import {
  Accessor,
  Component,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  For,
  JSX,
  Match,
  on,
  onCleanup,
  onMount,
  Switch,
  useContext,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { Editor, EditorProvider } from './components/Editor';
import Instructions from './components/Instructions';
import Line from './components/Line';
import BaseNode, { INode } from './components/Node/BaseNode';
import CircleNode from './components/Node/CircleNode';
import ImageNode from './components/Node/ImageNode';
import { ToolsProvider } from './components/Tools';
import { clamp } from './utils/math';

const App: Component = () => {
  return (
    <ToolsProvider>
      <EditorProvider>
        <div class="flex bg-dark-9 font-sans w-screen h-screen">
          <Editor />
        </div>
      </EditorProvider>
    </ToolsProvider>
  );
};

export default App;
