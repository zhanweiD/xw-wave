const ctx = document.createElement('canvas').getContext('2d')
const STYLE = {FONT_FAMILY: "'PingFang SC', 'Helvetica Neue', Helvetica, Tahoma, Helvetica, sans-serif"}

export default function getTextWidth(text, size) {
  ctx.font = `${size}px ${STYLE.FONT_FAMILY}`
  return ctx.measureText(text).width
}
