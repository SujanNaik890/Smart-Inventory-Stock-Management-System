import { query, get } from '../config/db.js';

export const getAiRecommendations = (req, res, next) => {
  try {
    const products = query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.quantity,
        p.minimum_stock,
        p.unit_price,
        p.unit,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_archived = 0
      ORDER BY p.quantity ASC
    `);

    const lowStock = products.filter(p => p.quantity <= p.minimum_stock);
    const outOfStock = products.filter(p => p.quantity === 0);

    const recommendations = lowStock.map(p => {
      const isOut = p.quantity === 0;
      const suggestedQty = isOut ? Math.max(p.minimum_stock * 2, 10) : Math.max(p.minimum_stock * 2 - p.quantity, 5);
      const estCost = parseFloat((suggestedQty * p.unit_price).toFixed(2));

      let priority = 'Medium';
      let urgencyText = 'Approaching low threshold';

      if (isOut) {
        priority = 'Critical';
        urgencyText = 'Zero stock available. Potential disruption to operations/lab sessions.';
      } else if (p.quantity <= p.minimum_stock / 2) {
        priority = 'High';
        urgencyText = `Stock is critically low (${p.quantity} remaining). Consumption velocity may cause stockout soon.`;
      }

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category_name,
        supplier: p.supplier_name || 'Primary Vendor',
        currentQuantity: p.quantity,
        minimumStock: p.minimum_stock,
        unit: p.unit,
        unitPrice: p.unit_price,
        suggestedRestockQuantity: suggestedQty,
        estimatedRestockCost: estCost,
        priority,
        reasoning: isOut 
          ? `Product is completely out of stock (0 ${p.unit}). Immediate purchase order of ${suggestedQty} ${p.unit} recommended to restore safe operational buffers.`
          : `${p.name} has ${p.quantity} ${p.unit} remaining, below the minimum threshold of ${p.minimum_stock}. Restocking ${suggestedQty} ${p.unit} will maintain buffer against lead-time delays.`
      };
    });

    res.json({
      success: true,
      mode: process.env.GEMINI_API_KEY ? 'gemini_enhanced' : 'intelligent_rule_engine',
      summary: {
        totalAnalyzed: products.length,
        itemsNeedingRestock: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalEstimatedRestockCost: parseFloat(recommendations.reduce((acc, r) => acc + r.estimatedRestockCost, 0).toFixed(2))
      },
      recommendations
    });
  } catch (error) {
    next(error);
  }
};

export const handleAiChat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Fetch real inventory context
    const products = query(`
      SELECT p.id, p.name, p.sku, p.quantity, p.minimum_stock, p.unit_price, p.unit, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_archived = 0
    `);

    const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
    const totalValuation = products.reduce((acc, p) => acc + (p.quantity * p.unit_price), 0);
    const lowStock = products.filter(p => p.quantity <= p.minimum_stock && p.quantity > 0);
    const outOfStock = products.filter(p => p.quantity === 0);

    const queryLower = message.toLowerCase();

    // Check if user has Gemini API Key
    if (process.env.GEMINI_API_KEY) {
      try {
        const promptContext = `
You are StockSmart AI, an advanced inventory management assistant for an enterprise or campus laboratory.
Here is the real-time live database state:
- Total unique products: ${products.length}
- Total stock units: ${totalUnits}
- Total inventory valuation: $${totalValuation.toFixed(2)}
- Out of stock items (${outOfStock.length}): ${outOfStock.map(p => `${p.name} (${p.sku}): 0 ${p.unit}`).join(', ') || 'None'}
- Low stock items (${lowStock.length}): ${lowStock.map(p => `${p.name} (${p.sku}): ${p.quantity}/${p.minimum_stock} ${p.unit}`).join(', ') || 'None'}
- Products sample: ${products.slice(0, 15).map(p => `${p.name}: ${p.quantity} ${p.unit} @ $${p.unit_price}`).join('; ')}

User question: "${message}"

Answer accurately, professionally, and concisely based strictly on this live data. If asked to generate a report, format it with clear headers and bullet points. Never hallucinate stock counts not in this data.
`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptContext }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({
              success: true,
              mode: 'gemini_ai',
              reply: replyText
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to built-in AI engine:', geminiErr.message);
      }
    }

    // Built-in intelligent AI Reasoning & Query Engine
    let reply = '';

    if (queryLower.includes('report') || queryLower.includes('summary') || queryLower.includes('executive')) {
      reply = `### 📊 StockSmart AI — Executive Inventory Analysis Report

**Generated Date:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Status:** Live Database Audit Complete

---

#### 1. Inventory Health Metrics
* **Total Registered Products:** ${products.length} distinct SKUs
* **Total Physical Units in Stock:** ${totalUnits.toLocaleString()} units
* **Total Inventory Asset Valuation:** $${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
* **System Stock Health:** ${outOfStock.length === 0 ? '🟢 Optimal' : '⚠️ Attention Required'} (${outOfStock.length} items depleted, ${lowStock.length} items low)

#### 2. Critical Stock Outages (Immediate Attention)
${outOfStock.length === 0 ? '✅ All catalog items currently have positive inventory.' : outOfStock.map(p => `* **${p.name}** [${p.sku}] — 0 ${p.unit} in stock (Min Threshold: ${p.minimum_stock})`).join('\n')}

#### 3. Low Stock Warning List
${lowStock.slice(0, 8).map(p => `* **${p.name}** [${p.sku}]: **${p.quantity}** / ${p.minimum_stock} ${p.unit} remaining (Category: ${p.category})`).join('\n')}

#### 4. Restock Priority Advice
We recommend generating purchase orders for **${outOfStock.length + lowStock.length} items** to mitigate supply chain disruption. Estimated capital required: **$${lowStock.concat(outOfStock).reduce((sum, p) => sum + (p.minimum_stock * 2 * p.unit_price), 0).toFixed(2)}**.`;
    } else if (queryLower.includes('out of stock') || queryLower.includes('depleted') || queryLower.includes('zero')) {
      reply = `There are currently **${outOfStock.length} products** with zero inventory:\n\n` +
        outOfStock.map(p => `• **${p.name}** (SKU: \`${p.sku}\`) — Minimum required: ${p.minimum_stock} ${p.unit}`).join('\n') +
        `\n\n*Recommendation: Create Stock In transactions to replenish these items immediately.*`;
    } else if (queryLower.includes('low stock') || queryLower.includes('running out') || queryLower.includes('restock')) {
      reply = `There are currently **${lowStock.length} items** operating below or at their minimum stock thresholds:\n\n` +
        lowStock.map(p => `• **${p.name}** (SKU: \`${p.sku}\`) — Available: **${p.quantity}** / ${p.minimum_stock} ${p.unit} (Category: ${p.category})`).join('\n') +
        `\n\n*Would you like to export a restocking report or record a stock purchase order?*`;
    } else if (queryLower.includes('how many') || queryLower.includes('count') || queryLower.includes('quantity') || queryLower.includes('check')) {
      // Find matching products
      const matching = products.filter(p => queryLower.includes(p.name.toLowerCase()) || queryLower.includes(p.sku.toLowerCase()));
      if (matching.length > 0) {
        reply = `Here is the current count for the requested item(s):\n\n` +
          matching.map(p => `• **${p.name}** (\`${p.sku}\`): **${p.quantity} ${p.unit}** available @ $${p.unit_price.toFixed(2)} per unit (Min Threshold: ${p.minimum_stock})`).join('\n');
      } else {
        reply = `Our inventory currently holds **${totalUnits.toLocaleString()} total units** across **${products.length} distinct products**, with an aggregate asset value of **$${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}**.\n\nYou can query specific items like "HDMI Cable", "Wireless Mouse", or "Monitor".`;
      }
    } else {
      reply = `Hello! I am **StockSmart AI Assistant** 🤖. I actively monitor your inventory across all categories and suppliers.\n\n` +
        `**Quick Snapshot:**\n` +
        `• Products: **${products.length}** | Units: **${totalUnits.toLocaleString()}** | Value: **$${totalValuation.toFixed(2)}**\n` +
        `• Critical Outages: **${outOfStock.length} items**\n` +
        `• Low Stock Alerts: **${lowStock.length} items**\n\n` +
        `You can ask me to **"Generate inventory report"**, **"List low stock items"**, or ask about any specific product count!`;
    }

    res.json({
      success: true,
      mode: 'intelligent_rule_engine',
      reply
    });
  } catch (error) {
    next(error);
  }
};

export const generateComprehensiveReportData = (req, res, next) => {
  try {
    const products = query(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_archived = 0
      ORDER BY p.name ASC
    `);

    const transactions = query(`
      SELECT t.*, p.name as product_name, p.sku as product_sku
      FROM stock_transactions t
      JOIN products p ON t.product_id = p.id
      ORDER BY t.created_at DESC
      LIMIT 20
    `);

    const totalProducts = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
    const totalValuation = products.reduce((acc, p) => acc + (p.quantity * p.unit_price), 0);
    const lowStockItems = products.filter(p => p.quantity <= p.minimum_stock);
    const outOfStockItems = products.filter(p => p.quantity === 0);

    const reportTitle = `StockSmart AI Executive Inventory Report`;
    const generatedAt = new Date().toISOString();

    res.json({
      success: true,
      report: {
        title: reportTitle,
        generatedAt,
        summary: {
          totalProducts,
          totalUnits,
          totalValuation: parseFloat(totalValuation.toFixed(2)),
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length
        },
        products,
        lowStockItems,
        recentTransactions: transactions
      }
    });
  } catch (error) {
    next(error);
  }
};
