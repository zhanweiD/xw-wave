// 绘制线性渐变色板
import * as d3 from 'd3'

export default function drawGradient({
  container,
  gradientColor,
  id,
  direction,
}) {
  const defs = container.append('defs')
  // 径向渐变
  // const radialGradient = defs.append('radialGradient')
  //   .attr('id', id)
  //   .attr('cx', '50%')
  //   .attr('cy', '50%')
  //   .attr('r', '50%')
  //   .attr('fx', '50%')
  //   .attr('fx', '50%')
  // 控制渐变方向，后续需要扩展支持自定义
  const linerGradient = defs.append('linearGradient')
    .attr('id', id)
    .attr('x1', '0%')
    .attr('y1', direction === 'toY' ? '100%' : '0%')
    .attr('x2', direction === 'toX' ? '100%' : '0%')
    .attr('y2', '0%')
  gradientColor.reverse().forEach(item => {
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
      // .attr('offset', `${(100 / (gradientColor.length - 1)) * i}%`)
      .attr('offset', `${(1 - item[1]) * 100}%`)
      .style('stop-color', a.toString())
  })
}
