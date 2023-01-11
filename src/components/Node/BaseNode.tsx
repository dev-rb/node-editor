import { ParentComponent } from 'solid-js';
import { useEditor } from '../Editor';
import { useTools } from '../Tools/ToolProvider';

export interface INode {
  type: 'circle' | 'image';
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface BaseNodeProps extends INode {}

const BaseNode: ParentComponent<BaseNodeProps> = (props) => {
  const editor = useEditor();
  const tools = useTools();

  const selectSelf = (e: PointerEvent) => {
    if (tools.activeTool() === 'pointer') {
      editor.selectNode(props.id);
    }

    if (tools.activeTool() === 'line') {
      e.stopPropagation();
      if (editor.connectionState().isConnecting) {
        editor.endConnection(props.id);
      } else {
        editor.startConnection(props.id);
      }
    } else if (tools.activeTool() === 'delete') {
      e.stopPropagation();
      editor.deleteNode(props.id);
    }
  };

  return (
    <svg
      id={props.id}
      class="cursor-move"
      x={props.position.x}
      y={props.position.y}
      width={props.size.width}
      height={props.size.height}
      onPointerDown={selectSelf}
      //   style={{
      //     transform: `translate3d(${props.position.x}px, ${props.position.y}px, 0) scale3d(${
      //       0.5 + props.size.width / window.innerHeight
      //     }, ${0.5 + props.size.height / window.innerHeight}, 1)`,
      //   }}
    >
      {props.children}
    </svg>
  );
};

export default BaseNode;
