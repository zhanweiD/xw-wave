// 计算布局信息
export default function getStandardLayout({containerWidth, containerHeight, padding}) {
  const layout = {
    title: {
      top: 0,
      bottom: containerHeight / 10,
      left: 0,
      right: containerWidth / 2,
    },
    unit: {
      top: containerHeight / 10,
      bottom: containerHeight / 5,
      left: 0,
      right: containerWidth / 2,
    },
    legend: {
      top: 0,
      bottom: containerHeight / 5,
      left: containerWidth / 2,
      right: containerWidth,
    },
    main: {
      top: containerHeight / 5 + padding[0],
      bottom: containerHeight - padding[2],
      left: padding[3],
      right: containerWidth - padding[1],
    },
    axisX: {
      top: containerHeight / 5 + padding[0],
      bottom: containerHeight - padding[2],
      left: padding[3],
      right: containerWidth - padding[1],  
    },
    axisY: {
      top: containerHeight / 5 + padding[0],
      bottom: containerHeight - padding[2],
      left: 0,
      right: containerWidth,  
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
