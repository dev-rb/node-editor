import { useEditor } from '~/App';

export interface INode {
  type: 'circle' | 'image';
  id: string;
  position: { x: number; y: number };
}

interface CircleNode extends INode {
  type: 'circle';
}

interface NodeProps extends CircleNode {}

const CircleNode = (props: NodeProps) => {
  const editor = useEditor();

  const selectSelf = (e: PointerEvent) => {
    if (editor.tool() === 'pointer') {
      editor.selectNode(props.id);
    }

    if (editor.tool() === 'line') {
      e.stopPropagation();
      if (editor.connectionState().isConnecting) {
        editor.endConnection(props.id);
      } else {
        editor.startConnection(props.id);
      }
    }
  };

  const active = () =>
    editor.state.selectedNode === props.id ||
    editor.connectionState().nodeOne === props.id ||
    editor.connectionState().nodeTwo === props.id;

  return (
    <circle
      id={props.id}
      class="cursor-pointer hover:fill-blue"
      r={20}
      fill={active() ? '#74c0fc' : 'white'}
      transform={`translate(${props.position.x} ${props.position.y})`}
      onPointerDown={selectSelf}
    />
  );
};

export default CircleNode;
