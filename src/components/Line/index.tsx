import { INode } from '../Node';

export interface ILine {
  from: INode;
  to: INode;
}

interface LineProps extends ILine {}

const Line = (props: LineProps) => {
  const distance = () =>
    Math.hypot(props.from.position.x - props.to.position.x, props.from.position.y - props.to.position.y);

  const startPoint = () => {
    let leftStart = props.from.position.x;
    let topStart = props.from.position.y;
    let leftEnd = props.to.position.x;
    let topEnd = props.to.position.y;

    let prop = 30 / distance();

    let x = leftEnd * (30 / distance()) + leftStart * (1 - prop);
    let y = topEnd * (30 / distance()) + topStart * (1 - prop);

    return { x, y };
  };

  const endPoint = () => {
    let leftStart = props.from.position.x;
    let topStart = props.from.position.y;
    let leftEnd = props.to.position.x;
    let topEnd = props.to.position.y;

    let prop = 50 / distance();

    let x = leftStart * (50 / distance()) + leftEnd * (1 - prop);
    let y = topStart * (50 / distance()) + topEnd * (1 - prop);

    return { x, y };
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
        fill="transparent"
        stroke="white"
        stroke-width="4"
        marker-end={'url(#arrow)'}
        d={`M ${startPoint().x},${startPoint().y}, L ${endPoint().x}, ${endPoint().y} `}
      />
    </g>
  );
};

export default Line;
