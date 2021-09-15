// character set
const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'

// create a random string
export default (n = 6) => {
  let string = ''
  for (let i = 0; i < n; i++) {
    string += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return string
}
