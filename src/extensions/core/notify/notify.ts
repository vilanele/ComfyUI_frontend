import { api } from '../../../scripts/api'
import { app } from '../../../scripts/app'

app.registerExtension({
  name: 'Custom.Pause',
  async beforeRegisterNodeDef(_nodeType, nodeData, _app) {
    if (nodeData.name === 'Pause') {
      if (nodeData?.input?.required) {
        nodeData.input.required.continue = ['CONTINUE', {}]
      }
    }
  },
  getCustomWidgets() {
    return {
      CONTINUE(node) {
        const continue_btn = node.addWidget(
          'button',
          'continue',
          '',
          async () => {
            const response: Response = await api.fetchApi('/continue', {
              method: 'POST',
              body: JSON.stringify({ node_id: node.id.toString() })
            })
            if (!response.ok) {
              app.extensionManager.toast.add({
                severity: 'error',
                summary: 'Pause execution node',
                detail: 'Server error',
                life: 3000
              })
            }
          },
          { canvasOnly: true, serialize: false }
        )

        return { widget: continue_btn }
      }
    }
  }
})

const sounds: Record<string, string> = {
  bonus: 'bonus.mp3',
  bottle: 'bottle.mp3',
  chime: 'chime.mp3',
  pop: 'pop.wav',
  cartoon: 'cartoon.mp3',
  cowbell: 'cowbell.mp3',
  positive: 'positive.mp3',
  bike: 'bike.mp3',
  collect: 'collect.mp3',
  echo: 'echo.mp3',
  glass: 'glass.mp3',
  metallic: 'metallic.mp3',
  notification: 'notification.mp3'
}

const default_sound: string = 'notification'

function soundPath(sound: string): string {
  return '/extensions/ComfyUI-Notify/audio/'.concat(sounds[sound])
}

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
  async beforeRegisterNodeDef(_nodeType, nodeData, _app) {
    if (
      nodeData.name === 'NotifyAudioOutput' ||
      nodeData.name === 'NotifyAudioPassthrough'
    ) {
      if (nodeData?.input?.required) {
        nodeData.input.required.sound = ['NOTIFY_AUDIO', {}]
      }
    }
  },
  getCustomWidgets() {
    return {
      NOTIFY_AUDIO(node) {
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
        return { widget: sound }
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
          // @ts-ignore
          severity: node.widgets?.find((w) => w.name === 'severity')?.value,
          summary: 'Toast node executed',
          detail: node.widgets?.find((w) => w.name === 'detail')?.value,
          life: node.widgets?.find((w) => w.name === 'life')?.value as number
        })
      }
    }
  }
})
