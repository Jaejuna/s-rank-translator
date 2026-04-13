import { useState } from 'react'

export function useColumnResize(initialWidths: number[]) {
  const [widths, setWidths] = useState(initialWidths)

  function startResize(index: number, startX: number) {
    const startWidth = widths[index]

    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - startX
      setWidths((prev) => {
        const next = [...prev]
        next[index] = Math.max(60, startWidth + delta)
        return next
      })
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return { widths, startResize }
}
