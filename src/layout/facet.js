const getFacetLayout = (row, column) => ({containerWidth, containerHeight, padding}) => {
  const layout = {
    title: {
      top: 0,
      bottom: containerHeight,
      left: 0,
      right: containerWidth,
    },
    unit: {
      top: 0,
      bottom: containerHeight,
      left: 0,
      right: containerWidth,
    },
    legend: {
      top: 0,
      bottom: containerHeight,
      left: 0,
      right: containerWidth,
    },
    main: {
      top: padding[0],
      bottom: containerHeight - padding[2],
      left: padding[3],
      right: containerWidth - padding[1],
    },
  }
  const {top, bottom, left, right} = layout.main
  const facetWidth = (right - left) / column
  const facetHeight = (bottom - top) / row
  const rowGap = facetHeight / 20
  const columnGap = facetWidth / 20
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < column; j++) {
      layout[`facet${i * column + j}`] = {
        top: top + facetHeight * i + rowGap,
        bottom: top + facetHeight * (i + 1) - rowGap,
        left: left + facetWidth * j + columnGap,
        right: left + facetWidth * (j + 1) - columnGap,
      }
    }
  }
  Object.keys(layout).forEach(area => {
    layout[area].width = layout[area].right - layout[area].left
    layout[area].height = layout[area].bottom - layout[area].top
  })
  return layout
}

export default getFacetLayout
