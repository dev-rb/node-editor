import {
  Accessor,
  Component,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  For,
  Match,
  on,
  onCleanup,
  onMount,
  Switch,
  useContext,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import Line, { ILine } from './components/Line';
import CircleNode, { INode } from './components/Node/CircleNode';
import ImageNode, { IImageNode } from './components/Node/ImageNode';
import { clamp } from './utils/math';

type Tool = 'pointer' | 'line' | 'circle' | 'image' | 'delete';

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
  const [instructionsVisible, setInstructionsVisible] = createSignal(true);

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
    selectTool('pointer');
  };

  const onPointerDown = (e: PointerEvent) => {
    if (state.selectedNode) {
      setDragState({
        isDragging: true,
        startPosition: {
          x: e.clientX - state.nodes[state.selectedNode].position.x,
          y: e.clientY - state.nodes[state.selectedNode].position.y,
        },
      });
    }

    if (tool() === 'circle') {
      const newID = createUniqueId();
      const newNode: INode = {
        type: 'circle',
        id: newID,
        position: { x: e.clientX, y: e.clientY },
      };
      setState('nodes', (p) => ({ ...p, [newID]: newNode }));
      selectTool('pointer');
    } else if (tool() === 'image') {
      const newID = createUniqueId();
      const newNode: INode = {
        type: 'image',
        id: newID,
        position: { x: e.clientX - 150, y: e.clientY - 100 },
      };
      setState('nodes', (p) => ({ ...p, [newID]: newNode }));
      selectTool('pointer');
    } else if (tool() === 'line') {
      setConnectionState({ nodeOne: undefined, nodeTwo: undefined, isConnecting: false });
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragState().isDragging && state.selectedNode) {
      const startPosition = dragState().startPosition;
      const nodeType = state.nodes[state.selectedNode].type;
      const nodeWidth = nodeType === 'circle' ? 40 : 300;
      const nodeHeight = nodeType === 'circle' ? 40 : 200;
      const newPosition = {
        x: clamp(e.clientX - startPosition.x, 0, canvasBounds().width - nodeWidth),
        y: clamp(e.clientY - startPosition.y, 0, canvasBounds().height - nodeHeight),
      };

      setState('nodes', state.selectedNode, 'position', newPosition);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    e.stopPropagation();
    if (dragState().isDragging) {
      setDragState({
        isDragging: false,
        startPosition: { x: 0, y: 0 },
      });

      setState('selectedNode', undefined);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'p') {
      selectTool('pointer');
    } else if (e.key === 'l') {
      selectTool('line');
    } else if (e.key === 'c') {
      selectTool('circle');
    } else if (e.key === 'i') {
      selectTool('image');
    } else if (e.key === 'd') {
      selectTool('delete');
    }
  };

  onMount(() => {
    const canvas = canvasRef();
    if (canvas) {
      const bounds = canvas.getBoundingClientRect();
      setCanvasBounds({ x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height });
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    document.addEventListener('keydown', onKeyDown);

    onCleanup(() => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
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

  const deleteNode = (toRemove: string) => {
    const newState = Object.fromEntries(Object.entries(state.nodes).filter(([id]) => id !== toRemove));
    setState('nodes', reconcile(newState));
  };

  const deleteConnection = (toRemove: string) => {
    const newState = Object.fromEntries(Object.entries(state.connections).filter(([id]) => id !== toRemove));
    setState('connections', reconcile(newState));
  };

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
    dragState,
    deleteNode,
    deleteConnection,
  };

  return (
    <EditorContext.Provider value={contextValues}>
      <div class="flex bg-dark-9 font-sans w-screen h-screen">
        <div
          class="fixed top-50% left-50% -translate-x-50% -translate-y-50% select-none flex flex-col items-center max-w-80 w-75%"
          style={{
            display: instructionsVisible() ? 'flex' : 'none',
          }}
        >
          <h2 class="color-dark-6 text-xl md:text-2xl"> Node Editor </h2>
          <hr class="w-full border-dark-6 border-solid" />
          <div class="w-full color-dark-4 flex flex-col md:text-base text-sm gap-1 [&_p]:(flex justify-between gap-20)">
            <p>
              (P)ointer <span>Drag a node </span>
            </p>
            <p>
              (L)ine
              <span>
                Draw line between nodes*
                <span class="absolute w-full ml-4 color-indigo-7/40">(click on one node and then another)</span>
              </span>
            </p>
            <p>
              (C)ircle <span>Draw a circle node</span>
            </p>
            <p>
              (I)mage <span>Draw an image node</span>
            </p>
            <p>
              (D)elete
              <span>
                Delete a node or line*
                <span class="absolute w-full ml-4 color-indigo-7/40">(click on node or line)</span>
              </span>
            </p>
            <p class="color-red-7/50">
              Reset/Clear <span>Clear the canvas</span>
            </p>
          </div>
          <hr class="w-full border-dark-6 border-solid" />
          <p class="color-dark-4">
            Keyboard shortcuts available! <br /> <span class="color-indigo-7/40"> Use the letters in the toolbar </span>
          </p>
        </div>
        <div class="fixed top-4 left-28% md:left-4 bg-dark-9 border-dark-2 border-solid border-1 p-2 z-999 select-none gap-4 flex md:flex-col xs:flex-row items-center rounded-sm">
          <div
            class="flex items-center justify-center p-2 w-2 h-2  text-sm md:(text-lg w-4 h-4) color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'pointer' }}
            onPointerUp={[selectTool, 'pointer']}
          >
            P
          </div>
          <div
            class="flex items-center justify-center p-2 w-2 h-2  text-sm md:(text-lg w-4 h-4) color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'line' }}
            onPointerUp={[selectTool, 'line']}
          >
            L
          </div>
          <div
            class="flex items-center justify-center p-2 w-2 h-2  text-sm md:(text-lg w-4 h-4) color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'circle' }}
            onPointerUp={[selectTool, 'circle']}
          >
            C
          </div>
          <div
            class="flex items-center justify-center p-2 w-2 h-2  text-sm md:(text-lg w-4 h-4) color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'image' }}
            onPointerUp={[selectTool, 'image']}
          >
            I
          </div>
          <div
            class="flex items-center justify-center p-2 w-2 h-2  text-sm md:(text-lg w-4 h-4) color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tool() === 'delete' }}
            onPointerUp={[selectTool, 'delete']}
          >
            D
          </div>
          <div class="w-fit fixed bottom-4 right-4 md:(absolute -bottom-25 left-50% -translate-x-50%) flex flex-col gap-2">
            <div
              class="w-fit text-xs md:text-sm flex items-center justify-center color-red-1 bg-red-7 p-1 rounded-sm shadow-[0px_0px_6px_2px_rgba(240,62,62,0.5)] cursor-pointer hover:(bg-red-6 color-white)"
              onPointerUp={reset}
            >
              Reset/Clear
            </div>
            <div
              class="w-fit text-xs md:text-sm flex items-center justify-center color-dark-1 bg-dark-7 p-1 rounded-sm shadow-[0px_0px_6px_2px_rgba(26,27,30,0.5)] cursor-pointer hover:(bg-dark-6/70 color-gray-1)"
              onPointerUp={() => setInstructionsVisible((p) => !p)}
            >
              {instructionsVisible() ? 'Hide' : 'Show'} Instructions
            </div>
          </div>
        </div>
        <svg
          id="canvas"
          class="z-10 touch-none"
          ref={setCanvasRef}
          width="100%"
          height="100%"
          onPointerUp={clearSelection}
          onPointerDown={onPointerDown}
        >
          <For each={Object.entries(state.connections)}>
            {([id, connection]) => <Line id={id} from={state.nodes[connection.from]} to={state.nodes[connection.to]} />}
          </For>
          <For each={Object.values(state.nodes)}>
            {(node) => (
              <Switch>
                <Match when={node.type === 'circle'}>
                  <CircleNode {...node} type="circle" />
                </Match>
                <Match when={node.type === 'image'}>
                  <ImageNode {...node} type="image" />
                </Match>
              </Switch>
            )}
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
  dragState: Accessor<{
    isDragging: boolean;
    startPosition: {
      x: number;
      y: number;
    };
  }>;
  deleteNode: (toRemove: string) => void;
  deleteConnection: (toRemove: string) => void;
}

export const useEditor = () => useContext(EditorContext) as EditorContextValues;
