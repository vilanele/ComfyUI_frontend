import { app } from '../../../scripts/app'

class ComfyConnector {
  overlay: HTMLElement
  container: HTMLElement
  iframe: HTMLIFrameElement
  private _url: string
  constructor(url: string) {
    this._url = url
    this.overlay = document.createElement('div')
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999'
    })
    this.container = document.createElement('div')
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '10%',
      left: '10%',
      width: '80%',
      height: '80%',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      cursor: 'default'
    })
    this.iframe = document.createElement('iframe')

    this.iframe.src = url
    Object.assign(this.iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none'
    })
    this.container.appendChild(this.iframe)
    this.overlay.appendChild(this.container)
    document.body.appendChild(this.overlay)

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.overlay.style.display = 'none'
    })

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.overlay.style.display = 'none'
    })
  }
  show() {
    this.overlay.style.display = 'flex'
  }
  hide() {
    this.overlay.style.display = 'none'
  }
  set url(newurl: string) {
    this._url = newurl
    this.iframe.src = this._url
  }
}

app.registerExtension({
  name: 'Infinite Browser',
  async beforeRegisterNodeDef(nodeType) {
    if (nodeType.prototype.comfyClass === 'InfiniteImageLoader') {
      // optional
    }
  },
  getCustomWidgets() {
    return {
      INFINITE_BROWSER(node) {
        const url = node.widgets?.find((w) => w.name === 'url')
        const connectors = new Map<string, ComfyConnector>()
        connectors.set(
          'http://localhost:7866',
          new ComfyConnector('http://localhost:7866')
        )
        let current_connector = connectors.get('http://localhost:7866')
        url!.callback = (newval) => {
          console.log(newval)
          if (!connectors.has(newval)) {
            connectors.set(newval, new ComfyConnector(newval))
          }
          current_connector = connectors.get(newval)
        }

        const browser = node.addWidget('button', 'names', '', () => {
          current_connector?.iframe.contentWindow?.postMessage(
            { hello: 'hello to you' },
            '*'
          )
          window.addEventListener('message', (event) => {
            console.log(event)
          })
          browser.value = ['Bonjour', 'Au revoir']
          current_connector?.show()
        })
        browser.label = 'Open browser'
        browser.value = ['Bonjour', 'Bonjour2']

        return { widget: browser }
      }
    }
  }
})
