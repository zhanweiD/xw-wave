import Wave, {createWave} from './wave'
import Data from './data'
import Layer from './layer'
import Animation from './animation'
import Layout from './layout'
import draw from './draw'

export default Wave
export {
  Data, // 数据处理类的集合
  Layer, // 图层类的集合
  Animation, // 动画类的集合
  Layout, // 图表布局函数集合
  draw, // 基础元素绘制函数集合
  createWave, // 根据 schema 创建图表实例
}
