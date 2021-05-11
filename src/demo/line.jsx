import {useEffect, useRef} from 'react'
import Wave from '../wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'
import s from './demo.module.css'

const titleMapping = {
  default: '分组折线',
  stack: '堆叠折线',
  area: '面积',
  stackArea: '堆叠面积',
}

let groupedLineWave
let stackedLineWave
let areaWave
let stackAreaWave

export default function Line({data = [[]], type = 'column', theme}) {
  const groupedColumnRef = useRef(null)
  const stackedColumnRef = useRef(null)
  const intervalColumnRef = useRef(null)
  const waterfallRef = useRef(null)
 
  useEffect(() => {
    groupedLineWave = new Wave({container: groupedColumnRef.current, theme})
    stackedLineWave = new Wave({container: stackedColumnRef.current, theme})
    areaWave = new Wave({container: intervalColumnRef.current, theme})
    stackAreaWave = new Wave({container: waterfallRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: groupedLineWave, mode: 'default', data, type})
    updateWave({wave: stackedLineWave, mode: 'stack', data, type})
    updateWave({wave: areaWave, mode: 'area', data, type})
    updateWave({wave: stackAreaWave, mode: 'stackArea', data, type, area: true})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbw">
      <div className={s.wave} ref={groupedColumnRef} />
      <div className={s.wave} ref={stackedColumnRef} />
      <div className={s.wave} ref={intervalColumnRef} />
      <div className={s.wave} ref={waterfallRef} />
    </div>
  )
}

// 分组柱状图
const updateWave = ({wave, data, type, mode}) => {
  let tableList = new TableList(data)
  if (mode === 'waterfall') {
    tableList = new TableList(data).select(data[0].slice(0, 2))
    tableList.push(['总和', tableList.select(data[0][1], {mode: 'sum', target: 'column'}).range()[1]])
  }

  const axisScaleX = new Scale({
    type: 'point',
    domain: tableList.select(data[0][0]).data[0].list,
    range: type === 'line' ? [0, wave.layout.axisX.width] : [0, wave.layout.axisX.height],
  })
  const axisScaleY = new Scale({
    type: 'linear',
    domain: tableList.select(data[0].slice(1), {mode: (mode === 'stack' || mode === 'stackArea') && 'sum'}).range(),
    range: type === 'line' ? [wave.layout.axisY.height, 0] : [0, wave.layout.axisX.width],
    nice: {count: 5, zero: true},
  })

  // 标签轴图层
  const axisX = wave.layer[0]?.instance || wave.createLayer('axis')
  axisX.setLayout(type === 'line' ? wave.layout.axisX : wave.layout.axisY)
  axisX.setStyle({
    orient: type === 'line' ? 'bottom' : 'left',
    type: type === 'line' ? 'axisX' : 'axisY',
    label: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  axisX.setScale(axisScaleX)
  axisX.draw()

  // 数值轴图层
  const axisY = wave.layer[1]?.instance || wave.createLayer('axis')
  axisY.setLayout(type === 'line' ? wave.layout.axisY : wave.layout.axisX)
  axisY.setStyle({
    type: type === 'line' ? 'axisY' : 'axisX',
    orient: type === 'line' ? 'left' : 'bottom',
    tickLine: {
      opacity: 0.2,
    },
    label: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  axisY.setScale(axisScaleY)
  axisY.draw()

  // 标题图层
  const titleLayer = wave.layer[2]?.instance || wave.createLayer('text', {layout: wave.layout.title})
  titleLayer.setData(titleMapping[mode])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // line图层
  const lineLayer = wave.layer[3]?.instance || wave.createLayer('line', {mode: (mode === 'stackArea' ? 'stack' : mode), type, layout: wave.layout.main})
  lineLayer.setData(tableList.select(data[0].slice(0)))
  lineLayer.setStyle({
    labelPosition: 'top',
    hasArea: !!(mode === 'area' || mode === 'stackArea'),
    rect: {
      enableUpdateAnimation: true,
    },
    text: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
    point: {
      enableUpdateAnimation: true,
    },
  })
  lineLayer.draw()

  // 图例图层
  const legend = wave.layer[4]?.instance || wave.createLayer('legend', {layout: wave.layout.legend})
  legend.setData(tableList.data.map(({header}) => header).slice(1))
  legend.setStyle({
    align: 'end',
    verticalAlign: 'start',
    direction: 'horizontal', 
    pointSize: 8,
    gap: [5, 10],
    text: {
      fontSize: 12,
      textShadow: '',
    },
  })
  legend.draw()
}
