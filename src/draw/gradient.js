import * as d3 from 'd3'

export default function drawGradient({
  container,
  gradientColor,
  id,
}) {
  const defs = container.append('defs')
  const linerGradient = defs.append('linearGradient')
    .attr('id', id)
    .attr('x1', '0%')
    .attr('y1', '100%')
    .attr('x2', '0%')
    .attr('y2', '0%')
  gradientColor.forEach((item, i) => {
    const color = item[0]
      .replace(/rgba\(/i, '')
      .replace(/rgb\(/i, '')
      .replace(')', '')
      .split(',')
    const inspectColor = item[0].search(/rgb/i) === 0 && color.length > 2
      ? color.map(Number)
      : [0, 0, 0, 1]
    // 定义渐变色带，可以参考SVG的定义
    const a = d3.rgb(inspectColor[0], inspectColor[1], inspectColor[2], inspectColor[3])
    linerGradient.append('stop')
      .attr('offset', `${(100 / (gradientColor.length - 1)) * i}%`)
      .style('stop-color', a.toString())
  })
}
