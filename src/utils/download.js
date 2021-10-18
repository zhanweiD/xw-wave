/**
 * save the string as a file
 * @param {String} data
 * @param {String} fileName
 */
const download = (data, fileName) => {
  const dataUrl = `data:,${data}`
  const a = document.createElement('a')
  a.download = fileName
  a.href = dataUrl
  a.click()
}

export default download
