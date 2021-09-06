const getStandardLayout = brush => ({containerWidth, containerHeight, padding}) => {
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
    brush: {
      top: heightWithoutBrush,
      bottom: containerHeight,
      left: padding[3],
      right: containerWidth - padding[1],
    },
  }
  Object.keys(layout).forEach(area => {
    const {top, bottom, left, right} = layout[area]
    layout[area].width = right - left
    layout[area].height = bottom - top
  })
  return layout
}

export default getStandardLayout
