// 图层 Base，目前是一个函数架子，未来会引入更多公共方法
export default class LayerBase {
  constructor(layerOptions, waveOptions) {
    this.options = {...layerOptions, ...waveOptions}
    this.className = 'wave-layer'
  }

  // 显式传递布局信息
  setLayout() {
    console.warn('此图层的 setLayout 函数未重写')
  }

  // 数据处理
  setData() {
    console.warn('此图层的 setData 函数未重写')
  }

  // 局部比例尺
  setScale() {
    console.warn('此图层的 setScale 函数未重写')
  }

  // 样式处理
  setStyle() {
    console.warn('此图层的 setStyle 函数未重写')
  }

  // 图层绘制
  draw() {
    console.warn('此图层的 draw 函数未重写')
  }

  // tooltip 展示
  tooltip() {
    console.warn('此图层的 tooltip 函数未重写')
  }

  // 配置动画
  animation() {
    console.warn('此图层的 animation 函数未重写')
  }

  // 事件配置
  event() {
    console.warn('此图层的 event 函数未重写')
  }

  // 销毁图层
  destroy() {
    this.options.root.selectAll(`.${this.className}`).remove()
    console.warn('此图层的 destroy 函数未重写')
  }

  // 控制整个图表的显示隐藏
  setVisiable(isVisiable) {
    this._root.selectAll(`.${this.className}`).attr('opacity', isVisiable ? 1 : 0)
  }
}
