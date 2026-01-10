import { app } from '../../../scripts/app'

app.registerExtension({
  name: 'test.node.extension',
  async nodeCreated(node) {
    if (node.comfyClass == 'TestNode') {
      // Adding the builtin widget BEFORE the DOM widget
      node.addWidget('button', 'builtin button widget', '', () => {})

      // Adding a DOM widget, with some style for visualization
      const dom_widget = document.createElement('div')
      dom_widget.textContent = 'custom dom widget'
      dom_widget.style.textAlign = 'center'
      dom_widget.style.border = 'solid'
      dom_widget.style.borderColor = 'red'

      node.addDOMWidget('custom', 'custom', dom_widget)
    }
  }
})
