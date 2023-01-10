import { createEffect, createSignal, JSX, Show } from 'solid-js';
import { useEditor } from '~/App';
import { INode } from './CircleNode';

export interface IImageNode extends INode {
  type: 'image';
  imageSrc?: string;
}

interface NodeProps extends IImageNode {}

const ImageNode = (props: NodeProps) => {
  const editor = useEditor();

  const [imageSrc, setImageSrc] = createSignal<string>();

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

  const handleImageClick: JSX.EventHandlerUnion<HTMLInputElement, Event> = (e) => {
    const files = e.currentTarget.files;

    if (files) {
      console.log(files);
      setImageSrc(URL.createObjectURL(files[0]));
    }
  };

  const active = () =>
    (editor.state.selectedNode === props.id && editor.dragState().isDragging) ||
    editor.connectionState().nodeOne === props.id ||
    editor.connectionState().nodeTwo === props.id;

  return (
    <g
      id={props.id}
      class="cursor-move"
      transform={`translate(${props.position.x} ${props.position.y})`}
      onPointerDown={selectSelf}
    >
      <defs>
        <pattern
          id={props.id + 'image'}
          patternUnits="objectBoundingBox"
          width="100%"
          height="100%"
          viewBox="0 0 280 180"
          preserveAspectRatio="xMidYMid slice"
        >
          <image href={imageSrc()} width="280" height="180" preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
      <g>
        <rect
          classList={{
            ['fill-blue-3']: active(),
            ['fill-dark-6']: !active(),
          }}
          rx="4"
          ry="4"
          width="300"
          height="200"
        />

        <Show
          when={imageSrc()}
          fallback={
            <g>
              <rect class="fill-dark-4 hover:fill-dark-3/80" rx="4" ry="4" width="280" height="180" x="10" y="10" />
              <foreignObject width="280" height="180" x="10" y="10">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  class="w-full h-full opacity-0 cursor-pointer absolute top-0 left-0"
                  onChange={handleImageClick}
                />
              </foreignObject>
              <text
                x="150"
                y="100"
                class="fill-dark-1 select-none"
                font-weight={600}
                text-anchor="middle"
                dominant-baseline="middle"
              >
                Select Image
              </text>
            </g>
          }
        >
          <rect
            classList={{
              ['fill-dark-4 hover:fill-dark-3/80']: !imageSrc(),
            }}
            rx="4"
            ry="4"
            width="280"
            height="180"
            x="10"
            y="10"
            fill={`url(#${props.id + 'image'})`}
          />
        </Show>
      </g>
    </g>
  );
};

export default ImageNode;
