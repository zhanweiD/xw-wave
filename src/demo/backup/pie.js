import Layout from '../../layout'

const titleMapping = {
  pie: ['饼图', '环图'],
  nightingaleRose: ['蓝丁格尔玫瑰图', '环形蓝丁格尔玫瑰图'],
}

// 柱状图配置数据生成
const createSchema = (container, theme, layout, type, mode, donut) => ({
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
  // 坐标系声明
  coordinate: 'polar-band-linear',
  // 分组展示
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
      data: `${mode === 'stack' ? '堆叠' : ''}${donut ? titleMapping[type][1] : titleMapping[type][0]}`,
      style: {
        text: {
          fontSize: 16,
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
      style: {
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
    // 弧形图层
    {
      type: 'arc',
      options: {
        id: 'arc',
        layout: 'main',
        type,
        mode,
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
        labelPosition: type === 'nightingaleRose' ? 'outer' : 'inner',
        innerRadius: donut ? 20 : 0,
        text: {
          fontSize: 8,
          hide: mode === 'stack',
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
  ],
})

export default {
  pie: (container, theme) => createSchema(container, theme, Layout.standard(false), 'pie', 'default', false),
  donut: (container, theme) => createSchema(container, theme, Layout.standard(false), 'pie', 'default', true),
  nightingaleRose: (container, theme) => createSchema(container, theme, Layout.standard(false), 'nightingaleRose', 'default', false),
  donutNightingaleRose: (container, theme) => createSchema(container, theme, Layout.standard(false), 'nightingaleRose', 'default', true),
  stackNightingaleRose: (container, theme) => createSchema(container, theme, Layout.standard(false), 'nightingaleRose', 'stack', false),
  stackDonutNightingaleRose: (container, theme) => createSchema(container, theme, Layout.standard(false), 'nightingaleRose', 'stack', true),
}
