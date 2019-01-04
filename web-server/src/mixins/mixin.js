export default {
  methods: {
    initCar(orderInfo, shopDetail) {
      let orderItemMap = {};
      for (let orderItem of orderInfo.order_item_list) {
        let item = {};
        // 套餐主项
        if (orderItem.type === 3) {
          let packageItem = orderItemMap[orderItem.id];
          if (packageItem && packageItem.id) {
            orderItem.mealItems = packageItem.mealItems;
          }
        }
        // 套餐子项
        if (orderItem.type === 4) {
          let packageItem = orderItemMap[orderItem.parent_id] || {};
          packageItem.mealItems = (packageItem.mealItems || []);
          packageItem.mealItems.push({
            id: orderItem.article_id,
            count: orderItem.count,
            name: orderItem.article_name,
            price: orderItem.original_price
          });
          if (!packageItem.id) {
            packageItem.id = orderItem.parent_id;
            orderItemMap[packageItem.id] = packageItem;
          }
          continue;
        }

        item = {
          time: this.$utils.generateUUID(),
          id: orderItem.article_id,

          ownId: orderItem.id, // 新增，订单id
          orderId: orderItem.order_id, // 主订单id
          unitPrice: orderItem.unit_price, // 新增 unitPrice
          payModeId: orderItem.payment_mode_id, // 支付类型
          originCount: orderItem.orgin_count, // 原始的菜品数量

          mealFeeNumber: orderItem.meal_fee_number, // 每一项所有的餐盒数量
          mealFeeNumberOne: orderItem.meal_fee_number / orderItem.count, // 每一项的每一道菜所需要的餐盒个数
          refundChange: 0, // 这个字段用来计算每一个菜品项需要退多少餐盒

          count: orderItem.count,   // 剩余的菜品数量
          tempCount: orderItem.count,

          tempRefundCount: orderItem.refund_count,

          type: orderItem.type,
          name: orderItem.article_name,
          price: orderItem.final_price,
          tempPrice: orderItem.final_price,

          isOpen: false,
          status: orderItem.status,

          extraPrice: 0 // 新增 额外费用
        };
        if (item.type === 3) {
          item.mealItems = orderItem.mealItems;
        }
        orderItemMap[orderItem.id] = item;
      }
      this.car = [];  // 清空购物车
      // 插入购物车
      for (let key in orderItemMap) {
        // 套餐总价（加上子项差价）
        if(orderItemMap[key].type === 3){
          for(let items of orderItemMap[key].mealItems){
            if(items.count>0){
              orderItemMap[key].price += items.price;
            }
          }
        }
        this.car.push(orderItemMap[key]);
      }
      // if(orderInfo.service_price){
      //   this.car.push({
      //     time: this.$utils.generateUUID(),
      //     serverPrice: true,
      //     count: orderInfo.customer_count,
      //     name: "服务费",
      //     tempCount: orderInfo.customer_count,
      //     status: 1,
      //     type: "servicePrice",
      //     unitPrice: orderInfo.service_price / orderInfo.customer_count,
      //     tempPrice: orderInfo.service_price,
      //     price: orderInfo.service_price,
      //   });
      // }

      if(orderInfo.service_price && shopDetail.service_type == 0) {
        this.car.push({
          time: this.$utils.generateUUID(),
          serverPrice: true,
          count: orderInfo.customer_count,
          name: "服务费",
          tempCount: orderInfo.customer_count,
          status: 1,
          type: "servicePrice",
          unitPrice: orderInfo.service_price / orderInfo.customer_count,
          tempPrice: orderInfo.service_price,
          price: orderInfo.service_price,
        });
      }

      if (orderInfo.service_price && shopDetail.service_type == 1) {
        var upgradeService = [
          {
            name: shopDetail.sauce_fee_name,
            count: orderInfo.sauce_fee_count,
            price: orderInfo.sauce_fee_price,
          },
          {
            name: shopDetail.towel_fee_name,
            count: orderInfo.towel_fee_count,
            price: orderInfo.towel_fee_price,
          },
          {
            name:  shopDetail.tableware_fee_name,
            count: orderInfo.tableware_fee_count,
            price: orderInfo.tableware_fee_price,
          }
        ]
        for (let i = 0 ; i < upgradeService.length; i++) {
          if (upgradeService[i].price > 0) {
            this.car.push({
              time: this.$utils.generateUUID(),
              serverPrice: true,
              count: upgradeService[i].count,
              name: upgradeService[i].name,
              tempCount: upgradeService[i].count,
              status: 1,
              type: "servicePrice",
              unitPrice: upgradeService[i].price / orderInfo.count,
              tempPrice: upgradeService[i].price,
              price: upgradeService[i].price,
            });
          }
        }
      }


      //子项订单遍历
      let chrildrenItemMap = {};
      if (orderInfo.childreorder_item_list.length > 0) {
        for (let childrenOrderItem of orderInfo.childreorder_item_list) {
          let childrenItem = {};
          // 套餐主项
          if (childrenOrderItem.type === 3) {
            let packageItem = orderItemMap[childrenOrderItem.id];
            if (packageItem && packageItem.id) {
              childrenOrderItem.mealItems = packageItem.mealItems;
            }
          }
          // 套餐子项
          if (childrenOrderItem.type === 4) {
            //              let packageItem = chrildrenItemMap[childrenOrderItem.parent_id] || {};
            let packageItem = orderItemMap[childrenOrderItem.parent_id] || {};
            packageItem.mealItems = (packageItem.mealItems || []);
            packageItem.mealItems.push({
              id: childrenOrderItem.article_id,
              count: childrenOrderItem.count,
              name: childrenOrderItem.article_name,
              price: childrenOrderItem.original_price
            });

            if (!packageItem.id) {
              packageItem.id = childrenOrderItem.parent_id;
              orderItemMap[packageItem.id] = packageItem;
            }
            continue;
          }
          childrenItem = {
            time: this.$utils.generateUUID(),
            id: childrenOrderItem.article_id,

            ownId: childrenOrderItem.id, // 订单ID
            orderId: childrenOrderItem.order_id, // 主订单ID
            unitPrice: childrenOrderItem.unit_price, // 单价
            payModeId: childrenOrderItem.payment_mode_id,//
            originCount: childrenOrderItem.orgin_count,


            mealFeeNumber: childrenOrderItem.meal_fee_number, // 每一项所有的餐盒数量
            mealFeeNumberOne: childrenOrderItem.meal_fee_number / childrenOrderItem.count, // 每一项的餐盒个数
            refundChange: 0, // 这个字段用来计算每一个菜品项需要退多少餐盒

            tempRefundCount: childrenOrderItem.refund_count,

            count: childrenOrderItem.count, // 数量
            tempCount: childrenOrderItem.count, // 剩余数量

            type: childrenOrderItem.type, // 类型
            name: childrenOrderItem.article_name,
            price: childrenOrderItem.final_price,
            tempPrice: childrenOrderItem.final_price,

            isOpen: false,
            notes: '(加菜)',
            status: childrenOrderItem.status,

            extraPrice: 0 // 新增 额外费用(餐盒费，服务费等) 注意，初代版本不要求，所以是0
          };
          if (childrenItem.type === 3) {
            childrenItem.mealItems = childrenOrderItem.mealItems;
          }
          chrildrenItemMap[childrenOrderItem.id] = childrenItem;
        }
        for (let key in chrildrenItemMap) {
          if(chrildrenItemMap[key].type === 3){
            for(let items of chrildrenItemMap[key].mealItems){
              if(items.count) {
                chrildrenItemMap[key].price += items.price;
              }
            }
          }
          this.car.push(chrildrenItemMap[key]);
        }
      }
    },

    getArticleType (currentArticle) {
      if (currentArticle.article_type === 1) {
        if (currentArticle.article_unit == 2) {  // 老规格
          return '规格';
        } else if (currentArticle.article_unit == 5) { // 新规格
          return '规格';
        } else if (currentArticle.open_catty == 1) {
          return '称重';
        } else { // 普通单品
          return '单品';
        }
      } else {
        return '套餐';
      }
    },

    articleType (currentArticle){
      if (currentArticle.article_type === 1) {
        if (currentArticle.article_unit == 2) {  // 老规格
          return 'OLD_UNIT_PRICE';
        } else if (currentArticle.article_unit == 5) { // 新规格
          return 'NEW_UNIT_PRICE';
        } else if (currentArticle.open_catty == 1) {
          return 'WEIGHT_ARTICLE';
        } else { // 普通单品
          return 'NORMAL_ARTICLE';
        }
      } else {
        return 'PACKAGE_ARTICLE';
      }
    },

    /**
     *  @desc 用于判断 接收到消息通知后 是否刷新订单
     *  @param eventType String 消息类型
     *  @return boolean
     */
    orderFreshByEventType (eventType) {
      var eventTypaArr = ['bindTable', 'orderCreate', 'changeTable', 'orderPay', 'discount', 'grantOrder']
      if (eventTypaArr.includes(eventType)) {
        return true
      } else {
        return false
      }
    },

  }
}
