import Layout from '../layout'

// 柱状图配置数据生成
const createSchema = (container, theme, layout, mode, hasArea, curve) => ({
  // 容器
  container,
  // 颜色主题
  theme,
  // 图表适应容器的方式
  adjust: 'auto',
  // 容器宽，自适应为 auto 时无效
  width: 100,
  // 容器高，自适应为 auto 时无效
  height: 100,
  // 主绘图图层的内边距
  padding: [60, 40, 40, 40],
  // 这个 layout 应该是一个生成函数
  layout,
  // 声明坐标系
  coordinate: 'cartesian-point-linear',
  // 提示
  tooltip: {
    mode: 'group',
  },
  // 图层数据，下标顺序代表绘制顺序
  layers: [
    // 标题文字图层
    {
      type: 'text',
      options: {
        id: 'title',
        layout: 'title',
      },
      data: `${mode === 'stack' ? '堆叠' : ''}${hasArea ? '面积' : '折线'}图`,
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
        zero: mode === 'stack' || hasArea,
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
        mode,
        fallback: 'break',
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
          strokeWidth: 2,
          curve,
        },
        area: {
          hide: !hasArea,
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
  ],
})

export default {
  line: (container, theme) => createSchema(container, theme, Layout.standard(true), 'default', false, false),
  stackLine: (container, theme) => createSchema(container, theme, Layout.standard(true), 'stack', false, false),
  area: (container, theme) => createSchema(container, theme, Layout.standard(true), 'default', true, 'curveMonotoneX'),
  stackArea: (container, theme) => createSchema(container, theme, Layout.standard(true), 'stack', true, 'curveMonotoneX'),
  step: (container, theme) => createSchema(container, theme, Layout.standard(true), 'stack', false, 'curveStep'),
  stepArea: (container, theme) => createSchema(container, theme, Layout.standard(true), 'stack', true, 'curveStep'),
}
