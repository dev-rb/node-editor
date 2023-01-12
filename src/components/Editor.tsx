import {
  createContext,
  createSignal,
  createUniqueId,
  onMount,
  onCleanup,
  createEffect,
  on,
  ParentComponent,
  useContext,
  Accessor,
  For,
  Match,
  Switch,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { clamp } from '~/utils/math';
import Instructions from './Instructions';
import Line from './Line';
import BaseNode, { INode } from './Node/BaseNode';
import CircleNode from './Node/CircleNode';
import ImageNode from './Node/ImageNode';
import Selection from './Selection';
import { Toolbar } from './Tools';
import { useTools } from './Tools/ToolProvider';

const DEFAULT_NODE_SIZE = {
  circle: { width: 40, height: 40 },
  image: { width: 300, height: 200 },
};

const EditorContext = createContext();

interface EditorState {
  selectedNodes: string[];
  nodes: Record<string, INode>;
  connections: Record<string, { from: string; to: string }>;
}

interface ConnectionState {
  nodeOne: string | undefined;
  nodeTwo: string | undefined;
  isConnecting: boolean;
}

export const EditorProvider: ParentComponent = (props) => {
  const tools = useTools();

  const [state, setState] = createStore<EditorState>({
    selectedNodes: [],
    nodes: {},
    connections: {},
  });

  const [connectionState, setConnectionState] = createSignal<ConnectionState>({
    nodeOne: undefined,
    nodeTwo: undefined,
    isConnecting: false,
  });

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

    tools.selectTool('pointer');
  };

  const createNode = ({ type, position }: { type: 'circle' | 'image'; position: { x: number; y: number } }) => {
    const newID = createUniqueId();
    const newNode: INode = {
      type: type,
      id: newID,
      position: {
        x: position.x - DEFAULT_NODE_SIZE[type].width / 2,
        y: position.y - DEFAULT_NODE_SIZE[type].height / 2,
      },
      size: { width: DEFAULT_NODE_SIZE[type].width, height: DEFAULT_NODE_SIZE[type].height },
    };

    setState('nodes', newID, newNode);
  };

  const updateNodePosition = (id: string, newPosition: { x: number; y: number }) => {
    setState('nodes', id, 'position', newPosition);
  };

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
    setState('selectedNodes', [id]);
  };

  const toggleNode = (id: string) => {
    let newState = [...state.selectedNodes];
    if (newState.includes(id)) {
      newState = newState.filter((v) => v !== id);
    } else {
      newState.push(id);
    }
    setState('selectedNodes', newState);
  };

  const clearSelection = () => {
    setState('selectedNodes', []);
  };

  const resetCurrentConnection = () => {
    setConnectionState({ nodeOne: undefined, nodeTwo: undefined, isConnecting: false });
  };

  const resetCanvas = () => {
    setState({
      connections: {},
      nodes: {},
      selectedNodes: [],
    });
    resetCurrentConnection();
  };

  createEffect(
    on(tools.activeTool, () => {
      resetCurrentConnection();
    })
  );

  const contextValues = {
    state,
    toggleNode,
    selectNode,
    resetCanvas,
    startConnection,
    endConnection,
    connectionState,
    deleteNode,
    deleteConnection,
    clearSelection,
    createNode,
    resetCurrentConnection,
    updateNodePosition,
  };

  return <EditorContext.Provider value={contextValues}>{props.children}</EditorContext.Provider>;
};

interface EditorContextValues {
  state: EditorState;
  toggleNode: (id: string) => void;
  selectNode: (id: string) => void;
  resetCanvas: () => void;
  startConnection: (nodeId: string) => void;
  endConnection: (nodeId: string) => void;
  connectionState: Accessor<ConnectionState>;
  deleteNode: (toRemove: string) => void;
  deleteConnection: (toRemove: string) => void;
  clearSelection: () => void;
  createNode: ({
    type,
    position,
  }: {
    type: 'circle' | 'image';
    position: {
      x: number;
      y: number;
    };
  }) => void;
  resetCurrentConnection: () => void;
  updateNodePosition: (
    id: string,
    newPosition: {
      x: number;
      y: number;
    }
  ) => void;
}

