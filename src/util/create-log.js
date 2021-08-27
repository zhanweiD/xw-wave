const createLog = file => {
  const filePath = file.replace(/\./g, '\\.')
  const emptyData = 'Empty Data'

  return {
    info(text, data = emptyData) {
      console.info(text, `\nPath: '${filePath}'\n`, data)
    },
    warn(text, data = emptyData) {
      console.warn(text, `\nPath: '${filePath}'\n`, data)
    },
    error(text, data = emptyData) {
      console.error(text, `\nPath: '${filePath}'\n`, data)
    },
    dump() {
      console.log(JSON.stringify(this.get(), null, 4))
    },
  }
}

export default createLog
