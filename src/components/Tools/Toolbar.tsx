import { For } from 'solid-js';
import { useEditor } from '../Editor';
import { useTools } from './ToolProvider';

interface ToolbarProps {
  instructionsVisible: boolean;
  setInstructionsVisible: (value: boolean) => void;
}

export const Toolbar = (props: ToolbarProps) => {
  const editor = useEditor();
  const tools = useTools();
  return (
    <div class="fixed top-4 left-28% md:left-4 bg-dark-9 border-dark-2 border-solid border-1 p-2 z-999 select-none gap-4 flex md:flex-col xs:flex-row items-center rounded-sm">
      <For each={tools.tools}>
        {(toolItem) => (
          <div
            class="flex items-center justify-center p-2 w-2 h-2  text-sm md:(text-lg w-4 h-4) color-white cursor-pointer hover:bg-dark-3/40"
            classList={{ ['bg-dark-4']: tools.activeTool() === toolItem.name }}
            onPointerUp={[tools.selectTool, toolItem.name]}
          >
            {toolItem.icon}
          </div>
        )}
      </For>
      <div class="w-fit fixed bottom-4 right-4 md:(absolute -bottom-25 left-50% -translate-x-50%) flex flex-col gap-2">
        <div
          class="w-fit text-xs md:text-sm flex items-center justify-center color-red-1 bg-red-7 p-1 rounded-sm shadow-[0px_0px_6px_2px_rgba(240,62,62,0.5)] cursor-pointer hover:(bg-red-6 color-white)"
          onPointerUp={editor.resetCanvas}
        >
          Reset/Clear
        </div>
        <div
          class="w-fit text-xs md:text-sm flex items-center justify-center color-dark-1 bg-dark-7 p-1 rounded-sm shadow-[0px_0px_6px_2px_rgba(26,27,30,0.5)] cursor-pointer hover:(bg-dark-6/70 color-gray-1)"
          onPointerUp={() => props.setInstructionsVisible(!props.instructionsVisible)}
        >
          {props.instructionsVisible ? 'Hide' : 'Show'} Instructions
        </div>
      </div>
    </div>
  );
};
