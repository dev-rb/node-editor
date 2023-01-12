import {
  createContext,
  ParentComponent,
  createSignal,
  createUniqueId,
  createEffect,
  on,
  Accessor,
  useContext,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { INode } from '../Node/BaseNode';
import { useTools } from '../Tools';

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
