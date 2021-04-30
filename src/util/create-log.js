import onerStorage from 'oner-storage'
import isDev from './is-dev'

// 目标：前端日志信息只开开发环境直接展示在控制台，在生产环境需要手动调用才可以展示
export const log = onerStorage({
  type: 'variable', // 缓存方式, 默认为'localStorage'
  key: 'waveview-front-log', // !!! 唯一必选的参数, 用于内部存储 !!!
})

const createLog = file => {
  const filePath = file.replace(/\./g, '\\.')

  const infoPrefix = 'Info'
  const warnPrefix = 'Warn'
  const errorPrefix = 'Error'
  const emptyData = 'Empty Data'

  return {
    info(text, data = emptyData) {
      log.set(`${infoPrefix}.${filePath}.${text}`, data)
      if (isDev) {
        console.info(text, `Path: '${filePath}'`, data)
      }
    },
    warn(text, data = emptyData) {
      log.set(`${warnPrefix}.${filePath}.${text}`, data)
      if (isDev) {
        console.warn(text, `Path: '${filePath}'`, data)
      }
    },
    error(text, data = emptyData) {
      log.set(`${errorPrefix}.${filePath}.${text}`, data)
      if (isDev) {
        console.error(text, `Path: '${filePath}'`, data)
      }
    },
    get() {
      return {
        [infoPrefix]: log.get(infoPrefix),
        [warnPrefix]: log.get(warnPrefix),
        [errorPrefix]: log.get(errorPrefix),
      }
    },
    dump() {
      console.log(JSON.stringify(this.get(), null, 4))
    },
  }
}

export default createLog
