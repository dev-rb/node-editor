import { createEffect, createMemo, createSignal, on, Show } from 'solid-js';
import { useEditor } from './Editor';

interface SelectionProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const Selection = (props: SelectionProps) => {
  const editor = useEditor();

  const onResizeStart = (e: MouseEvent) => {};

  return (
    <svg
      x={props.position.x}
      y={props.position.y}
      width={props.size.width}
      height={props.size.height}
      style={{ overflow: 'visible' }}
    >
      <g>
        <Show when={editor.state.selectedNodes.length}>
          <rect x={0} y={0} width="100%" height="100%" class="outline-blue-6 outline-1 outline-solid" fill="none" />
          <circle
            cx={0}
            cy={0}
            r={6}
            class={`fill-blue-7/40  cursor-nw-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={'50%'}
            cy={0}
            r={6}
            class={`fill-blue-7/40  cursor-n-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={'100%'}
            cy={0}
            r={6}
            class={`fill-blue-7/40  cursor-ne-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={0}
            cy={'50%'}
            r={6}
            class={`fill-blue-7/40  cursor-w-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={0}
            cy={'100%'}
            r={6}
            class={`fill-blue-7/40  cursor-sw-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={'100%'}
            cy={'50%'}
            r={6}
            class={`fill-blue-7/40  cursor-e-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={'100%'}
            cy={'100%'}
            r={6}
            class={`fill-blue-7/40  cursor-se-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
          <circle
            cx={'50%'}
            cy={'100%'}
            r={6}
            class={`fill-blue-7/40  cursor-s-resize hover:(fill-blue-6)`}
            onPointerDown={onResizeStart}
          />
        </Show>
      </g>
    </svg>
  );
};

export default Selection;
