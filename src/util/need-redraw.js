// 对比两份数据，判断是否需要重绘
export default (object1, object2) => {
  return JSON.stringify(object1) !== JSON.stringify(object2)
}
