import { api } from '../../../scripts/api.js'
import { app } from '../../../scripts/app.js'
import { sounds, default_sound, soundPath } from './sounds.js'

app.registerExtension({
  name: 'AsyncPause.NotifyAudio',
  settings: [
    {
      // @ts-ignore
      id: 'AsyncPause.PlayWhenSelected',
      name: 'Play when selected',
      category: [
        'Async Pause',
        'Notification sound',
        'notify.audio.play.when.changed'
      ],
      type: 'boolean',
      defaultValue: true,
      tooltip:
        'Wether to play the notifiation sound when selected in the dropdown list'
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
          if (app.extensionManager.setting.get('AsyncPause.PlayWhenSelected')) {
            el.play()
          }
        },
        {
          values: Object.keys(sounds).sort((a, b) => a.localeCompare(b))
        }
      )

      const el: HTMLAudioElement = document.createElement('audio')
      el.controls = true
      el.style.display = 'hidden'
      el.classList.add('comfy-audio')
      el.setAttribute('name', 'media')
      el.preload = 'auto'
      el.currentTime = 0
      el.volume = 0.5
      el.src = api.fileURL(soundPath(default_sound))

      node.onGraphConfigured = () => {
        el.src = api.fileURL(soundPath(sound.value as string))
      }

      node.addWidget(
        'slider',
        'volume',
        50,
        (value) => {
          el.volume = value / 100
        },
        { min: 0, max: 100, step2: 1 }
      )
    }
  }
})
