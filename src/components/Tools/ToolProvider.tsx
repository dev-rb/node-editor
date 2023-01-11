import { Accessor, createContext, createSignal, JSX, onCleanup, onMount, ParentComponent, useContext } from 'solid-js';

type Tool = 'pointer' | 'line' | 'circle' | 'image' | 'delete';

const tools: { name: Tool; key: string; icon: string | JSX.Element }[] = [
  { name: 'pointer', key: 'p', icon: 'P' },
  { name: 'line', key: 'l', icon: 'L' },
  { name: 'circle', key: 'c', icon: 'C' },
  { name: 'image', key: 'i', icon: 'I' },
  { name: 'delete', key: 'd', icon: 'D' },
];

const ToolsContext = createContext();

export const ToolsProvider: ParentComponent = (props) => {
  const [activeTool, setActiveTool] = createSignal<Tool>('pointer');
  const selectTool = (tool: Tool) => {
    setActiveTool(tool);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const keyForTool = tools.find((tool) => tool.key === e.key);

    if (keyForTool) {
      selectTool(keyForTool.name);
    }
  };

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  const contextValues = {
    selectTool,
    activeTool,
    tools,
  };

  return <ToolsContext.Provider value={contextValues}>{props.children}</ToolsContext.Provider>;
};

interface ContextValues {
  selectTool: (tool: Tool) => void;
  activeTool: Accessor<Tool>;
  tools: {
    name: Tool;
    key: string;
    icon: string | JSX.Element;
  }[];
}

export const useTools = () => useContext(ToolsContext) as ContextValues;
