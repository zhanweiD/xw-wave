export default ({mode, hasArea, curve}) => `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '折线图',
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
  // 辅助线图层
  {
    type: 'auxiliary',
    options: {
      id: 'auxiliary',
      layout: 'main',
      type: 'horizontal',
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
    scale: {
      count: 5,
      zero: false,
    },
    style: {},
  },
  // 折线图层
  {
    type: 'line',
    options: {
      id: 'line',
      layout: 'main',
      axis: 'main',
      fallback: 'break',
      mode: '${mode}',
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
      labelPosition: 'top',
      curve: {
        curve: '${curve}',
        strokeWidth: 2,
      },
      area: {
        hide: ${hasArea ? 'false' : 'true'},
        fillOpacity: 0.5,
      },
      text: {
        fontSize: 10,
      },
      point: {},
    },
    animation: {
      curve: {
        enter: {
          type: 'erase',
          delay: 0,
          duration: 2000,
        },
        loop: {
          type: 'scan',
          delay: 2000,
          duration: 3000,
          color: 'rgb(255,255,255)',
          direction: 'right',
          scope: 'stroke',
        },
      },
      area: {
        enter: {
          type: 'erase',
          delay: 0,
          duration: 2000,
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
      'click-circle': d => console.log(d),
    },
  },
]`
