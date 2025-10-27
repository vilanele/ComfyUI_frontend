import { getNodeByExecutionId } from '@/utils/graphTraversalUtil'
import { api } from '../../../scripts/api'
import { app } from '../../../scripts/app'
import type { LGraphNode } from '@/lib/litegraph/src/LGraphNode'
import { sounds, default_sound, soundPath } from './sounds'

type extendedNode = LGraphNode & {
  executionId: string
}
type pauseEventDetail = { executionId: string }

// @ts-ignore
app.api.addEventListener('entering_pause_loop', (event) => {
  const executionId: string = (event.detail as pauseEventDetail).executionId
  const node: extendedNode = getNodeByExecutionId(
    app.rootGraph!,
    executionId
  ) as extendedNode
  node.executionId = executionId
})

app.registerExtension({
  name: 'Custom.Pause',
  settings: [
    {
      // @ts-ignore
      id: 'Pause.CancelButton',
      name: 'Add a cancel button to the node',
      type: 'boolean',
      defaultValue: false
    }
  ],
  async nodeCreated(node, app) {
    if (node.comfyClass === 'Pause') {
      const continue_btn = node.addWidget(
        'button',
        'continue',
        '',
        async () => {
          const extendedNode = node as extendedNode
          const response: Response = await api.fetchApi('/continue', {
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
        },
        { canvasOnly: true, serialize: false }
      )
      continue_btn.label = 'continue'
      continue_btn.tooltip = 'Continue execution of following nodes'

      if (app.extensionManager.setting.get('Pause.CancelButton')) {
        const cancel_btn = node.addWidget('button', 'cancel', '', () => {
          api.fetchApi('/interrupt', {
            method: 'POST'
          })
        })
        cancel_btn.label = 'cancel'
        cancel_btn.tooltip = 'Cancel current run'
      }
    }
  }
})

app.registerExtension({
  name: 'Custom.NotifyAudio',
  settings: [
    {
      // @ts-ignore
      id: 'NotifyAudio.PlayWhenChanged',
      name: 'Play the sound when choosed',
      category: ['Notify Audio', 'Notification sound', 'aa'],
      type: 'boolean',
      defaultValue: true,
      tooltip: 'Wether to play the notifiation wound when changing'
    }
  ],
  async nodeCreated(node) {
    if (
      node.comfyClass === 'NotifyAudioOutput' ||
      node.comfyClass === 'NotifyAudioPassthrough'
    ) {
      node.onExecuted = function () {
        el.pause()
        el.currentTime = 0
        el.play()
      }

      const sound = node.addWidget(
        'combo',
        'sound',
        default_sound,
        (value) => {
          el.pause()
          el.src = api.fileURL(soundPath(value))
          el.play()
        },
        {
          values: Object.keys(sounds),
          serialize: false,
          canvasOnly: true
        }
      )
      sound.label = 'sound'

      const el: HTMLAudioElement = document.createElement('audio')
      el.preload = 'auto'
      el.controls = true
      el.currentTime = 0
      el.volume = 0.5
      el.src = api.fileURL(soundPath(default_sound))
      const player = node.addDOMWidget('player', 'player', el)

      node.onGraphConfigured = () => {
        player.element.src = api.fileURL(soundPath(sound.value as string))
      }
    }
  }
})

app.registerExtension({
  name: 'Custom.Toast',
  async nodeCreated(node, app) {
    if (
      node.comfyClass === 'NotifyToastOutput' ||
      node.comfyClass === 'NotifyToastPassthrough'
    ) {
      node.onExecuted = function () {
        app.extensionManager.toast.add({
          summary: 'Toast node executed',
          // @ts-ignore
          severity: node.widgets?.find((w) => w.name === 'severity')?.value,
          detail: node.widgets?.find((w) => w.name === 'detail')?.value,
          life: node.widgets?.find((w) => w.name === 'life')?.value as number
        })
      }
    }
  }
})
