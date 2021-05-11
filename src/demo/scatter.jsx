import {useEffect, useRef} from 'react'
import Wave from '../wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'
import s from './demo.module.css'

const titleMapping = {
  scatter: '散点图',
  bubble: '气泡图',
}

let scatterWave
let bubbleWave
let drawCount = 0

export default function Scatter({data = [[]], theme}) {
  const scatterRef = useRef(null)
  const bubbleRef = useRef(null)
 
  useEffect(() => {
    scatterWave = new Wave({container: scatterRef.current, theme})
    bubbleWave = new Wave({container: bubbleRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: scatterWave, mode: 'scatter', data})
    updateWave({wave: bubbleWave, mode: 'bubble', data})
  }, [data, theme])
  
  return (
    <div className="fbh fb1 fbw">
      <div className={s.wave} ref={scatterRef} />
      <div className={s.wave} ref={bubbleRef} />
    </div>
  )
}

// 点图
const updateWave = ({wave, data, mode}) => {
  const tableList = new TableList(data)
  const headers = tableList.data.map(({header}) => header)

  const axisScaleX = new Scale({
    type: 'linear',
    domain: tableList.select(headers.slice(1, 2)).range(),
    range: [0, wave.layout.axisX.width],
  })
  const axisScaleY = new Scale({
    type: 'linear',
    domain: tableList.select(headers.slice(2, 3)).range(),
    range: [wave.layout.axisY.height, 0],
  })

  // x轴图层
  const axisXIndex = wave.layer.findIndex(item => item.id === 'axisXLayer')
  // axisXIndex !== -1 && wave.layer[axisXIndex].instance.destroy()
  const axisX = axisXIndex !== -1 ? wave.layer[axisXIndex].instance : wave.createLayer('axis', {id: 'axisXLayer'})
  axisX.setLayout(wave.layout.axisX)
  axisX.setStyle({
    orient: 'bottom',
    type: 'axisX',
    label: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  axisX.setScale(axisScaleX)
  axisX.draw()

  // y轴图层
  const axisYIndex = wave.layer.findIndex(item => item.id === 'axisYLayer')
  // axisYIndex !== -1 && wave.layer[axisYIndex].instance.destroy()
  const axisY = axisYIndex !== -1 ? wave.layer[axisYIndex].instance : wave.createLayer('axis', {id: 'axisYLayer'})
  axisY.setLayout(wave.layout.axisY)
  axisY.setStyle({
    type: 'axisY',
    orient: 'left',
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
  const titleIndex = wave.layer.findIndex(item => item.id === 'titleLayer')
  // titleIndex !== -1 && wave.layer[titleIndex].instance.destroy()
  const titleLayer = titleIndex !== -1 ? wave.layer[titleIndex].instance : wave.createLayer('text', {id: 'titleLayer', layout: wave.layout.title})
  titleLayer.setData(titleMapping[mode])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 点图层
  const scatterIndex = wave.layer.findIndex(item => item.id === 'scatterLayer')
  // scatterIndex !== -1 && wave.layer[scatterIndex].instance.destroy()
  const scatterLayer = scatterIndex !== -1 ? wave.layer[scatterIndex].instance : wave.createLayer('scatter', {id: 'scatterLayer', mode, layout: wave.layout.main})
  scatterLayer.setData(tableList.select(data[0].slice(0)))
  scatterLayer.setStyle({
    circleSizeRange: mode === 'bubble' ? [10, 30] : [5, 5],
    circle: {
      enableUpdateAnimation: true,
    },
    text: {
      hide: mode !== 'bubble',
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  scatterLayer.draw()
  
  // 删除动画，数据更新动画结束后在更新动画（因为扫光会基于原来的元素克隆新元素）
  Object.keys(scatterLayer.animation).forEach(name => scatterLayer.animation[name]?.destroy())
  setTimeout(() => {
    const aniamtions = scatterLayer.setAnimation({
      circle: {
        enterAnimation: {
          type: 'zoom',
          delay: 0,
          duration: 2000,
          mode: 'enlarge',
          direction: 'both',
        },
        loopAnimation: {
          type: 'scan',
          delay: 1000,
          duration: 3000,
          color: 'rgba(255,255,255,0.5)',
          direction: 'outer',
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
    })
    // 出场动画仅仅触发一次
    if (drawCount < 2) {
      aniamtions.circle.play()
      aniamtions.text.play()
      drawCount++
    } else {
      aniamtions.circle.animationQueue[2].instance.play()
      aniamtions.text.animationQueue[2].instance.play()
    }
  }, drawCount < 2 ? 0 : 2000)

  scatterLayer.setTooltip({circle: null})
  scatterLayer.event.off('click-circle')
  scatterLayer.event.on('click-circle', d => console.log(d))

  // 图例图层
  const legendIndex = wave.layer.findIndex(item => item.id === 'legendLayer')
  // legendIndex !== -1 && wave.layer[legendIndex].instance.destroy()
  const legend = legendIndex !== -1 ? wave.layer[legendIndex].instance : wave.createLayer('legend', {id: 'legendLayer', layout: wave.layout.legend})
  legend.setData(tableList.data[0].list)
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

  // 辅助线图层
  const auxiliaryIndex = wave.layer.findIndex(item => item.id === 'auxiliaryLayer')
  // auxiliaryIndex !== -1 && wave.layer[auxiliaryIndex].instance.destroy()
  const auxiliary = auxiliaryIndex !== -1 ? wave.layer[auxiliaryIndex].instance : wave.createLayer('auxiliary', {id: 'auxiliaryLayer', layout: wave.layout.main})
  const auxiliaryScale = new Scale({...scatterLayer.scale.scaleY, nice: null})
  auxiliary.setData([100, 200], auxiliaryScale)
  auxiliary.setStyle({
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
  })
  auxiliary.draw()
}
