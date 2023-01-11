import { useEditor } from "~/App"

interface InstructionsProps{
    visible: boolean
}

const Instructions = (props: InstructionsProps) => {
    return(
        <div
          class="fixed top-50% left-50% -translate-x-50% -translate-y-50% select-none flex flex-col items-center max-w-80 w-75%"
          style={{
            display: props.visible ? 'flex' : 'none',
          }}
        >
          <h2 class="color-dark-6 text-xl md:text-2xl"> Node Editor </h2>
          <hr class="w-full border-dark-6 border-solid" />
          <div class="w-full color-dark-4 flex flex-col md:text-base text-sm gap-1 [&_p]:(flex justify-between gap-20)">
            <p>
              (P)ointer <span>Drag a node </span>
            </p>
            <p>
              (L)ine
              <span>
                Draw line between nodes*
                <span class="absolute w-full ml-4 color-indigo-7/40">(click on one node and then another)</span>
              </span>
            </p>
            <p>
              (C)ircle <span>Draw a circle node</span>
            </p>
            <p>
              (I)mage <span>Draw an image node</span>
            </p>
            <p>
              (D)elete
              <span>
                Delete a node or line*
                <span class="absolute w-full ml-4 color-indigo-7/40">(click on node or line)</span>
              </span>
            </p>
            <p class="color-red-7/50">
              Reset/Clear <span>Clear the canvas</span>
            </p>
          </div>
          <hr class="w-full border-dark-6 border-solid" />
          <p class="color-dark-4">
            Keyboard shortcuts available! <br /> <span class="color-indigo-7/40"> Use the letters in the toolbar </span>
          </p>
        </div>
    )
}

export default Instructions