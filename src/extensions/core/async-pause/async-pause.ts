import type { IWidget } from '@/lib/litegraph/src/litegraph'
import { api } from '../../../scripts/api.js'
import { app } from '../../../scripts/app.js'
import { getNodeByExecutionId } from './traversal.js'
import type { LGraphNode } from '@/lib/litegraph/src/LGraphNode'
import { createFlashingButton } from './flashing-button.js'
import type { DOMWidget } from '@/scripts/domWidget.js'

type ExtendedNode = LGraphNode & {
  executionId: string
  blinkingIntervalId: NodeJS.Timeout
}
type pauseEventDetail = { executionId: string }

function getEnodeFromPauseEvent(event: CustomEvent): ExtendedNode {
  const executionId: string = (event.detail as pauseEventDetail).executionId
  const node: LGraphNode | null = getNodeByExecutionId(
    app.rootGraph!,
    executionId
  )
  if (!node) {
    throw new Error(`LGraphNode not found for executionId: ${executionId}`)
  }

  const enode: ExtendedNode = node as ExtendedNode
  enode.executionId = executionId
  return enode
}

function enteringPauseLoopHandler(event: CustomEvent) {
  const node: ExtendedNode = getEnodeFromPauseEvent(event)
  if (!app.extensionManager.setting.get('AsyncPause.Blink')) {
    return
  }
  let on = true
  const blinkingColor = `#${
    app.extensionManager.setting.get('AsyncPause.BlinkingColor') as string
  }`
  const flashing_ctn_button = node.widgets?.find(
    (w) => w.name == 'continue'
  ) as DOMWidget<HTMLButtonElement, string>
  ;(
    flashing_ctn_button.element as HTMLButtonElement & { blinking: boolean }
  ).blinking = true
  node.blinkingIntervalId = setInterval(() => {
    on = !on
    flashing_ctn_button.element.style.background = on
      ? blinkingColor
      : 'var(--component-node-widget-background)'
  }, app.extensionManager.setting.get('AsyncPause.BlinkingInterval'))
  flashing_ctn_button.element.style.background = blinkingColor
}

function leavingPauseLoopHandler(event: CustomEvent) {
  const node: ExtendedNode = getEnodeFromPauseEvent(event)
  if (!app.extensionManager.setting.get('AsyncPause.Blink')) {
    return
  }
  clearInterval(node.blinkingIntervalId)
  const flashing_ctn_button = node.widgets?.find(
    (w) => w.name == 'continue'
  ) as DOMWidget<HTMLButtonElement, string>
  flashing_ctn_button.element.style.background =
    'var(--component-node-widget-background)'
  ;(
    flashing_ctn_button.element as HTMLButtonElement & { blinking: boolean }
  ).blinking = false
}

// @ts-ignore
app.api.addEventListener('entering_pause_loop', enteringPauseLoopHandler)

// @ts-ignore
app.api.addEventListener('leaving_pause_loop', leavingPauseLoopHandler)

app.registerExtension({
  name: 'AsyncPause.Pause',
  settings: [
    {
      // @ts-ignore
      id: 'AsyncPause.CancelButton',
      name: 'Cancel button',
      type: 'boolean',
      defaultValue: false,
      tooltip:
        'Add a "Cancel" button to interrupt the current run. Requires a browser refresh to take effect',
      category: ['Async Pause', 'Pause node', 'pause.cancel.button']
    },
    {
      // @ts-ignore
      id: 'AsyncPause.CancelAndRunButton',
      name: 'Cancel and run button',
      type: 'boolean',
      defaultValue: false,
      tooltip:
        'Add a "Cancel And Run" button to interrupt the current run and queue a new one. Requires a browser refresh to take effect',
      category: ['Async Pause', 'Pause node', 'pause.cancelandrun.button']
    },
    {
      // @ts-ignore
      id: 'AsyncPause.BlinkingColor',
      name: 'Blinking color',
      type: 'color',
      defaultValue: '0b8ce9',
      tooltip: 'Change the blinking color (requires enabling blinking)',
      category: ['Async Pause', 'Pause node', 'pause.blinking.color']
    },
    {
      // @ts-ignore
      id: 'AsyncPause.BlinkingInterval',
      name: 'Blinking interval (ms)',
      type: 'number',
      defaultValue: 500,
      tooltip: 'The blinking interval in ms (requires enabling blinking)',
      category: ['Async Pause', 'Pause node', 'pause.blinking.interval']
    },
    {
      // @ts-ignore
      id: 'AsyncPause.Blink',
      name: 'Blinking',
      type: 'boolean',
      tooltip: 'Make the node blink while waiting for user interaction',
      defaultValue: true,
      category: ['Async Pause', 'Pause node', 'pause.blinking']
    },
    {
      // @ts-ignore
      id: 'AsyncPause.ForcePauseToggle',
      name: 'Force pause toggle',
      type: 'boolean',
      tooltip:
        'Add a "force_pause" toggle to force node execution even if input has not change. Requires a browser refresh to take effect',
      defaultValue: false,
      category: ['Async Pause', 'Pause node', 'pause.force']
    }
  ],
  async nodeCreated(node, app) {
    if (node.comfyClass === 'Pause') {
      if (!app.extensionManager.setting.get('AsyncPause.ForcePauseToggle')) {
        const force_pause_widget = node.widgets?.find(
          (w) => w.name === 'force_pause'
        ) as IWidget
        node.removeWidget(force_pause_widget)
      }

      const dom_flashing_btn = createFlashingButton()
      node.addDOMWidget('continue', 'custom', dom_flashing_btn)
      dom_flashing_btn.onclick = async () => {
        const extendedNode = node as ExtendedNode
        const response: Response = await api.fetchApi('/async_pause/continue', {
          method: 'POST',
          body: JSON.stringify({
            executionId: extendedNode.executionId
          })
        })
        if (response.status != 200) {
          app.extensionManager.toast.add({
            severity: 'error',
            summary: 'Pause node',
            detail: 'Internal server error',
            life: 3000
          })
        }
      }

      if (app.extensionManager.setting.get('AsyncPause.CancelButton')) {
        const cancel_btn = node.addWidget('button', 'cancel', '', () => {
          app.api.interrupt(null)
        })
        cancel_btn.label = 'cancel'
        cancel_btn.tooltip = 'Cancel current run'
      }

      if (app.extensionManager.setting.get('AsyncPause.CancelAndRunButton')) {
        const cancel_btn = node.addWidget('button', 'cancelandrun', '', () => {
          app.api.interrupt(null)
          app.queuePrompt(0)
        })
        cancel_btn.label = 'cancel and run'
        cancel_btn.tooltip = 'Cancel current run and queue a new one'
      }
    }
  }
})
