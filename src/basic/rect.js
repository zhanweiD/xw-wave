// 绘制一组矩形
export default function drawText({
  fill = 'rgba(255,255,255,1)', // 可以是数组定义渐变色
  stroke = 'rgba(255,255,255,0)', // 可以是数组定义渐变色
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  rotate = 0, // 旋转
  transformOrigin = null, // 影响动画和旋转
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  data = [], // 矩形宽高数据
  position = [], // 直角坐标系坐标数据
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((size, i) => {
    const [width, height] = size
    const realPositon = position[i]
    return {
      className,
      x: realPositon[0],
      y: realPositon[1],
      width,
      height,
      opacity,
      fillOpacity,
      strokeOpacity,
      fill: Array.isArray(fill) ? fill[i] : fill,
      stroke: Array.isArray(stroke) ? stroke[i] : stroke,
      strokeWidth,
      source: source.length > i ? source[i] : null,
      rotate,
    }
  })

  const rects = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('rect')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('class', d => d.className)
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('width', d => d.width)
    .attr('height', d => d.height)
    .attr('fill', d => d.fill)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('fill-opacity', d => d.fillOpacity)
    .attr('stroke-opacity', d => d.strokeOpacity)
    .attr('transform', d => `rotate(${d.rotate})`)
    .attr('transform-origin', () => transformOrigin && `${transformOrigin[0]} ${transformOrigin[1]}`)

  return rects
}
