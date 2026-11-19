import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import * as fruitController from '../controllers/fruitController.js'
import * as paymentController from '../controllers/paymentController.js'
import * as purchaseController from '../controllers/purchaseController.js'
import * as reportController from '../controllers/reportController.js'
import * as salesController from '../controllers/salesController.js'
import * as stockController from '../controllers/stockController.js'
import * as supplierController from '../controllers/supplierController.js'
import * as vendorController from '../controllers/vendorController.js'

const router = Router()

router.get('/', (request, response) => {
  response.json({
    name: 'Batloung Farm Distribution API',
    version: '1.0.0',
    resources: [
      '/api/suppliers',
      '/api/fruits',
      '/api/stock',
      '/api/vendors',
      '/api/purchases',
      '/api/sales',
      '/api/payments',
      '/api/reports',
    ],
  })
})

router.get('/suppliers', asyncHandler(supplierController.listSuppliers))
router.post('/suppliers', asyncHandler(supplierController.createSupplier))
router.get('/suppliers/:supplierId', asyncHandler(supplierController.getSupplier))
router.put('/suppliers/:supplierId', asyncHandler(supplierController.updateSupplier))
router.delete('/suppliers/:supplierId', asyncHandler(supplierController.deleteSupplier))

router.get('/fruits', asyncHandler(fruitController.listFruits))
router.post('/fruits', asyncHandler(fruitController.createFruit))
router.get('/fruits/:fruitId', asyncHandler(fruitController.getFruit))
router.put('/fruits/:fruitId', asyncHandler(fruitController.updateFruit))
router.delete('/fruits/:fruitId', asyncHandler(fruitController.deleteFruit))

router.get('/stock', asyncHandler(stockController.listStock))
router.get('/stock/low', asyncHandler(stockController.listLowStock))

router.get('/vendors', asyncHandler(vendorController.listVendors))
router.post('/vendors', asyncHandler(vendorController.createVendor))
router.get('/vendors/:vendorId/balance', asyncHandler(vendorController.getVendorBalance))
router.get('/vendors/:vendorId', asyncHandler(vendorController.getVendor))
router.put('/vendors/:vendorId', asyncHandler(vendorController.updateVendor))

router.get('/purchases', asyncHandler(purchaseController.listPurchases))
router.post('/purchases', asyncHandler(purchaseController.createPurchase))
router.get('/purchases/:purchaseId', asyncHandler(purchaseController.getPurchase))

router.get('/sales', asyncHandler(salesController.listSales))
router.post('/sales', asyncHandler(salesController.createSale))
router.get('/sales/:saleId', asyncHandler(salesController.getSale))

router.get('/payments', asyncHandler(paymentController.listVendorPayments))
router.post('/payments', asyncHandler(paymentController.createPayment))

router.get('/reports/top-selling-fruits', asyncHandler(reportController.topSellingFruits))
router.get('/reports/sales-revenue', asyncHandler(reportController.salesRevenue))
router.get('/reports/top-vendor', asyncHandler(reportController.topVendor))
router.get('/reports/sales-by-district', asyncHandler(reportController.salesByDistrict))

export default router

