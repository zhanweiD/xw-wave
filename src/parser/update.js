import createWave from './create'
import translate from './translate'
import {graphMapping, textMapping, otherMapping} from './mapping'

// 初始化图表
const reinitializeWave = (wave, schema) => {
  while (wave.layer.length !== 0) {
    wave.layer[0].instance.destroy()
  }
  createWave(translate(schema), wave)
}

// 图表更新策略
const updateWave = ({action, ...other}) => {
  if (action === 'data') {
    const {instance, schema} = other
    reinitializeWave(instance, schema)
  } else {
    updateStyle(other)
  } 
}

// 根据配置更新一个图表
const updateStyle = ({tabId, layerId, option, value, schema, instance}) => {
  const target = instance.layer.find(({id}) => id === layerId)
  const layer = target.instance
  // 图形配置面板
  tabId === 'graph' && layer.setStyle({[option]: graphMapping(value)})
  // 文字配置面板
  tabId === 'text' && layer.setStyle({[option]: textMapping(value)})
  // 其他面板
  if (tabId === 'other') {
    const result = otherMapping(target.type, value)
    // 需要重新初始化的情况
    if (Object.keys(result.options).length !== 0) {
      reinitializeWave(instance, schema)
      return
    }
    layer.setData(result.data, {nice: result.scale})
    layer.setStyle(result.style)
  }
  // 由于覆盖问题所有图层都需要重新渲染
  instance.draw()
}

export default (...parameter) => {
  try {
    return updateWave(...parameter)
  } catch (error) {
    console.error('图标更新失败\n', error)
    return null
  }
}
