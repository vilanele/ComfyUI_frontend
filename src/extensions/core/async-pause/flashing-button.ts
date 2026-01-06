export function createFlashingButton() {
  const dom_btn = document.createElement('button')
  dom_btn.style.width = '100%'
  dom_btn.style.padding = '8px'
  dom_btn.style.fontFamily = 'Inter, sans-serif'
  dom_btn.style.height = '24px'
  dom_btn.textContent = 'continue'
  dom_btn.style.border = 'none'
  dom_btn.style.borderRadius = '4px'
  dom_btn.style.fontWeight = '500'
  dom_btn.style.alignItems = 'center'
  dom_btn.style.justifyContent = 'center'
  dom_btn.style.lineHeight = '16px'
  dom_btn.style.fontSize = '12px'
  dom_btn.style.display = 'flex'
  dom_btn.style.cursor = 'pointer'

  dom_btn.style.background = 'var(--component-node-widget-background)'
  dom_btn.style.color = 'var(--base-foreground)'
  dom_btn.addEventListener('mouseenter', () => {
    if (!(dom_btn as HTMLButtonElement & { blinking: boolean }).blinking) {
      dom_btn.style.backgroundColor = 'var(--secondary-background-hover)'
    }
  })
  dom_btn.addEventListener('mouseleave', () => {
    if (!(dom_btn as HTMLButtonElement & { blinking: boolean }).blinking) {
      dom_btn.style.backgroundColor = 'var(--component-node-widget-background)'
    }
  })

  return dom_btn
}
