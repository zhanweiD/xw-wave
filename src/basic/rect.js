// 绘制一组矩形
export default function drawText({
  fill = 'rgba(255,255,255,1)', // 可以是数组定义渐变色
  stroke = 'rgba(255,255,255,0)', // 可以是数组定义渐变色
  strokeWidth = 0,
  opacity = 1,
  rectAnchor = 'left-top', // 元素锚点 ['left-top', 'left-bottom', 'right-top', 'right-bottom', 'middle]
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
    const realPositon = computePosition(size, position[i], rectAnchor)
    return {
      className,
      x: realPositon[0],
      y: realPositon[1],
      width,
      height,
      opacity,
      fill: Array.isArray(fill) ? fill[i] : fill,
      stroke: Array.isArray(stroke) ? stroke[i] : stroke,
      strokeWidth,
      source: source.length > i ? source[i] : null,
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
    .attr('opacity', d => d.opacity)
    .attr('fill', d => d.fill)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)

  return rects
}

const computePosition = (size, position, rectAnchor) => {
  const [width, height] = size
  const [x, y] = position
  let result = [x, y]

  if (rectAnchor === 'middle') {
    result = [x - width / 2, y - width / 2]
  } else if (rectAnchor === 'left-top') {
    result = [x, y]
  } else if (rectAnchor === 'left-bottom') {
    result = [x, y - height]
  } else if (rectAnchor === 'right-top') {
    result = [x - width, y]
  } else if (rectAnchor === 'right-bottom') {
    result = [x - width, y - height]
  }

  return result
}
