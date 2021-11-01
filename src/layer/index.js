// 通用图层
import Axis from './axis'
import Legend from './legend'
// 基础图层
import Text from './normal/text'
import Rect from './normal/rect'
import Arc from './normal/arc'
import Line from './normal/line'
import Radar from './normal/radar'
import Auxiliary from './normal/auxiliary'
import Scatter from './normal/scatter'
import Matrix from './normal/matrix'
import Dashboard from './normal/dashboard'
// 表单图层
import Indicator from './form-control/indicator'
import TabButton from './form-control/tab-button'
import TabMenu from './form-control/tab-menu'
import Timeline from './form-control/timeline'
import DigitalFlop from './form-control/digital-flop'
// 关系图层
import EdgeBundle from './relation/edge-bundle'
import Chord from './relation/chord'
import Sankey from './relation/sankey'
import Tree from './relation/tree'
import Treemap from './relation/treemap'
import Pack from './relation/pack'
// 地理图层
import BaseMap from './geography/base-map'
import ODLine from './geography/od-line'
import Heatmap from './geography/heatmap'
// 装饰图层
import TitleA from './decoration/title-a'
import TitleB from './decoration/title-b'
import TitleC from './decoration/title-c'
import TitleD from './decoration/title-d'
import TitleE from './decoration/title-e'
import BorderA from './decoration/border-a'

export const layerMapping = {
  arc: Arc, // 圆弧
  auxiliary: Auxiliary, // 辅助线
  axis: Axis, // 坐标轴
  baseMap: BaseMap, // 地图底图
  chord: Chord, // 和弦图
  digitalFlop: DigitalFlop, // 数字翻牌器
  edgeBundle: EdgeBundle, // 边缘捆图
  dashboard: Dashboard, // 仪表盘
  heatmap: Heatmap, // 热力
  indicator: Indicator, // 指标卡
  legend: Legend, // 图例
  line: Line, // 折线
  matrix: Matrix, // 矩阵
  odLine: ODLine, // 抛物线
  pack: Pack, // 打包图
  radar: Radar, // 雷达
  rect: Rect, // 矩形
  sankey: Sankey, // 桑基
  scatter: Scatter, // 散点
  tabButton: TabButton, // 切换按钮
  tabMenu: TabMenu, // 切换级联菜单
  text: Text, // 文本
  tree: Tree, // 树形图
  treemap: Treemap, // 矩形树图
  timeline: Timeline, // 时间线
  titleA: TitleA, // 标题装饰
  titleB: TitleB, // 标题装饰
  titleC: TitleC, // 标题装饰
  titleD: TitleD, // 标题装饰
  titleE: TitleE, // 标题装饰
  borderA: BorderA, // 边框装饰
}

export default {
  Arc,
  Auxiliary,
  Axis,
  BaseMap,
  Chord,
  DigitalFlop,
  EdgeBundle,
  Dashboard,
  Indicator,
  Heatmap,
  Legend,
  Line,
  Matrix,
  ODLine,
  Pack,
  Radar,
  Rect,
  Sankey,
  Scatter,
  TabButton,
  TabMenu,
  Text,
  Tree,
  Treemap,
  Timeline,
  TitleA,
  TitleB,
  TitleC,
  TitleD,
  TitleE,
  BorderA,
}
