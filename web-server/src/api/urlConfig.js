/**
 * Created by Administrator on 2018/1/10.
 */
import {serverRoot} from '../config/serverConfig';

// const serverRoot="http://192.168.1.114:8081";//本地
// const serverRoot="http://120.55.160.210:8380";//TEST

//三级分类列表
export const listdata=serverRoot+'/shop/scmCategory/query';
//供应商及报价
export const supplierdata=serverRoot+'/shop/scmSupplier/supplierAndSupPrice';
//供应商及采购
export const stoplierdata=serverRoot+'/shop/scmSupplier/supplierAndPmsHead';
//采购单新增
export const addpurchase=serverRoot+'/shop/scmDocPmsPoHeader/create';
//采购单列表
export const purchaselist=serverRoot+'/shop/scmDocPmsPoHeader/list_all';
//入库单新增
export const addstorages=serverRoot+'/shop/scmStockPlan/create';
//新增盘点单
export const addinventory=serverRoot+'/shop/scmStockCount/create';
//原料库存查询
export const rawmaterialdata=serverRoot+'/shop/scmMaterialStock/list_all';
//材料库存消费明细 ?
export const stockdata=serverRoot+'/scmMaterialStock/findMaterialStockConsumeDetail';
//盘点审核 ?
export const inventoryreview=serverRoot+'/shop/scmStockCount/approve';
//盘点单类表查询
export const inventorydata=serverRoot+'/shop/scmStockCount/list_all';
//入库单审核 ?
export const storagesreview=serverRoot+'/shop/scmDocPmsPoHeader/approve';
//入库列表查询
export const addstoragesdata=serverRoot+'/shop/scmStockPlan/list_all';

