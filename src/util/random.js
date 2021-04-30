// 随机字符串字符集
const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'

// 创建随机字符串
export default (n = 6) => {
  let string = ''
  for (let i = 0; i < n; i++) {
    string += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return string
}
