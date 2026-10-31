const http = require('http');
const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE JBB SALES TEST SUITE ---');

  const BASE_URL = 'http://localhost:3000';

  // 1. Test Products API - Search by keyword
  console.log('\n[TEST 1] Testing Product search by keyword "snooker"...');
  let res = await fetch(`${BASE_URL}/api/products?search=snooker`);
  let data = await res.json();
  if (!res.ok || !data.products || data.products.length === 0) {
    throw new Error('Keyword search failed');
  }
  console.log(`✓ Found ${data.products.length} products matching "snooker"`);
  const snookerTable = data.products.find((p) => p.sku === 'JBB-TBL-12FT-ENG');
  console.log(`✓ Product: "${snookerTable.name}" | Cost: ₹${snookerTable.cost_price} | Rec: ₹${snookerTable.recommended_price}`);

  // 2. Test Customer Quick Add API
  console.log('\n[TEST 2] Testing Quick Add Customer during sale creation...');
  res = await fetch(`${BASE_URL}/api/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Grand Hyatt Snooker Club',
      phone: '+91 99887 76655',
      company: 'Hyatt Leisure Group',
    }),
  });
  data = await res.json();
  if (!res.ok || !data.customer) {
    throw new Error('Quick add customer failed: ' + JSON.stringify(data));
  }
  const newCustomer = data.customer;
  console.log(`✓ Customer created: "${newCustomer.name}" (ID: ${newCustomer.id})`);

  // 3. Test Multi-Product Sale Creation with Negotiated Prices, Cost Snapshot & Charges
  console.log('\n[TEST 3] Creating Multi-Product Sale with negotiated prices & courier charges...');
  // Items:
  // 1x 12ft Snooker Table (Cost: 185,000, Sold for negotiated 230,000)
  // 2x 3/4 Ash Cues (Cost: 4,200 each, Sold for negotiated 6,200 each)
  // Courier: Charged ₹3,000, Actual cost ₹2,200
  // Other: Charged ₹1,500, Actual cost ₹1,000
  // Expected Revenue: 230,000 + 12,400 + 3,000 + 1,500 = ₹246,900
  // Expected Total Cost: 185,000 + 8,400 + 2,200 + 1,000 = ₹196,600
  // Expected Gross Profit: 246,900 - 196,600 = ₹50,300
  // Expected Gross Margin: (50,300 / 246,900) * 100 = 20.37%

  const ashCue = data.customer ? (await (await fetch(`${BASE_URL}/api/products?search=ash`)).json()).products[0] : null;

  res = await fetch(`${BASE_URL}/api/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      salespersonId: '00000000-0000-0000-0000-000000000002', // Rahul
      customerId: newCustomer.id,
      items: [
        { productId: snookerTable.id, quantity: 1, sellingPrice: 230000 },
        { productId: ashCue.id, quantity: 2, sellingPrice: 6200 },
      ],
      courierCharge: 3000,
      courierCost: 2200,
      otherCharge: 1500,
      otherCost: 1000,
      notes: 'Initial test tournament delivery',
      initialPayment: {
        amount: 100000,
        paymentMethod: 'bank_transfer',
        notes: 'Advance UTR-829104829',
        proofs: [
          {
            fileName: 'advance_payment_screenshot.jpg',
            mimeType: 'image/jpeg',
            dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
            size: 45000,
          },
        ],
      },
    }),
  });

  data = await res.json();
  if (!res.ok || !data.sale) {
    throw new Error('Sale creation failed: ' + JSON.stringify(data));
  }
  const createdSale = data.sale;
  console.log(`✓ Sale created: ${createdSale.sale_number}`);
  console.log(`  Revenue: ₹${createdSale.total_revenue} (Expected: 246900)`);
  console.log(`  Total Cost: ₹${createdSale.total_cost} (Expected: 196600)`);
  console.log(`  Gross Profit: ₹${createdSale.gross_profit} (Expected: 50300)`);
  console.log(`  Margin: ${createdSale.gross_margin}% (Expected: ~20.37%)`);
  console.log(`  Payment Status: ${createdSale.payment_status} (Expected: partially_paid)`);
  console.log(`  Paid: ₹${createdSale.total_paid} | Outstanding: ₹${createdSale.outstanding}`);

  const expectedProductCost = snookerTable.cost_price + (ashCue.cost_price * 2);
  const expectedTotalCost = expectedProductCost + 2200 + 1000;
  const expectedProfit = 246900 - expectedTotalCost;

  if (createdSale.total_revenue !== 246900 || createdSale.gross_profit !== expectedProfit) {
    throw new Error(`Financial calculation mismatch on created sale! Got profit: ${createdSale.gross_profit}, expected: ${expectedProfit}`);
  }

  // 4. Test Adding Additional Payment Proof Later
  console.log('\n[TEST 4] Adding additional payment proof to existing payment...');
  const firstPaymentId = createdSale.payments[0].id;
  res = await fetch(`${BASE_URL}/api/sales/${createdSale.id}/proofs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: firstPaymentId,
      fileName: 'bank_stamp_receipt.jpg',
      mimeType: 'image/jpeg',
      dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg2==',
      size: 52000,
    }),
  });
  data = await res.json();
  if (!res.ok) throw new Error('Adding extra proof failed: ' + JSON.stringify(data));
  console.log(`✓ Second proof attached. Total proofs for payment 1: ${data.sale.payments[0].proofs.length}`);

  // 5. Test Adding Second Payment (Remaining Balance to Reach Fully Paid)
  console.log('\n[TEST 5] Adding second payment to clear outstanding balance...');
  const remaining = createdSale.outstanding; // 146,900
  res = await fetch(`${BASE_URL}/api/sales/${createdSale.id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: remaining,
      paymentMethod: 'upi',
      notes: 'Final balance settlement',
      proofs: [
        {
          fileName: 'upi_final_settlement.jpg',
          mimeType: 'image/jpeg',
          dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg3==',
          size: 61000,
        },
      ],
    }),
  });
  data = await res.json();
  if (!res.ok || !data.sale) throw new Error('Second payment failed: ' + JSON.stringify(data));
  const fullyPaidSale = data.sale;
  console.log(`✓ Second payment of ₹${remaining} recorded.`);
  console.log(`  New Payment Status: ${fullyPaidSale.payment_status} (Expected: paid)`);
  console.log(`  Outstanding Due: ₹${fullyPaidSale.outstanding} (Expected: 0)`);
  if (fullyPaidSale.payment_status !== 'paid' || fullyPaidSale.outstanding !== 0) {
    throw new Error('Payment status did not transition to paid!');
  }

  // 6. Test Historical Snapshot Integrity: Change product current cost
  console.log('\n[TEST 6] Testing Historical Cost Snapshot Integrity...');
  const originalCost = snookerTable.cost_price;
  console.log(`  Original Table Cost: ₹${originalCost}`);
  const updatedCost = originalCost + 25000; // Cost increases in catalog
  res = await fetch(`${BASE_URL}/api/products/${snookerTable.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cost_price: updatedCost }),
  });
  data = await res.json();
  console.log(`  Product cost updated in catalog to: ₹${data.product.cost_price}`);

  // Now verify that the previously created sale STILL retains the original cost at sale and original profit
  const verifySaleRes = await fetch(`${BASE_URL}/api/sales/${createdSale.id}`);
  const verifySaleData = await verifySaleRes.json();
  const pastTableItem = verifySaleData.sale.items.find((i) => i.product_id === snookerTable.id);
  console.log(`  Historical sale item cost snapshot: ₹${pastTableItem.cost_at_sale}`);
  console.log(`  Historical sale profit: ₹${verifySaleData.sale.gross_profit}`);
  if (pastTableItem.cost_at_sale !== originalCost || verifySaleData.sale.gross_profit !== expectedProfit) {
    throw new Error('Historical integrity violated! Cost was overwritten by current catalog price!');
  }
  console.log('✓ Historical cost snapshot verified intact! Profit was not corrupted.');

  // 7. Test Admin Analytics
  console.log('\n[TEST 7] Testing Company Analytics API...');
  res = await fetch(`${BASE_URL}/api/analytics/summary`, {
    headers: { Cookie: 'jbb_user_role=admin; jbb_user_id=00000000-0000-0000-0000-000000000001' },
  });
  data = await res.json();
  console.log(`✓ Company Analytics: Revenue ₹${data.summary.totalRevenue} | Profit ₹${data.summary.totalGrossProfit} | Margin ${data.summary.grossMargin.toFixed(1)}%`);

  // 8. Test Salespeople Comparison Analytics
  console.log('\n[TEST 8] Testing Salespeople Comparison Analytics...');
  res = await fetch(`${BASE_URL}/api/analytics/salespeople`, {
    headers: { Cookie: 'jbb_user_role=admin; jbb_user_id=00000000-0000-0000-0000-000000000001' },
  });
  data = await res.json();
  console.log(`✓ Salespeople evaluated: ${data.salespeople.length}`);
  data.salespeople.forEach((sp) => {
    console.log(`  - ${sp.salespersonName}: Revenue ₹${sp.revenue} | Profit ₹${sp.profit} | Margin ${sp.margin.toFixed(1)}% | Orders: ${sp.salesCount}`);
  });

  // 9. Test Pricing History & Discounting Analytics
  console.log('\n[TEST 9] Testing Product Pricing History Analytics...');
  res = await fetch(`${BASE_URL}/api/analytics/pricing`);
  data = await res.json();
  const pricingItem = data.products.find((p) => p.productId === snookerTable.id);
  console.log(`✓ Product "${pricingItem.productName}":`);
  console.log(`  Times Sold: ${pricingItem.timesSold} | Avg Sold Price: ₹${pricingItem.avgSellingPrice} | Realized Margin: ${pricingItem.avgMargin.toFixed(1)}%`);

  // 10. Test Customer Reassignment
  console.log('\n[TEST 10] Testing Customer Reassignment by Admin...');
  res = await fetch(`${BASE_URL}/api/customers/${newCustomer.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reassignToSalespersonId: '00000000-0000-0000-0000-000000000003' }), // Reassign to Amit
  });
  data = await res.json();
  console.log(`✓ Customer reassigned to: ${data.customer.assigned_salesperson?.full_name}`);

  // Verify historical sale still retains Rahul as salesperson
  const checkHistoricSale = await (await fetch(`${BASE_URL}/api/sales/${createdSale.id}`)).json();
  console.log(`✓ Past sale salesperson retained: ${checkHistoricSale.sale.salesperson?.full_name} (Rahul Sharma)`);
  if (checkHistoricSale.sale.salesperson_id !== '00000000-0000-0000-0000-000000000002') {
    throw new Error('Customer reassignment corrupted historic sale salesperson!');
  }

  console.log('\n--- ALL TEST SUITE ASSERTIONS PASSED SUCCESSFULLY ---');
}

runTests().catch((e) => {
  console.error('\nTEST FAILED:', e);
  process.exit(1);
});
