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
  notification: 'notification.mp3'
}

const default_sound: string = 'echo'

function soundPath(sound: string): string {
  return '/extensions/ComfyUI-Notify/audio/'.concat(sounds[sound])
}

export { sounds, default_sound, soundPath }
