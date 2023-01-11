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
import { Toolbar } from './Tools';
import { useTools } from './Tools/ToolProvider';

const DEFAULT_NODE_SIZE = {
  circle: { width: 40, height: 40 },
  image: { width: 300, height: 200 },
};

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

export const EditorProvider: ParentComponent = (props) => {
  const tools = useTools();

  const [state, setState] = createStore<EditorState>({
    selectedNode: undefined,
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
      position: position,
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
    setState('selectedNode', id);
  };

  const clearSelection = () => {
    setState('selectedNode', undefined);
  };

  const resetCurrentConnection = () => {
    setConnectionState({ nodeOne: undefined, nodeTwo: undefined, isConnecting: false });
  };

  const resetCanvas = () => {
    setState({
      connections: {},
      nodes: {},
      selectedNode: undefined,
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
  const [instructionsVisible, setInstructionsVisible] = createSignal(true);
  const [dragState, setDragState] = createSignal({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
  });

  const onPointerDown = (e: PointerEvent) => {
    if (editor.state.selectedNode) {
      setDragState({
        isDragging: true,
        startPosition: {
          x: e.clientX - editor.state.nodes[editor.state.selectedNode].position.x,
          y: e.clientY - editor.state.nodes[editor.state.selectedNode].position.y,
        },
      });
    }

    if (tools.activeTool() === 'circle' || tools.activeTool() === 'image') {
      editor.createNode({ type: tools.activeTool() as 'circle' | 'image', position: { x: e.clientX, y: e.clientY } });
      tools.selectTool('pointer');
    } else if (tools.activeTool() === 'line') {
      editor.resetCurrentConnection();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragState().isDragging && editor.state.selectedNode) {
      const startPosition = dragState().startPosition;
      const nodeWidth = editor.state.nodes[editor.state.selectedNode].size.width;
      const nodeHeight = editor.state.nodes[editor.state.selectedNode].size.height;
      const newPosition = {
        x: clamp(e.clientX - startPosition.x, 0, canvasBounds().width - nodeWidth),
        y: clamp(e.clientY - startPosition.y, 0, canvasBounds().height - nodeHeight),
      };
      editor.updateNodePosition(editor.state.selectedNode, newPosition);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    e.stopPropagation();
    if (dragState().isDragging) {
      setDragState({
        isDragging: false,
        startPosition: { x: 0, y: 0 },
      });

      editor.clearSelection();
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
        onPointerUp={editor.clearSelection}
        onPointerDown={onPointerDown}
      >
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