export const useEditor = () => useContext(EditorContext) as EditorContextValues;

export const Editor: ParentComponent = (props) => {
  const editor = useEditor();
  const tools = useTools();

  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 });

  const [selectionBounds, setSelectionBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 });

  const [instructionsVisible, setInstructionsVisible] = createSignal(true);
  const [dragState, setDragState] = createSignal<{
    isDragging: boolean;
    startPosition: {
      x: number;
      y: number;
    }[];
  }>({
    isDragging: false,
    startPosition: [{ x: 0, y: 0 }],
  });

  const updateSelection = () => {
    const selected = editor.state.selectedNodes.map((id) => editor.state.nodes[id]);

    const newBounds = selected.reduce(
      (acc, curr) => {
        if (curr.position.x < acc.x) {
          acc.x = curr.position.x;
        }

        if (curr.position.y < acc.y) {
          acc.y = curr.position.y;
        }

        if (curr.position.x + curr.size.width > acc.right) {
          acc.right = curr.position.x + curr.size.width;
        }

        if (curr.position.y + curr.size.height > acc.bottom) {
          acc.bottom = curr.position.y + curr.size.height;
        }

        return acc;
      },
      { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER, right: 0, bottom: 0 }
    );
    setSelectionBounds({
      x: newBounds.x,
      y: newBounds.y,
      width: newBounds.right - newBounds.x,
      height: newBounds.bottom - newBounds.y,
    });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (editor.state.selectedNodes.length && tools.activeTool() === 'pointer' && e.defaultPrevented) {
      updateSelection();
      setDragState({
        isDragging: true,
        startPosition: [
          ...editor.state.selectedNodes.map((id) => ({
            x: e.clientX - editor.state.nodes[id].position.x,
            y: e.clientY - editor.state.nodes[id].position.y,
          })),
        ],
      });
      return;
    }

    if (tools.activeTool() === 'circle' || tools.activeTool() === 'image') {
      editor.createNode({ type: tools.activeTool() as 'circle' | 'image', position: { x: e.clientX, y: e.clientY } });
      tools.selectTool('pointer');
    } else if (tools.activeTool() === 'line') {
      editor.resetCurrentConnection();
    } else if (tools.activeTool() === 'pointer') {
      editor.clearSelection();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragState().isDragging && editor.state.selectedNodes.length) {
      const startPositions = dragState().startPosition;
      for (let i = 0; i < startPositions.length; i++) {
        const startPosition = startPositions[i];
        const node = editor.state.nodes[editor.state.selectedNodes[i]];
        const nodeWidth = node.size.width;
        const nodeHeight = node.size.height;
        const newPosition = {
          x: clamp(e.clientX - startPosition.x, 0, canvasBounds().width - nodeWidth),
          y: clamp(e.clientY - startPosition.y, 0, canvasBounds().height - nodeHeight),
        };
        editor.updateNodePosition(node.id, newPosition);
      }
      updateSelection();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    e.stopPropagation();
    if (dragState().isDragging) {
      setDragState({
        isDragging: false,
        startPosition: [],
      });
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

    onCleanup(() => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    });
  });

  return (
    <>
      <Instructions visible={instructionsVisible()} />
      <Toolbar instructionsVisible={instructionsVisible()} setInstructionsVisible={setInstructionsVisible} />
      <svg
        id="canvas"
        class="z-10 touch-none"
        ref={setCanvasRef}
        width="100%"
        height="100%"
        onPointerDown={onPointerDown}
      >
        <Selection position={{ ...selectionBounds() }} size={{ ...selectionBounds() }} />
        <For each={Object.entries(editor.state.connections)}>
          {([id, connection]) => (
            <Line id={id} from={editor.state.nodes[connection.from]} to={editor.state.nodes[connection.to]} />
          )}
        </For>
        <For each={Object.values(editor.state.nodes)}>
          {(node) => (
            <BaseNode {...node}>
              <Switch>
                <Match when={node.type === 'circle'}>
                  <CircleNode {...node} type="circle" />
                </Match>
                <Match when={node.type === 'image'}>
                  <ImageNode {...node} type="image" />
                </Match>
              </Switch>
            </BaseNode>
          )}
        </For>
      </svg>
    </>
  );
};
