import {createTableListData} from './mock'
import createStandardLayout from '../layout/standard'

const data = createTableListData()

// 柱状图配置数据生成
const createSchema = (container, theme, layout, mode, hasArea) => ({
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
        direction: 'horizontal',
        bind: 'line',
      },
      data: [300, 600],
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
    // X坐标轴图层
    {
      type: 'axis',
      options: {
        id: 'axisX',
        layout: 'axisX',
        bind: 'line',
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
        bind: 'line',
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
    // 折线图层
    {
      type: 'line',
      options: {
        id: 'line',
        layout: 'main',
        mode,
      },
      data,
      style: {
        labelPosition: 'top',
        line: {
          strokeWidth: 2,
        },
        area: {
          hide: !hasArea,
          opacity: 0.2,
        },
        text: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
        point: {
          enableUpdateAnimation: true,
        },
      },
      animation: {
        line: {
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
            direction: 'right',
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
        targets: ['circle'],
      },
      event: {
        'click-circle': d => console.log(d),
      },
    },
  ],
})

export default {
  line: (container, theme) => createSchema(container, theme, createStandardLayout, 'default', false),
  stackLine: (container, theme) => createSchema(container, theme, createStandardLayout, 'stack', false),
  area: (container, theme) => createSchema(container, theme, createStandardLayout, 'default', true),
  stackArea: (container, theme) => createSchema(container, theme, createStandardLayout, 'stack', true),
}