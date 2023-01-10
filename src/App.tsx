import {
  Accessor,
  Component,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  For,
  on,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import Line, { ILine } from './components/Line';
import Node, { INode } from './components/Node';

type Tool = 'pointer' | 'line' | 'node';

const EditorContext = createContext();

interface EditorState {
  selectedNode: string | undefined;
  nodes: Record<string, INode>;
  connections: Record<string, { from: string; to: string }>;
}

interface ConnectionState {
  nodeOne: string | undefined;
  nodeTwo: string | undefined;
  isConnecting: boolean;
}

const App: Component = () => {
  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 });

  const [tool, setTool] = createSignal<Tool>('pointer');

  const [state, setState] = createStore<EditorState>({
    selectedNode: undefined,
    nodes: {},
    connections: {},
  });

  const [dragState, setDragState] = createSignal({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
  });

  const [connectionState, setConnectionState] = createSignal<ConnectionState>({
    nodeOne: undefined,
    nodeTwo: undefined,
    isConnecting: false,
  });

  const selectTool = (tool: Tool) => {
    setTool(tool);
    setConnectionState({ nodeOne: undefined, nodeTwo: undefined, isConnecting: false });
  };

  const startConnection = (nodeId: string) => {
    setConnectionState({
      nodeOne: nodeId,
      nodeTwo: undefined,
      isConnecting: true,
    });
  };

  const endConnection = (nodeId: string) => {
    setConnectionState((p) => ({
      ...p,
      nodeTwo: nodeId,
    }));
  };

  const createConnection = (nodeOne: string, nodeTwo: string) => {
    if (
      Object.values(state.connections).some(
        (v) => (v.from === nodeOne && v.to === nodeTwo) || (v.from === nodeTwo && v.to === nodeOne)
      )
    ) {
      return;
    }
    const newLineId = createUniqueId();
    setState('connections', newLineId, { from: nodeOne, to: nodeTwo });
  };

  const onMouseDown = (e: MouseEvent) => {
    if (state.selectedNode) {
      setDragState({
        isDragging: true,
        startPosition: {
          x: e.clientX - state.nodes[state.selectedNode].position.x,
          y: e.clientY - state.nodes[state.selectedNode].position.y,
        },
      });
    }

    if (tool() === 'node') {
      const newID = createUniqueId();
      const newNode: INode = {
        id: newID,
        position: { x: e.clientX, y: e.clientY },
      };
      setState('nodes', (p) => ({ ...p, [newID]: newNode }));
    } else if (tool() === 'line') {
      setConnectionState({ nodeOne: undefined, nodeTwo: undefined, isConnecting: false });
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (dragState().isDragging && state.selectedNode) {
      const startPosition = dragState().startPosition;
      const newPosition = { x: e.clientX - startPosition.x, y: e.clientY - startPosition.y };

      setState('nodes', state.selectedNode, 'position', newPosition);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    console.log(e.key);
    if (e.key === 'p') {
      selectTool('pointer');
    } else if (e.key === 'l') {
      selectTool('line');
    } else if (e.key === 'n') {
      selectTool('node');
    }
  };

  onMount(() => {
    const canvas = canvasRef();
    if (canvas) {
      const bounds = canvas.getBoundingClientRect();
      setCanvasBounds({ x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height });
    }

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('keydown', onKeyDown);

    onCleanup(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  createEffect(
    on(connectionState, (state) => {
      if (state.nodeOne && state.nodeTwo && state.isConnecting) {
        createConnection(state.nodeOne, state.nodeTwo);
        setConnectionState({ isConnecting: false, nodeOne: undefined, nodeTwo: undefined });
      }
    })
  );

  const selectNode = (id: string) => {
    setState('selectedNode', id);
  };

  const clearSelection = () => {
    setState('selectedNode', undefined);
  };

  const reset = () => {
    setState({
      connections: {},
      nodes: {},
      selectedNode: undefined,
    });

    setDragState({
      isDragging: false,
      startPosition: { x: 0, y: 0 },
    });
    setConnectionState({ nodeOne: undefined, nodeTwo: undefined, isConnecting: false });
  };

  const contextValues = {
    state,
    selectNode,
    tool,
    startConnection,
    endConnection,
    connectionState,
  };

  return (
    <EditorContext.Provider value={contextValues}>
      <div class="flex bg-dark-9 font-sans w-screen h-screen">
        <div class="fixed top-50% left-50% -translate-x-50% -translate-y-50% select-none">
          <h2 class="color-dark-6"> Node Editor </h2>
        </div>
        <div class="fixed top-4 left-4 bg-dark-9 border-dark-2 border-solid border-1 p-2 z-999 select-none gap-4 flex flex-col items-center rounded-sm">
          <div
            class="w-4 h-4 flex items-center justify-center p-2 text-lg color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'pointer' }}
            onClick={[selectTool, 'pointer']}
          >
            P
          </div>
          <div
            class="w-4 h-4 flex items-center justify-center p-2 text-lg color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'line' }}
            onClick={[selectTool, 'line']}
          >
            L
          </div>
          <div
            class="w-4 h-4 flex items-center justify-center p-2 text-lg color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'node' }}
            onClick={[selectTool, 'node']}
          >
            N
          </div>
          <div
            class="absolute -bottom-10 text-xs color-red-1 bg-red-7 p-1 rounded-sm shadow-[0px_0px_6px_2px_rgba(240,62,62,0.5)] cursor-pointer hover:(bg-red-6 color-white)"
            onClick={reset}
          >
            Reset/Clear
          </div>
        </div>
        <svg
          id="canvas"
          class="z-10"
          ref={setCanvasRef}
          width="100%"
          height="100%"
          onClick={clearSelection}
          onMouseDown={onMouseDown}
        >
          <For each={Object.values(state.nodes)}>{(node) => <Node {...node} />}</For>
          <For each={Object.values(state.connections)}>
            {(connection) => <Line from={state.nodes[connection.from]} to={state.nodes[connection.to]} />}
          </For>
        </svg>
      </div>
    </EditorContext.Provider>
  );
};

export default App;

interface EditorContextValues {
  state: EditorState;
  selectNode: (id: string) => void;
  tool: Accessor<Tool>;
  startConnection: (nodeId: string) => void;
  endConnection: (nodeId: string) => void;
  connectionState: Accessor<ConnectionState>;
}

export const useEditor = () => useContext(EditorContext) as EditorContextValues;
