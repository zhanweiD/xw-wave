import {createTableListData} from './mock'
import createStandardLayout from '../layout/standard'

const data = createTableListData()
const titleMapping = {
  group: '分组图',
  stack: '堆叠图',
  interval: '区间图',
  waterfall: '瀑布图',
}

// 柱状图配置数据生成
const createSchema = (container, theme, layout, type, mode) => ({
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
  padding: [0, 50, 30, 50],
  // 这个 layout 应该是一个生成函数
  layout,

  // 图层数据，下标顺序代表绘制顺序
  layers: [
    // 标题文字图层
    {
      type: 'text',
      options: {
        id: 'title',
        layout: 'title',
      },
      data: titleMapping[mode],
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
      data: data[0].slice(1),
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
        direction: type === 'bar' ? 'vertical' : 'horizontal',
        bind: 'rect',
      },
      data: [300, 600],
      style: {
        labelPosition: type === 'bar' ? 'top' : 'right',
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
    // X坐标轴图层
    {
      type: 'axis',
      options: {
        id: 'axisX',
        layout: 'axisX',
        bind: 'rect',
      },
      style: {
        orient: 'bottom',
        type: 'axisX',
        label: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
    },
    // Y坐标轴图层
    {
      type: 'axis',
      options: {
        id: 'axisY',
        layout: 'axisY',
        bind: 'rect',
      },
      style: {
        orient: 'left',
        type: 'axisY',
        tickLine: {
          opacity: 0.2,
        },
        label: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
    },
    // 矩形图层
    {
      type: 'rect',
      options: {
        id: 'rect',
        layout: 'main',
        type,
        mode,
      },
      data,
      style: {
        labelPosition: type === 'bar' 
          ? ['left-outer', mode === 'stack' || mode === 'waterfall' ? 'center' : 'right-outer'] 
          : ['bottom-outer', mode === 'stack' || mode === 'waterfall' ? 'center' : 'top-outer'],
        rect: {
          enableUpdateAnimation: true,
        },
        text: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
      animation: {
        rect: {
          enterAnimation: {
            type: 'zoom',
            delay: 0,
            duration: 2000,
            mode: 'enlarge',
            direction: 'both',
          },
          loopAnimation: {
            type: 'scan',
            delay: 2000,
            duration: 3000,
            color: 'rgba(255,255,255,0.5)',
            direction: type === 'bar' ? 'right' : 'top',
          },
        },
        text: {
          enterAnimation: {
            type: 'fade',
            delay: 2000,
            duration: 1000,
            mode: 'fadeIn',
          },
        },
      },
      tooltip: {
        mode: 'group',
        targets: ['rect'],
      },
      event: {
        'click-rect': d => console.log(d),
      },
    },
  ],
})

export default {
  groupColumn: (container, theme) => createSchema(container, theme, createStandardLayout, 'column', 'group'),
  stackColumn: (container, theme) => createSchema(container, theme, createStandardLayout, 'column', 'stack'),
  intervalColumn: (container, theme) => createSchema(container, theme, createStandardLayout, 'column', 'interval'),
  waterfallColumn: (container, theme) => createSchema(container, theme, createStandardLayout, 'column', 'waterfall'),
  groupBar: (container, theme) => createSchema(container, theme, createStandardLayout, 'bar', 'group'),
  stackBar: (container, theme) => createSchema(container, theme, createStandardLayout, 'bar', 'stack'),
  intervalBar: (container, theme) => createSchema(container, theme, createStandardLayout, 'bar', 'interval'),
  waterfallBar: (container, theme) => createSchema(container, theme, createStandardLayout, 'bar', 'waterfall'),
}
