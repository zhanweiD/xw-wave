import {useEffect, useRef} from 'react'
import Wave from '../wave'
import Table from '../data/table'
import Scale from '../data/scale'
import s from './demo.module.css'

const titleMapping = {
  rect: '矩形热力图',
  circle: '圆形热力图',
}

let columnMatrixMapWave
let circleMatrixMapWave
let drawCount = 0

export default function Matrix({data = [[]], type = 'column', theme}) {
  const columnMatrixMapRef = useRef(null)
  const circleMatrixMapRef = useRef(null)
 
  useEffect(() => {
    columnMatrixMapWave = new Wave({container: columnMatrixMapRef.current, theme})
    circleMatrixMapWave = new Wave({container: circleMatrixMapRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: columnMatrixMapWave, mode: 'rect', data, type})
    updateWave({wave: circleMatrixMapWave, mode: 'circle', data, type})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbjsb fbw fbac">
      <div className={s.wave} ref={columnMatrixMapRef} />
      <div className={s.wave} ref={circleMatrixMapRef} />
    </div>
  )
}

// 热力图
const updateWave = ({wave, data, type, mode}) => {
  const table = new Table(data)
  const axisScaleX = new Scale({
    type: 'band',
    domain: table.data[0],
    range: [0, wave.layout.axisX.width],
    nice: {paddingInner: 0},
  })
  const axisScaleY = new Scale({
    type: 'band',
    domain: table.data[1],
    range: [wave.layout.axisY.height, 0],
    nice: {paddingInner: 0},
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

  // 数值轴图层
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

  // 矩形图层
  const matrixIndex = wave.layer.findIndex(item => item.id === 'matrixLayer')
  // matrixIndex !== -1 && wave.layer[matrixIndex].instance.destroy()
  const matrixLayer = matrixIndex !== -1 ? wave.layer[matrixIndex].instance : wave.createLayer('matrix', {id: 'matrixLayer', mode, type, layout: wave.layout.main})
  matrixLayer.setData(table)
  matrixLayer.setStyle({
    rect: {
      enableUpdateAnimation: true,
    },
    text: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  matrixLayer.draw()
  
  // 删除动画，数据更新动画结束后在更新动画（因为扫光会基于原来的元素克隆新元素）
  Object.keys(matrixLayer.animation).forEach(name => matrixLayer.animation[name]?.destroy())
  setTimeout(() => {
    const aniamtions = matrixLayer.setAnimation({
      rect: {
        enterAnimation: {
          type: 'zoom',
          delay: 0,
          duration: 2000,
          mode: 'enlarge',
          direction: 'both',
        },
      },
      circle: {
        enterAnimation: {
          type: 'zoom',
          delay: 0,
          duration: 2000,
          mode: 'enlarge',
          direction: 'both',
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
      aniamtions[mode].play()
      aniamtions.text.play()
      drawCount++
    } else {
      aniamtions[mode].animationQueue[2].instance.play()
      aniamtions.text.animationQueue[2].instance.play()
    }
  }, drawCount < 2 ? 0 : 2000)

  matrixLayer.setTooltip({rect: null})
  matrixLayer.event.off('click-rect')
  matrixLayer.event.on('click-rect', d => console.log(d))
}
