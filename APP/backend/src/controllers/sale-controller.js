const { getInstance: getDataService } = require('../services/data-service');

class SaleController {
    constructor() {
        this.dataService = getDataService();
    }

    async getAllSales(req, res) {
        try {
            const sales = await this.dataService.getSales();
            res.json({ success: true, data: sales, count: sales.length });
        } catch (error) {
            console.error('SaleController.getAllSales:', error);
            res.status(500).json({ success: false, error: 'Error al obtener ventas' });
        }
    }

    async createSale(req, res) {
        try {
            const { customerName, items, deliveryType, deliveryAddress, paymentMethod, shippingCost, subtotal, total } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, error: 'La venta debe tener al menos un item' });
            }

            // Enriquecer items con unitCost desde la BD
            const enrichedItems = await Promise.all(items.map(async item => {
                const product = await this.dataService.getProductById(item.productId);
                return {
                    productId: item.productId,
                    productName: item.productName || product?.name || '',
                    quantity: parseInt(item.quantity) || 1,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    unitCost: product?.cost || 0
                };
            }));

            const sale = await this.dataService.createSale({
                customerName: customerName || '',
                items: enrichedItems,
                deliveryType: deliveryType || 'retiro',
                deliveryAddress: deliveryAddress || '',
                paymentMethod: paymentMethod || 'efectivo',
                shippingCost: parseFloat(shippingCost) || 0,
                subtotal: parseFloat(subtotal) || 0,
                total: parseFloat(total) || 0
            });

            res.status(201).json({ success: true, data: sale });
        } catch (error) {
            console.error('SaleController.createSale:', error);
            res.status(500).json({ success: false, error: 'Error al crear venta' });
        }
    }

    async updateSale(req, res) {
        try {
            const { id } = req.params;
            const { items, total, notes, customerName, deliveryType, deliveryAddress, paymentMethod, shippingCost, subtotal, changeDescription } = req.body;

            const oldSale = await this.dataService.getSaleById(id);
            if (!oldSale) {
                return res.status(404).json({ success: false, error: 'Venta no encontrada' });
            }

            // Ajustar stock según diferencia entre items viejos y nuevos
            if (items) {
                const oldMap = {};
                for (const item of oldSale.items) {
                    oldMap[item.productId] = (oldMap[item.productId] || 0) + item.quantity;
                }
                const newMap = {};
                for (const item of items) {
                    newMap[item.productId] = (newMap[item.productId] || 0) + parseInt(item.quantity);
                }

                const allProductIds = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
                for (const pid of allProductIds) {
                    const oldQty = oldMap[pid] || 0;
                    const newQty = newMap[pid] || 0;
                    const delta = oldQty - newQty; // positivo → stock sube, negativo → baja
                    if (delta !== 0) {
                        const product = await this.dataService.getProductById(pid);
                        if (product) {
                            const newStock = Math.max(0, (product.stock || 0) + delta);
                            await this.dataService.updateProduct(pid, { stock: newStock });
                        }
                    }
                }
            }

            // Construir entrada de changelog
            const description = changeDescription || 'Venta editada desde el panel admin';
            const updates = {
                $set: {},
                $push: { changelog: { date: new Date(), description } }
            };

            if (items !== undefined) updates.$set.items = items;
            if (total !== undefined) updates.$set.total = parseFloat(total);
            if (notes !== undefined) updates.$set.notes = notes;
            if (customerName !== undefined) updates.$set.customerName = customerName;
            if (deliveryType !== undefined) updates.$set.deliveryType = deliveryType;
            if (deliveryAddress !== undefined) updates.$set.deliveryAddress = deliveryAddress;
            if (paymentMethod !== undefined) updates.$set.paymentMethod = paymentMethod;
            if (shippingCost !== undefined) updates.$set.shippingCost = parseFloat(shippingCost);
            if (subtotal !== undefined) updates.$set.subtotal = parseFloat(subtotal);

            const updated = await this.dataService.updateSale(id, updates);
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('SaleController.updateSale:', error);
            res.status(500).json({ success: false, error: 'Error al actualizar venta' });
        }
    }

    async deleteSale(req, res) {
        try {
            const { id } = req.params;
            const sale = await this.dataService.getSaleById(id);
            if (!sale) {
                return res.status(404).json({ success: false, error: 'Venta no encontrada' });
            }

            // Restaurar stock de todos los items
            for (const item of sale.items) {
                const product = await this.dataService.getProductById(item.productId);
                if (product) {
                    await this.dataService.updateProduct(item.productId, {
                        stock: (product.stock || 0) + item.quantity
                    });
                }
            }

            await this.dataService.deleteSale(id);
            res.json({ success: true, message: 'Venta eliminada y stock restaurado' });
        } catch (error) {
            console.error('SaleController.deleteSale:', error);
            res.status(500).json({ success: false, error: 'Error al eliminar venta' });
        }
    }
}

module.exports = SaleController;
