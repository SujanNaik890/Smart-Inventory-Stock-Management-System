// End-to-End Automated Acceptance Verification Script
// Tests all 8 Acceptance Test scenarios defined in the project specification

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log(' Starting StockSmart AI Acceptance Verification');
  console.log('====================================================');

  let token = '';

  // TEST 1: Authentication
  console.log('\n--> TEST 1: Admin Authentication & Route Protection');
  // Attempt unauthenticated request
  const unauthRes = await fetch(`${API_BASE}/products`);
  console.log(`Unauthenticated access status: ${unauthRes.status} (Expected: 401)`);
  if (unauthRes.status !== 401) throw new Error('Unauthenticated access was not blocked!');

  // Authenticate
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@stocksmart.ai', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) throw new Error('Login failed!');
  token = loginData.token;
  console.log(`✓ Login successful for: ${loginData.user.name} (${loginData.user.role})`);

  // Verify /me
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log(`✓ /auth/me verified: ${meData.user.email}`);

  // TEST 2: Product CRUD
  console.log('\n--> TEST 2: Product CRUD');
  const testSku = `TEST-OSC-${Date.now().toString().slice(-4)}`;
  const createProdRes = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Lab Test Oscilloscope Pro',
      sku: testSku,
      description: 'Precision test bench oscilloscope',
      category_id: 4, // Lab Equipment
      unit_price: 450.00,
      initial_quantity: 25,
      minimum_stock: 10,
      unit: 'units'
    })
  });
  const createProdData = await createProdRes.json();
  if (!createProdData.success) throw new Error(`Product creation failed: ${createProdData.message}`);
  const createdId = createProdData.product.id;
  console.log(`✓ Product created: ID=${createdId}, Name="${createProdData.product.name}", Qty=${createProdData.product.quantity}`);

  // Edit Product Name & Price
  const updateRes = await fetch(`${API_BASE}/products/${createdId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Lab Test Oscilloscope Pro (Calibrated)',
      unit_price: 475.00
    })
  });
  const updateData = await updateRes.json();
  console.log(`✓ Product updated: Name="${updateData.product.name}", Price=$${updateData.product.unit_price}`);

  // Search by SKU
  const searchRes = await fetch(`${API_BASE}/products?search=${testSku}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  if (searchData.products.length !== 1 || searchData.products[0].id !== createdId) {
    throw new Error('Search by SKU failed to locate newly created product!');
  }
  console.log(`✓ Search verified: Found product by SKU "${testSku}"`);

  // TEST 3: Stock In (Add 10 units -> 25 + 10 = 35)
  console.log('\n--> TEST 3: Stock In (Intake)');
  const stockInRes = await fetch(`${API_BASE}/stock/in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: createdId,
      quantity: 10,
      reference_number: 'PO-ACCEPT-001',
      notes: 'Acceptance test restock intake'
    })
  });
  const stockInData = await stockInRes.json();
  if (!stockInData.success || stockInData.product.quantity !== 35) {
    throw new Error(`Stock In failed! Expected quantity 35, got ${stockInData.product?.quantity}`);
  }
  console.log(`✓ Stock In recorded: ${stockInData.transaction.previous_quantity} + 10 = ${stockInData.product.quantity} units`);

  // TEST 4: Stock Out (Issue 8 units -> 35 - 8 = 27)
  console.log('\n--> TEST 4: Stock Out (Issue)');
  const stockOutRes = await fetch(`${API_BASE}/stock/out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: createdId,
      quantity: 8,
      recipient_destination: 'Electrical Eng Lab 1',
      reference_number: 'ISSUE-ACCEPT-001',
      reason: 'Course Lab Setup'
    })
  });
  const stockOutData = await stockOutRes.json();
  if (!stockOutData.success || stockOutData.product.quantity !== 27) {
    throw new Error(`Stock Out failed! Expected quantity 27, got ${stockOutData.product?.quantity}`);
  }
  console.log(`✓ Stock Out recorded: ${stockOutData.transaction.previous_quantity} - 8 = ${stockOutData.product.quantity} units`);

  // TEST 5: Stock Validation (Reject Over-issue)
  console.log('\n--> TEST 5: Stock Validation (Negative Inventory Prevention)');
  const overIssueRes = await fetch(`${API_BASE}/stock/out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: createdId,
      quantity: 50, // Available is only 27!
      recipient_destination: 'Unauthorized Wing'
    })
  });
  const overIssueData = await overIssueRes.json();
  console.log(`Status: ${overIssueRes.status} (Expected: 400)`);
  console.log(`Rejection message: "${overIssueData.message}"`);
  if (overIssueRes.status !== 400 || !overIssueData.message.includes('Insufficient stock')) {
    throw new Error('Over-issue request was not rejected properly!');
  }

  // Verify stock quantity remained strictly 27
  const checkRes = await fetch(`${API_BASE}/products/${createdId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const checkData = await checkRes.json();
  if (checkData.product.quantity !== 27) {
    throw new Error(`Stock quantity was corrupted! Expected 27, got ${checkData.product.quantity}`);
  }
  console.log(`✓ Inventory protected: Balance remained uncorrupted at ${checkData.product.quantity} units`);

  // TEST 6: Low Stock Alerts
  console.log('\n--> TEST 6: Low Stock Alerts');
  // Issue 22 units so balance drops to 5 (below minimum_stock = 10)
  await fetch(`${API_BASE}/stock/out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: createdId,
      quantity: 22,
      recipient_destination: 'Testing Low Threshold'
    })
  });
  const lowAlertsRes = await fetch(`${API_BASE}/reports/low-stock`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const lowAlertsData = await lowAlertsRes.json();
  const alertFound = lowAlertsData.items.find(a => a.id === createdId);
  if (!alertFound) throw new Error('Product did not trigger low stock alert when qty <= min_stock!');
  console.log(`✓ Low Stock Alert verified: "${alertFound.name}" has ${alertFound.current_quantity} / ${alertFound.minimum_stock} units (${alertFound.urgency})`);

  // TEST 7: Reports
  console.log('\n--> TEST 7: Inventory & Transaction Reports');
  const invReportRes = await fetch(`${API_BASE}/reports/inventory`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const invReportData = await invReportRes.json();
  console.log(`✓ Inventory Summary Report: Total Products=${invReportData.summary.totalProducts}, Total Units=${invReportData.summary.totalUnits}, Valuation=$${invReportData.summary.totalValuation}`);

  const txReportRes = await fetch(`${API_BASE}/reports/transactions?product_id=${createdId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const txReportData = await txReportRes.json();
  console.log(`✓ Transaction Audit Report for product: ${txReportData.transactions.length} verified operations recorded.`);

  // TEST 8: AI Inventory Assistant & Multi-format Report Generation
  console.log('\n--> TEST 8: AI Inventory Assistant Capabilities');
  const aiChatRes = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: `How many units of ${testSku} are in stock?` })
  });
  const aiChatData = await aiChatRes.json();
  console.log(`AI Chat Response snippet:\n${aiChatData.reply.slice(0, 150)}...`);

  const aiReportRes = await fetch(`${API_BASE}/ai/report-data`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const aiReportData = await aiReportRes.json();
  if (!aiReportData.success || !aiReportData.report.products) {
    throw new Error('AI report data generation failed!');
  }
  console.log(`✓ AI Comprehensive Report Data compiled: Title="${aiReportData.report.title}", Total SKUs=${aiReportData.report.summary.totalProducts}`);

  console.log('\n====================================================');
  console.log(' 🎉 ALL 8 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err.message);
  process.exit(1);
});
