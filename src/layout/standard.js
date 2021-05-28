// 计算布局信息
function getStandardLayout({containerWidth, containerHeight, padding, brush = false}) {
  const brushHeight = brush ? containerHeight / 10 : 0
  const heightWithoutBrush = containerHeight - brushHeight
  const layout = {
    title: {
      top: 0,
      bottom: heightWithoutBrush,
      left: 0,
      right: containerWidth,
    },
    unit: {
      top: 0,
      bottom: heightWithoutBrush,
      left: 0,
      right: containerWidth,
    },
    legend: {
      top: 0,
      bottom: heightWithoutBrush,
      left: 0,
      right: containerWidth,
    },
    main: {
      top: padding[0],
      bottom: heightWithoutBrush - padding[2],
      left: padding[3],
      right: containerWidth - padding[1],
    },
    axisX: {
      top: padding[0],
      bottom: heightWithoutBrush - padding[2],
      left: padding[3],
      right: containerWidth - padding[1],
    },
    axisY: {
      top: padding[0],
      bottom: heightWithoutBrush - padding[2],
      left: 0,
      right: containerWidth,  
    },
    brush: {
      top: heightWithoutBrush,
      bottom: containerHeight,
      left: padding[3],
      right: containerWidth - padding[1],
    },
  }
  // 计算衍生数据
  Object.keys(layout).forEach(area => {
    const {top, bottom, left, right} = layout[area]
    layout[area].width = right - left
    layout[area].height = bottom - top
  })
  return layout
}

// 默认不带笔刷（临时写法）
export default function getStandardLayoutWithoutBrush(options) {
  return getStandardLayout({...options, brush: false})
}

// 带笔刷（临时写法）
export function getStandardLayoutWithBrush(options) {
  return getStandardLayout({...options, brush: true})
}
