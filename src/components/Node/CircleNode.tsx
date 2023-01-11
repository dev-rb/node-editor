import { useEditor } from '../Editor';
import { INode } from './BaseNode';

interface CircleNode extends INode {
  type: 'circle';
}

interface NodeProps extends CircleNode {}

const CircleNode = (props: NodeProps) => {
  const editor = useEditor();

  const active = () =>
    editor.state.selectedNode === props.id ||
    editor.connectionState().nodeOne === props.id ||
    editor.connectionState().nodeTwo === props.id;

  return (
    <circle class="cursor-pointer hover:fill-blue" cx={'50%'} cy={'50%'} r={20} fill={active() ? '#74c0fc' : 'white'} />
  );
};

export default CircleNode;
