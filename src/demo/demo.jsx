import {Children, useRef, useEffect, useState} from 'react'
import c from 'classnames'
import {range} from 'd3'
import ThemeConfig from '../util/theme'
import columnSchema from './column'
import pieSchema from './pie'
import radarSchema from './radar'
import scatterSchema from './scatter'
import matrixSchema from './matrix'
import gaugeSchema from './gauge'
import lineSchema from './line'
import chordSchema from './chord'
import sankeySchema from './sankey'
import treeSchema from './tree'
import columnFacetSchema from './column-facet'
import {createWave} from '../parser'
import s from './demo.module.css'

const themeMapping = {
  fairyLand: '梦幻岛',
  emeraldGreen: '冷翡翠',
  duskUniverse: '黄昏宇宙',
  glaze: '琉璃盏',
  exquisite: '玲珑伞',
}

const chartMapping = {
  column: '柱状图',
  bar: '条形图',
  line: '折线图',
  pie: '饼图',
  radar: '雷达图',
  scatter: '点图',
  matrix: '矩阵图',
  gauge: '仪表盘',
  relation: '关系图',
  tree: '树图',
  facet: '分面图',
}

export default function Example() {
  const [theme, setTheme] = useState('fairyLand')
  const [chart, setChart] = useState('facet')
  const containerStyle = {background: ThemeConfig[theme].background}
  const refs = range(1, 100, 1).map(() => useRef(null))

  useEffect(() => {
    const waves = []
    const themeColors = ThemeConfig[theme].colors
    // 柱状图和条形图
    waves.push(chart === 'column' && createWave(columnSchema.groupColumn(refs[1].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.stackColumn(refs[2].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.intervalColumn(refs[3].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.waterfallColumn(refs[4].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.groupLineColumn(refs[29].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.stackLineColumn(refs[30].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.groupBar(refs[5].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.stackBar(refs[6].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.intervalBar(refs[7].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.waterfallBar(refs[8].current, themeColors)))
    // 饼图类
    waves.push(chart === 'pie' && createWave(pieSchema.pie(refs[9].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.donut(refs[10].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.nightingaleRose(refs[11].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.donutNightingaleRose(refs[12].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.stackNightingaleRose(refs[13].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.stackDonutNightingaleRose(refs[14].current, themeColors)))
    // 雷达图类
    waves.push(chart === 'radar' && createWave(radarSchema.radar(refs[15].current, themeColors)))
    waves.push(chart === 'radar' && createWave(radarSchema.stackRadar(refs[16].current, themeColors)))
    // 点图类
    waves.push(chart === 'scatter' && createWave(scatterSchema.scatter(refs[17].current, themeColors)))
    waves.push(chart === 'scatter' && createWave(scatterSchema.bubble(refs[18].current, themeColors)))
    // 热力图类
    waves.push(chart === 'matrix' && createWave(matrixSchema.rectHeatmap(refs[19].current, themeColors)))
    waves.push(chart === 'matrix' && createWave(matrixSchema.circleHeatmap(refs[20].current, themeColors)))
    // 仪表盘
    waves.push(chart === 'gauge' && createWave(gaugeSchema.gauge(refs[21].current, themeColors)))
    waves.push(chart === 'gauge' && createWave(gaugeSchema.indicator(refs[28].current, themeColors)))
    // 折线类
    waves.push(chart === 'line' && createWave(lineSchema.line(refs[22].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.stackLine(refs[23].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.area(refs[24].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.stackArea(refs[25].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.step(refs[26].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.stepArea(refs[27].current, themeColors)))
    // 关系图类
    waves.push(chart === 'relation' && createWave(chordSchema.edgeBundle(refs[31].current, themeColors)))
    waves.push(chart === 'relation' && createWave(chordSchema.chord(refs[32].current, themeColors)))
    waves.push(chart === 'relation' && createWave(sankeySchema.sankey(refs[33].current, themeColors)))
    // 树图类
    waves.push(chart === 'tree' && createWave(treeSchema.horizontalTree(refs[34].current, themeColors)))
    waves.push(chart === 'tree' && createWave(treeSchema.verticalTree(refs[35].current, themeColors)))
    // 分面图
    waves.push(chart === 'facet' && createWave(columnFacetSchema.facet1(refs[36].current, themeColors)))
  }, [theme, chart])

  return (
    <div className={c('fbv fb1', s.container)} style={containerStyle}>
      <div className="fbh fb1">
        <div className={s.activeText}>主题</div>
        {Object.keys(themeMapping).map(name => Children.toArray(
          <div className={c('hand', s.text, name === theme ? s.activeText : s.inactiveText)} onClick={() => setTheme(name)}>
            {themeMapping[name]}
          </div>
        ))}
      </div>
      <div className="fbh fb1">
        <div className={s.activeText}>图表</div>
        {Object.keys(chartMapping).map(name => Children.toArray(
          <div className={c('hand', s.text, name === chart ? s.activeText : s.inactiveText)} onClick={() => setChart(name)}>
            {chartMapping[name]}
          </div>
        ))}
      </div>
      <div className="fbh fb10">
        <div className="fbh fb1 fbw">
          {chart === 'column' && <div className={s.wave} ref={refs[1]} /> }
          {chart === 'column' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[29]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[30]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[6]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[7]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[8]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[9]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[10]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[11]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[12]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[13]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[14]} />}
          {chart === 'radar' && <div className={s.wave} ref={refs[15]} />}
          {chart === 'radar' && <div className={s.wave} ref={refs[16]} />}
          {chart === 'scatter' && <div className={s.wave} ref={refs[17]} />}
          {chart === 'scatter' && <div className={s.wave} ref={refs[18]} />}
          {chart === 'matrix' && <div className={s.wave} ref={refs[19]} />}
          {chart === 'matrix' && <div className={s.wave} ref={refs[20]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[21]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[28]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[22]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[23]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[24]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[25]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[26]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[27]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[31]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[32]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[33]} />}
          {chart === 'tree' && <div className={s.wave} ref={refs[34]} />}
          {chart === 'tree' && <div className={s.wave} ref={refs[35]} />}
          {chart === 'facet' && <div className={s.wave} ref={refs[36]} />}
        </div>
      </div>
    </div>
  )
}
