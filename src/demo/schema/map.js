export default `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '二维地图',
    style: {
      text: {
        fontSize: 16,
      },
    },
  },
  // 多图层联动必须引入坐标轴层，单个使用则不需要
  {
    type: 'axis',
    options: {
      id: 'axis',
      layout: 'main',
      type: 'geographic',
    },
    style: {},
  },
  // 地图底图
  {
    type: 'baseMap',
    options: {
      id: 'baseMap',
      layout: 'main',
    },
    data: 100000,
    style: {
      block: {
        fill: 'skyblue',
      },
      text: {
        shadow: {
          blur: 4,
        },
      },
    },
    event: {
      'click-block': d => console.log(d),
    },
  },
  // 热力
  {
    type: 'heatmap',
    options: {
      id: 'heatmap',
      layout: 'main',
    },
    data: [
      ['x', 'y', 'value'],
      [100, 30, 100],
      [115, 25, 200],
      [120, 20, 300],
      [110, 35, 400],
      [110, 25, 500],
    ],
    style: {},
  },
  // 飞线抛物线
  {
    type: 'odLine',
    options: {
      id: 'odLine',
      layout: 'main',
    },
    data: [
      ['fromX', 'fromY', 'toX', 'toY'],
      [120, 30, 90, 45],
    ],
    style: {
      odLine: {
        stroke: 'yellow',
      },
      flyingObject: {
        fill: 'yellow',
        path: 'm-16.113639,0.075168c0,29.080622 37.728806,0 37.224786,-0.075171c0.50402,0.075171 -37.224786,-29.005451 -37.224786,0.075171z',
      },
    },
  },
  // 注意散点数据为经纬度
  {
    type: 'scatter',
    options: {
      id: 'scatter',
      layout: 'main',
      axis: 'main',
    },
    data: [
      ['category', 'x', 'y'],
      ['沈阳', 123.429092, 41.796768],
      ['杭州', 120.15358, 30.287458],
      ['北京', 116.405289, 39.904987],
      ['上海', 121.472641, 31.231707],
    ],
    style: {
      circleSize: [10, 10],
      text: {
        hide: true,
        fontSize: 10,
      },
    },
    animation: {
      circle: {
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
      'click-circle': d => console.log(d),
    },
  },
]`
