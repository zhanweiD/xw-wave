export default () => `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '和弦图',
    style: {
      text: {
        fontSize: 16,
      },
    },
  },
  {
    type: 'chord',
    options: {
      id: 'chord',
      layout: 'main',
    },
    data: {
      type: 'table',
      mode: 'poisson',
      row: 10,
      column: 10,
      lambda: 40,
      mu: 1000,
      sigma: 400,
      decimalPlace: 1,
    },
    style: {
      labelOffset: 10,
      text: {
        fontSize: 12,
      },
      line: {
        curve: 'curveBasis',
      },
    },
  },
]`
