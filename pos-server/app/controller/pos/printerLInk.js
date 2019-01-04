const result = require('../../util/resultUtil')
const dateUtil = require('../../util/dateUtil')
const generalUtil = require('../../util/generalUtil')
const { log } = require('../../util/fileUtil')

const async = require('async')
const lodash = require('lodash')
const moment = require('moment')

const orderModel = require('../../model/pos/order')
const orderItemModel = require('../../model/pos/orderItem')
const printerModel = require('../../model/pos/printer')
const shopDetailModel = require('../../model/pos/shopDetail')
const articleKitchenModel = require('../../model/pos/articleKitchen')
const articleKitchenPrinterModel = require('../../model/pos/articleKitchenPrinter')
const printTemplateModel = require('../../constant/printTemplateModel')

/**
 * 店铺动线类
 * todo:
 * 更新数据
 * 日志打印
 */
class PointKitchen {
  constructor() {
    this.groups = {}
  }
  // 当前动线配置打印
  loggroups() {
    // log('printLogs',`-------------- 当前动线:---------------- 
    // ${JSON.stringify(this.groups,null,2)}`)  
  }
  // 初始化厨房组
  initKitchenGroups(finish) {
    this.groups = {}
    const that = this
    // 查询厨房组
    articleKitchenModel.queryKitchenGroup((err, groups) => {
      // console.log('----------------originGs--------------')
      // console.log(JSON.stringify(groups,null,2))
      if (err) return finish(err)
      async.eachOfLimit(
        groups,
        1,
        (group, index, cb) => {
          articleKitchenModel.queryKitchens(group.id, (err, kitchen) => {
            if (err) return cb(err)
            // 动态厨房列表
            groups[index]['kitchenList'] = [...kitchen]
            // 全部厨房列表
            groups[index]['originList'] = [...kitchen]
            groups[index]['pointer'] = parseInt(Math.random() * (kitchen.length - 1))
            return cb()
          })
        },
        err => {
          if (err) {
            return finish(err)
          }
          groups.forEach(group => {
            that.groups[group.id] = group
          })
          return finish(err, null)
        }
      )
    })
  }
  // 入口
  queueOrders(item, orderInfo){
    item.kitchens = []
    item.printers = []
    return this.queryGroup(item).then(groups=> {
      if(!groups||!groups.length){
        return Promise.resolve([])
      }
      return new Promise((resolve,reject)=>{
        async.eachLimit(groups,1, (group,callback)=>{
          let groupId = group['kitchen_group_id']
          let modeId = orderInfo.distribution_mode_id
          this.push(groupId, item, modeId).then(()=>{
            callback()
          }).catch(e=>{
            callback(e)
          })
        },function finish(err){
          if(err){
            console.log(err)
            return reject(err)
          }
          return resolve()
        })
      })
      
    })
  }
  // 查询菜品所属厨房组
  queryGroup(item) {
    return new Promise((resolve, reject) => {
      articleKitchenModel.queryKitchenGroupByArticleId(item.article_id, (err, group) => {
        if (err) {
          console.error(err)
          return reject(err)
        }
        resolve(group)
      })
    })
  }
  // 一个订单分配厨房逻辑, 返回打印机信息
  push(groupKey, item, distribute_id) {
    return new Promise((resolve, reject) => {
      try {
        let tmp = this.groups[groupKey].kitchenList  
      } catch (error) {
        log('printLogs',`
        --------------当前动线-------------------
        ${JSON.stringify(this.groups)}
        --------------当前订单-------------------
        ${JSON.stringify(item)}
        ------------ groupkey:  ${groupKey}
        未找到对应厨房组
        `)        
        resolve([])      
      }

      const that = this
      const currentGroup = this.groups[groupKey]
      const kitchens = currentGroup.kitchenList // 可用的厨房列表
      const originKitchs = currentGroup.originList // 配置的厨房列表

      // 更新在线厨房
      async.eachLimit(
        originKitchs,
        1,
        (kitchen, ab) => {
          that.kitchenOnline(kitchen.kitchen_id, (err, online) => {
            if (err) {
              console.log(err)
              return ab(err)
            }
            if (online) { // 在线
              let inPool = lodash.find(kitchens,{'kitchen_id': kitchen.kitchen_id})
              if(!inPool){
                kitchens.push(kitchen)
              }
            } else { // 厨房不在线处理
              let inPool = lodash.findIndex(kitchens, {'kitchen_id': kitchen.kitchen_id})
              if(inPool!==-1){
                kitchens.splice(inPool,1)
                if(inPool <= currentGroup.pointer){
                  if(currentGroup.pointer>0) return currentGroup.pointer--
                }
              }
            }
            ab(null)
          })
        },
        err => {
          if (err) return reject(err)

          console.log('----------------------kitchens---------------------')
          console.log(JSON.stringify( kitchens,null,2))
          console.log('----------------------origns-------------------')
          console.log(JSON.stringify(originKitchs,null,2))
          if (currentGroup.pointer >= kitchens.length) {
            currentGroup.pointer = 0
          }

          // (在线)厨房列表为空
          if (!kitchens.length) return resolve([])
          let kitchen = kitchens[currentGroup.pointer++]

          //查询厨房打印机列表, 最终返回
          that.finalInfo(kitchen, item, distribute_id).then(
            data => {
              resolve(data)
            },
            err => {
              console.log(err)
              reject(err)
            }
          )

        }
      )
    })
  }
  // 检查厨房是否在线, 返回在线厨房
  kitchenOnline(kitchen_id, cb) {
    articleKitchenModel.queryKitchenIsOnline(kitchen_id, (err, result) => {
      if (err) {
        console.log(err)
        return cb(err)
      }
      let online = false
      if (result.status == 0 && timeCompare(result.begin_time,result.end_time)) {
        online = true
      }
      cb(null, online)
    })
  }
  // 绑定打印逻辑
  kitchenPrint(kitchen, distribute_id) {
    return new Promise((resolve, reject) => {
      articleKitchenModel.queryPrintersByKitchen(kitchen.kitchen_id, distribute_id, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  }
  // 信息拼接
  finalInfo(data, item, distribute_id) {
    return new Promise((resolve, reject) => {
      //查询厨房打印机列表, 最终返回
      this.kitchenPrint(data, distribute_id)
        .then(printerInfo => {
          // 拼接信息
          printerInfo.forEach(printer => {
            printer.kitchen_id = data.kitchen_id
            printer.kitchen_name = data.name
          })

          data.printers = printerInfo
          // item.printers.push(printerInfo)
          item.kitchens.push(data)

          resolve(item)
        })
        .catch(err => {
          console.log(err)
          reject(err)
        })
    })
  }
}

const shopKitchenGroups = new PointKitchen()
// 初始厨房组
shopKitchenGroups.initKitchenGroups((err, data) => {
  if (err) {
    console.log(err)
    return console.log('init error')
  }
  shopKitchenGroups.loggroups()
})

exports.linksPrinter = shopKitchenGroups

/**
 * 返回信息处理
 */
function reformOutput(item) {
  return new Promise((resolve, reject) => {
    let returnArr = []
    let kitchens = item.kitchens
    try {
      kitchens.forEach((kitchen, index) => {
        let itemCopy = Object.assign({}, item)
        itemCopy.kitchen_id = kitchen.kitchen_id
        itemCopy.printers = kitchen.printers
        returnArr.push(itemCopy)
      })
    } catch (error) {
      console.log(error)
      reject(error)
    }
    resolve(returnArr)
  })
}

/**
 * 返回打印信息
 * @param resBen item对应打印机列表
 * @param orderInfo 订单信息
 * @param item 当前订单子菜单
 * @param stickerResults 贴纸数组
 * @param results 小票数组
 */
exports.formatInfo = function(item, orderInfo, results, stickerResults) {
  return new Promise((resolve, reject) => {
    reformOutput(item).then(orders => {
      async.eachLimit(
        orders,
        1,
        (order, callback) => {
          let resBen = order.printers
          if (resBen.length > 0) {
            async.eachLimit(
              resBen,
              1,
              function(printer, ef) {
                // 重写分单逻辑
                try {
                  if (item.peopleSdb) {
                    // 套餐且不分单
                    if (printer.ticket_type == 0) {
                      setWhole(item, printer, orderInfo, results)
                    } else {
                      // 贴纸直接返回
                      return ef()
                    }
                  } else {
                    if (printer.ticket_type == 0) {
                      // todo: sticker 问题
                      formItem(item, printer, orderInfo, results)
                    } else {
                      formSticker(item, printer, stickerResults)
                    }
                  }
                } catch (error) {
                  ef(error)
                }
                ef()
              },
              function(error) {
                if (error) {
                  console.log(error)
                  return callback(error)
                }
                callback(null)
              }
            )
          } else {
            console.log('未找到打印机')
            callback(null)
          }
        },
        err => {
          if (err) {
            console.log(err)
            return reject(err)
          }
          resolve()
          console.log('finish')
        }
      )
    })
  })
}

/**
 * 单品分单/小票类型 ticket_type=1
 */
function formItem(item, printer, orderInfo, results) {
  let obj = {
    id: item.id,
    printer_id: printer.id,
    printer_name: printer.name,
    parent_id: printer.id,
    kitchen_id: printer.kitchen_id,
    kitchen_name: printer.kitchen_name,
    ip: printer.ip,
    port: printer.port,
    ITEMS: []
  }
  obj.ITEMS.push({ ARTICLE_COUNT: item.count, ARTICLE_NAME: item.article_name })
  results.push(obj)
}

/**
 * 单品分单/贴纸类型 ticket_type=0
 */
function formSticker(item, printer, stickerResults) {
  let obj = {
    id: item.id,
    port: printer.port,
    ip: printer.ip,
    printer_name: printer.name,
    kitchen_name: printer.name,
    ARTICLE_NAME: item.article_name.replace(/\(.*?\)/g, ''),
    ARTICLE_COUNT: 1,
    ARTICLE_PRICE: item.unit_price.toFixed(2)
  }
  let SPEC = item.article_name.match(/\((.+?)\)/g)
  let arr = lodash.map(SPEC, function(n) {
    return n.replace(/\(/, '#').replace(/\)/, '')
  })
  obj.SPEC = arr.toString().replace(/\,/g, ' ') || ''
  stickerResults.push(obj)
}

/**
 * 套餐不分单 print_type =0
 */
function setWhole(item, printer, orderInfo, results) {
  let parent = lodash.find(orderInfo.orderItems, { id: item.parent_id })
  let children = lodash.filter(orderInfo.orderItems, { parent_id: parent.id })

  let obj = {
    id: item.id,
    parent_id: printer.printerId,
    port: printer.port,
    ip: printer.ip,
    ITEMS: []
  }

  obj.ITEMS.push({ ARTICLE_COUNT: parent.count, ARTICLE_NAME: parent.article_name })
  children.forEach(child => {
    obj.ITEMS.push({ ARTICLE_COUNT: child.count, ARTICLE_NAME: '|_' + child.article_name })
  })
  results.push(obj)
}

/**
 * 订单拆分
 */
exports.splitOrder = function(orderInfo) {
  const orders = []
  const originOrders = orderInfo.orderItems
  // 单品
  const ordersItems = lodash.filter(originOrders, o => {
    return ![3, 4].includes(o.type)
  })
  // 套餐
  const orderSets = lodash.filter(originOrders, o => {
    return o.type == 3
  })

  // 单品处理
  ordersItems.forEach((item, index) => {
    let copyCount = new Array(item.count)
    item.count = 1
    for (let count of copyCount) {
      orders.push(item)
    }
  })

  // 套餐处理
  orderSets.forEach(set => {
    let setItems = lodash.filter(originOrders, { parent_id: set.id })
    if (orderInfo.shopDetail.printType === 0) {
      // 不拆单
      setItems[0]['peopleSdb'] = true
      orders.push(setItems[0])
    } else {
      // 拆单, 忽略父单, 处理同单品
      setItems.forEach((item)=>{
        let copyCount = new Array(item.count)
        item.count = 1
        for(let count of copyCount){
          orders.push(item)
        }
      })
    }
  })

  orderInfo.normalOrders = orders
  return orderInfo
}


function timeCompare(start, end, now){
  return moment().isBetween(moment(start,'HH:mm'),moment(end,'HH:mm'))
}
