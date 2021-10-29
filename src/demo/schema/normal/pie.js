export default ({type, mode, innerRadius}) => `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '饼图',
    style: {
      text: {
        fontSize: 16,
      },
    },
  },
  // 图例图层
  {
    type: 'legend',
    options: {
      id: 'legend',
      layout: 'legend',
    },
    style: {
      align: 'end',
      verticalAlign: 'start',
      direction: 'horizontal',
      pointSize: 8,
      gap: [5, 10],
      text: {
        fontSize: 12,
        // fill: 'red',
      },
    },
  },
  // 极坐标组合
  {
    type: 'axis',
    options: {
      id: 'axis',
      layout: 'main',
      type: 'polar',
    },
    scale: {
      count: 5,
      zero: false,
    },
    style: {},
  },
  // 圆弧图层
  {
    type: 'arc',
    options: {
      id: 'arc',
      layout: 'main',
      type: '${type}',
      mode: '${mode}',
    },
    data: {
      type: 'tableList',
      mode: 'normal',
      row: 6,
      column: ${mode === 'stack' ? 2 : 1},
      mu: 500,
      sigma: 200,
      decimalPlace: 1,
    },
    style: {
      labelPosition: 'outer', // or 'inner'
      innerRadius: ${innerRadius},
      text: {
        fontSize: 8,
        hide: false,
      },
    },
    animation: {
      arc: {
        enter: {
          type: 'zoom',
          delay: 0,
          duration: 2000,
          mode: 'enlarge',
          direction: 'both',
        },
      },
      text: {
        enter: {
          type: 'fade',
          delay: 2000,
          duration: 1000,
          mode: 'fadeIn',
        },
      },
    },
    event: {
      'click-arc': d => console.log(d),
    },
  },
]`
