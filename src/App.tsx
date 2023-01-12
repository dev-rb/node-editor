import { Component } from 'solid-js';
import { Editor, EditorProvider } from './components/Editor';
import { ToolsProvider } from './components/Tools';

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
