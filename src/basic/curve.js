import * as d3 from 'd3'

// 绘制一组曲线
export default function drawCurve({
  stroke = 'rgba(255,255,255,0)',
  strokeWidth = 1,
  opacity = 1,
  curve = false,
  enableUpdateAnimation = true,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  source = [], // 原始数据
  position = [], // 位置 [[[x,y], ...], ...]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const lineGenerator = d3.line().x(d => d[0]).y(d => d[1])
  curve && lineGenerator.curve(d3[curve])
  const configuredData = position.map((data, i) => ({
    fill: 'none',
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    strokeWidth,
    className,
    opacity,
    d: lineGenerator(data),
    source: source.length > i ? source[i] : null,
  }))

  return container.selectAll(`.${className}`)
    .data(configuredData.map(item => mapping(item)))
    .join('path')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('class', d => d.className)
    .attr('d', d => d.d)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
}
