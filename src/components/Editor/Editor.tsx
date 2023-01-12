import { createSignal, onMount, onCleanup, ParentComponent, For, Match, Switch } from 'solid-js';
import { clamp } from '~/utils/math';
import { useEditor } from '.';
import Instructions from '../Instructions';
import Line from '../Line';
import BaseNode from '../Node/BaseNode';
import CircleNode from '../Node/CircleNode';
import ImageNode from '../Node/ImageNode';
import Selection from '../Selection';
import { Toolbar } from '../Tools';
import { useTools } from '../Tools/ToolProvider';

export const Editor: ParentComponent = (props) => {
  const editor = useEditor();
  const tools = useTools();

  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 });

  const [selectionBounds, setSelectionBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 });

  const [instructionsVisible, setInstructionsVisible] = createSignal(true);
  const [dragState, setDragState] = createSignal<{
    isDragging: boolean;
    startMousePos: {
      x: number;
      y: number;
    };
    startPosition: {
      x: number;
      y: number;
    }[];
  }>({
    isDragging: false,
    startMousePos: { x: 0, y: 0 },
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
        startMousePos: { x: e.clientX - selectionBounds().x, y: e.clientY - selectionBounds().y },
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

      const newSelectionPos = {
        x: clamp(e.clientX - dragState().startMousePos.x, 0, canvasBounds().width - selectionBounds().width),
        y: clamp(e.clientY - dragState().startMousePos.y, 0, canvasBounds().height - selectionBounds().height),
      };

      for (let i = 0; i < startPositions.length; i++) {
        const startPosition = startPositions[i];
        const node = editor.state.nodes[editor.state.selectedNodes[i]];
        const newPosition = {
          x: clamp(
            e.clientX - startPosition.x,
            node.position.x - newSelectionPos.x,
            newSelectionPos.x + (node.position.x - selectionBounds().x)
          ),
          y: clamp(
            e.clientY - startPosition.y,
            node.position.y - newSelectionPos.y,
            newSelectionPos.y + (node.position.y - selectionBounds().y)
          ),
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
        startMousePos: { x: 0, y: 0 },
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
