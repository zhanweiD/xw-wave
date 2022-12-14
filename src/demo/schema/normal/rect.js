export default ({type, mode}) => `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '柱状图',
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
      },
    },
  },
  // 辅助线图层
  {
    type: 'auxiliary',
    options: {
      id: 'auxiliary',
      layout: 'main',
      type: '${type === 'column' ? 'horizontal' : 'vertical'}',
      bind: 'axis',
    },
    data: [
      ['标签', '数值'],
      ['最大值', 300],
      ['最小值', 600],
    ],
    style: {
      labelPosition: 'right',
      line: {
        stroke: 'yellow',
        strokeWidth: 2,
        dasharray: '10 5',
      },
      text: {
        fill: 'yellow',
        fontSize: 8,
      },
    },
  },
  // 直角坐标组合
  {
    type: 'axis',
    options: {
      id: 'axis',
      layout: 'main',
      type: 'cartesian',
    },
    data: {
      titleX: 'titleX',
      titleY: 'titleY',
      titleYR: 'titleYR',
    },
    scale: {
      count: 5,
      zero: true,
      paddingInner: 0.382,
      // fixedPaddingInner: 10,
      // fixedBandwidth: 30,
      // fixedBoundary: 'start',
    },
    style: {},
  },
  // 矩形图层
  {
    type: 'rect',
    options: {
      id: 'rect',
      layout: 'main',
      // 声明使用主轴还是副轴，不声明则表示不画坐标轴
      axis: 'main', // minor
      mode: '${mode}',
      type: '${type}',
    },
    data: {
      type: 'tableList',
      mode: 'normal',
      row: 6,
      column: 3,
      mu: 500,
      sigma: 200,
      decimalPlace: 1,
    },
    style: {
      labelPosition: '${mode === 'group' ? (type === 'column' ? 'top-outer' : 'right-outer') : 'center'}',
      rect: {
        // fill: ['red', 'green'],
        mapping: elData => {
          if (elData.source.value > 900) {
            elData.fill = 'gray'
          }
          return elData
        },
      },
      background: {
        fill: 'gray',
        fillOpacity: 0.3,
      },
      text: {
        fontSize: 10,
        format: {
          decimalPlace: 2,
        },
      },
    },
    animation: {
    },
    event: {
      'click-rect': d => console.log(d),
    },
  },
]`
