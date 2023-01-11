import { useEditor } from '../Editor';
import { INode } from '../Node/BaseNode';
import { useTools } from '../Tools/ToolProvider';

export interface ILine {
  from: INode;
  to: INode;
}

interface LineProps extends ILine {
  id: string;
}

const Line = (props: LineProps) => {
  const editor = useEditor();
  const tools = useTools();
  const distance = () =>
    Math.hypot(props.from.position.x - props.to.position.x, props.from.position.y - props.to.position.y);

  const startPoint = () => {
    const startBounds = document.getElementById(props.from.id)!.getBoundingClientRect();
    const endBounds = document.getElementById(props.to.id)!.getBoundingClientRect();

    let leftStart = props.from.position.x + props.from.size.width / 2;
    let topStart = props.from.position.y + props.from.size.height / 2;
    // let leftEnd = props.to.position.x + props.to.type === 'circle' ? 0 : endBounds.width / 2;
    // let topEnd = props.to.position.y + props.to.type === 'circle' ? 0 : endBounds.height / 2;

    // let prop = 30 / distance();

    // let x = leftEnd * (30 / distance()) + leftStart * (1 - prop);
    // let y = topEnd * (30 / distance()) + topStart * (1 - prop);

    return { x: leftStart, y: topStart };
  };

  const endPoint = () => {
    const startBounds = document.getElementById(props.from.id)!.getBoundingClientRect();
    const endBounds = document.getElementById(props.to.id)!.getBoundingClientRect();

    // let leftStart = props.from.position.x + props.from.type === 'circle' ? 0 : startBounds.width / 2;
    // let topStart = props.from.position.y + props.from.type === 'circle' ? 0 : startBounds.height / 2;
    let leftEnd = props.to.position.x + props.to.size.width / 2;
    let topEnd = props.to.position.y + props.to.size.height / 2;

    // let prop = 50 / distance();

    // let x = leftStart * (50 / distance()) + leftEnd * (1 - prop);
    // let y = topStart * (50 / distance()) + topEnd * (1 - prop);

    return { x: leftEnd, y: topEnd };
  };

  const onLineClick = (e: PointerEvent) => {
    if (tools.activeTool() === 'delete') {
      e.stopPropagation();
      editor.deleteConnection(props.id);
    }
  };

  return (
    <g>
      <marker
        id="arrow"
        markerWidth="4"
        markerHeight="4"
        refX="0"
        refY="2"
        orient="auto"
        fill="white"
        stroke-linejoin="round"
        stroke-width="0.5"
        stroke="white"
      >
        <polygon points="0 0, 4 2, 0 4" />
      </marker>
      <path
        class="cursor-pointer"
        fill="transparent"
        stroke="white"
        stroke-width="4"
        marker-end={'url(#arrow)'}
        d={`M ${startPoint().x},${startPoint().y}, L ${endPoint().x}, ${endPoint().y} `}
        onPointerDown={onLineClick}
      />
    </g>
  );
};

export default Line;
