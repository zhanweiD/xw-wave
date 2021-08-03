const createLog = file => {
  const filePath = file.replace(/\./g, '\\.')
  const emptyData = 'Empty Data'

  return {
    info(text, data = emptyData) {
      console.info(text, `Path: '${filePath}'\n`, data)
    },
    warn(text, data = emptyData) {
      console.warn(text, `Path: '${filePath}'\n`, data)
    },
    error(text, data = emptyData) {
      console.error(text, `Path: '${filePath}'\n`, data)
    },
    dump() {
      console.log(JSON.stringify(this.get(), null, 4))
    },
  }
}

export default createLog
