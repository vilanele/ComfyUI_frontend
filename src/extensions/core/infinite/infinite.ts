import { app } from '../../../scripts/app'
import { api } from '../../../scripts/api'
import { getExecutionIdsForSelectedNodes } from '@/utils/graphTraversalUtil'

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
  settings: [
    {
      // @ts-ignore
      id: 'example.combo',
      name: 'Example combo setting',
      type: 'combo',
      defaultValue: 'first',
      options: [
        { text: 'My first option', value: 'first' },
        'My second option'
      ],
      attrs: {
        editable: true,
        filter: true
      },
      onChange: (newVal, oldVal) => {
        console.log(`Setting was changed from ${oldVal} to ${newVal}`)
      }
    },
    {
      // @ts-ignore
      id: 'example.text',
      name: 'Example text setting',
      type: 'text',
      defaultValue: 'Foo',
      onChange: (newVal, oldVal) => {
        console.log(`Setting was changed from ${oldVal} to ${newVal}`)
      }
    }
  ],
  async beforeRegisterNodeDef(nodeType) {
    if (nodeType.prototype.comfyClass === 'InfiniteImageLoader') {
      // optional
    }
  },
  getCustomWidgets() {
    return {
      INFINITE_BROWSER(node) {
        // const url = node.widgets?.find((w) => w.name === 'url')

        const combo = node.addWidget(
          'combo',
          'browser',
          'http://localhost:7866',
          () => {
            console.log(
              'Execution id :',
              getExecutionIdsForSelectedNodes([node])
            )
          },
          {
            values: [
              'http://localhost:3000',
              'http://monster:7888',
              'http://infinite:7888'
            ]
          }
        )

        node.addWidget('string', 'url', '', () => {})
        const connectors = new Map<string, ComfyConnector>()
        connectors.set(
          'http://localhost:7866',
          new ComfyConnector('http://localhost:7866')
        )
        let current_connector = connectors.get('http://localhost:7866')
        combo!.callback = (newval) => {
          console.log(newval)
          console.log(
            'Execution id :',
            // @ts-ignore
            getExecutionIdsForSelectedNodes(node.graph.nodes)
          )
          if (!connectors.has(newval)) {
            connectors.set(newval, new ComfyConnector(newval))
          }
          current_connector = connectors.get(newval)
        }

        // node.addWidget('button', 'Add new browser', '', () => {})
        const browser = node.addWidget('button', 'names', '', () => {
          current_connector?.iframe.contentWindow?.postMessage(
            { hello: 'hello to you' },
            '*'
          )
          window.addEventListener('message', async (event) => {
            const blob = new Blob([event.data.buffer], {
              type: 'application/octet-stream'
            })

            // Optional: wrap in a File to give it a filename
            const file = new File([blob], event.data.name)
            // api
            const body = new FormData()
            body.append('image', file)
            // body.append('subfolder', 'infinite')
            await api.fetchApi('/upload/image', {
              method: 'POST',
              body
            })
            browser.value = event.data.name
            console.log(event)
          })
          current_connector?.show()
        })
        browser.label = 'Open browser'

        return { widget: browser }
      }
    }
  }
})
