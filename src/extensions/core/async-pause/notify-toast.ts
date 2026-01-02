import { app } from '../../../scripts/app.js'

app.registerExtension({
  name: 'AsyncPause.Toast',
  async nodeCreated(node, app) {
    if (
      node.comfyClass === 'NotifyToastOutput' ||
      node.comfyClass === 'NotifyToastPassthrough'
    ) {
      node.onExecuted = function () {
        app.extensionManager.toast.add({
          summary: 'Toast node executed',
          severity: node.widgets?.find((w) => w.name === 'severity')?.value as
            | 'info'
            | 'success'
            | 'warn'
            | 'secondary'
            | 'contrast',
          detail: node.widgets?.find((w) => w.name === 'detail')
            ?.value as string,
          life: node.widgets?.find((w) => w.name === 'life')?.value as number
        })
      }
    }
  }
})
