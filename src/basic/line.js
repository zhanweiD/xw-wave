// v4基础函数——画直线
export default function drawLine({
  stroke = 'rgba(255,255,255,1)',
  strokeWidth = 1,
  opacity = 0.5,
  dasharray = '0',
  enableUpdateAnimation = false,
  updateAnimationDuration = 1000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  position = [], // 位置 [[x1,y1,x2,y2], ...]
  container,
  className,
}) {
  const configuredData = position.map((data, i) => ({
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    strokeWidth,
    className,
    strokeDasharray: dasharray,
    opacity,
    x1: data[0],
    y1: data[1],
    x2: data[2],
    y2: data[3],
    source: source.length > i ? source[i] : null,
  }))

  // 画线
  return container.selectAll(`.${className}`)
    .data(configuredData)
    .join('line')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('class', d => d.className)
    .attr('stroke-dasharray', d => d.strokeDasharray)
    .attr('opacity', d => d.opacity)
    .attr('x1', d => d.x1)
    .attr('y1', d => d.y1)
    .attr('x2', d => d.x2)
    .attr('y2', d => d.y2)
    .style('pointer-events', 'none')
}
