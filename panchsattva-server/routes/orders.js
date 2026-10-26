const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @POST /api/orders - Create order
router.post('/', protect, async (req, res) => {
  try {
    const {
      orderId,
      items,
      shippingAddress,
      customer,
      subtotal,
      gst,
      shipping,
      discount,
      totalAmount,
      total,
      paymentMode,
      advancePaid,
      codBalance,
      utr,
      paymentScreenshot,
      screenshotName,
      paymentStatus,
      orderStatus,
      notes
    } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });

    // Validate stock for all products before creating order
    for (const item of items) {
      const orderQty = Math.max(1, Number(item.quantity) || 1);

      if (item.isHamper && item.hamperData && Array.isArray(item.hamperData.products)) {
        for (const hp of item.hamperData.products) {
          const subPid = hp.product?._id || hp.product?.id || hp.productId;
          const subQty = (Number(hp.quantity) || 1) * orderQty;
          const product = await Product.findOne({
            $or: [
              { _id: subPid && String(subPid).match(/^[a-f\d]{24}$/i) ? subPid : null },
              { id: subPid },
              { name: hp.product?.name }
            ]
          });
          if (product && product.stock < subQty) {
            return res.status(400).json({
              message: `Only ${product.stock} units available for "${product.name}" in your custom hamper. You requested ${subQty} units.`
            });
          }
        }
      } else {
        const pid = item.productId || item.id || item._id;
        const product = await Product.findOne({
          $or: [
            { _id: pid && pid.match(/^[a-f\d]{24}$/i) ? pid : null },
            { id: pid },
            { name: item.name }
          ]
        });

        if (product && product.stock < orderQty) {
          return res.status(400).json({
            message: `Only ${product.stock} units available for "${product.name}". You requested ${orderQty} units.`
          });
        }
      }
    }

    // Deduct stock for each product
    for (const item of items) {
      const orderQty = Math.max(1, Number(item.quantity) || 1);

      if (item.isHamper && item.hamperData && Array.isArray(item.hamperData.products)) {
        for (const hp of item.hamperData.products) {
          const subPid = hp.product?._id || hp.product?.id || hp.productId;
          const subQty = (Number(hp.quantity) || 1) * orderQty;
          await Product.findOneAndUpdate(
            {
              $or: [
                { _id: subPid && String(subPid).match(/^[a-f\d]{24}$/i) ? subPid : null },
                { id: subPid },
                { name: hp.product?.name }
              ]
            },
            { $inc: { stock: -subQty } }
          );
        }
      } else {
        const pid = item.productId || item.id || item._id;
        await Product.findOneAndUpdate(
          {
            $or: [
              { _id: pid && pid.match(/^[a-f\d]{24}$/i) ? pid : null },
              { id: pid },
              { name: item.name }
            ]
          },
          { $inc: { stock: -orderQty } }
        );
      }
    }

    const addr = shippingAddress || customer || {};
    const finalShippingAddress = {
      fullName: addr.fullName || addr.name || req.user.name || 'Valued Customer',
      name: addr.name || addr.fullName || req.user.name || 'Valued Customer',
      phone: addr.phone || addr.mobile || req.user.phone || '',
      mobile: addr.mobile || addr.phone || req.user.phone || '',
      email: addr.email || req.user.email || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || ''
    };

    const finalSubtotal = Number(subtotal) || 0;
    const finalTotal = Number(totalAmount !== undefined ? totalAmount : total) || finalSubtotal;

    const orderData = {
      user: req.user._id,
      items,
      shippingAddress: finalShippingAddress,
      subtotal: finalSubtotal,
      gst: Number(gst) || 0,
      shipping: Number(shipping) || 0,
      discount: Number(discount) || 0,
      totalAmount: finalTotal,
      paymentMode: paymentMode || (advancePaid > 0 && codBalance > 0 ? 'cod_advance' : 'online'),
      advancePaid: Number(advancePaid) || 0,
      codBalance: Number(codBalance) || 0,
      utr: utr || '',
      paymentScreenshot: paymentScreenshot || '',
      screenshotName: screenshotName || '',
      notes: notes || '',
      paymentStatus: paymentStatus || 'pending',
      orderStatus: orderStatus || 'placed'
    };

    if (orderId) orderData.orderId = orderId;

    const order = await Order.create(orderData);

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @GET /api/orders/my - User's orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/orders/:id - Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Only allow owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ message: 'Access denied' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/orders/:id/cancel - Cancel an order (user or admin)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only owner or admin can cancel
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only cancel if not shipped/delivered
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot cancel an order that is ${order.orderStatus}.` });
    }

    // Restore stock
    for (const item of order.items) {
      const pid = item.productId || item._id;
      const qty = item.quantity || 1;
      await Product.findOneAndUpdate(
        { $or: [{ _id: pid }, { id: pid }, { name: item.name }] },
        { $inc: { stock: qty } }
      );
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
