// SaaS ERP Application State
const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3001' : window.location.origin;
let currentCompanyId = null;
let currentCustomerId = null;
let currentSupplierId = null;
let currentProductId = null;
let currentOrgId = 'a1000000-0000-0000-0000-000000000001';
let currentUserEmail = 'Techmastersinnocations@gmail.com';

// Custom Non-Intrusive Toast System
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  toast.innerHTML = `
    <div style="font-weight:bold; font-size:1.2rem; color:var(--${type === 'error' ? 'danger' : type === 'info' ? 'accent-cyan' : 'success'});">${iconMap[type] || '✓'}</div>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapCompany();
});

function launchDemoApp() {
  document.getElementById('landing-view').style.display = 'none';
  document.getElementById('landing-nav').style.display = 'none';
  document.getElementById('app-layout').style.display = 'flex';
  switchView('dashboard');
}

function exitAppToLanding() {
  document.getElementById('app-layout').style.display = 'none';
  document.getElementById('landing-view').style.display = 'block';
  document.getElementById('landing-nav').style.display = 'flex';
  window.scrollTo(0, 0);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Landing Page Showcase Tab Switcher
function switchShowcaseTab(tab) {
  document.querySelectorAll('.showcase-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = Array.from(document.querySelectorAll('.showcase-tabs .tab-btn')).find(b => b.getAttribute('onclick')?.includes(tab));
  if (targetBtn) targetBtn.classList.add('active');

  const container = document.getElementById('showcase-content');

  if (tab === 'cascade') {
    container.innerHTML = `
      <h4 style="color:var(--accent-gold); margin-bottom:12px;">Automated Single-Entry Operational Cascade</h4>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">
        Creating a single Sales Invoice instantly triggers:
      </p>
      <ul style="color:var(--text-main); font-size:0.9rem; line-height:1.8; margin-left:20px;">
        <li>Stock Ledger Outward posting (-5 Units, FIFO Valuation)</li>
        <li>Customer Accounts Receivable (AR) Ledger update (+₹14,750.00)</li>
        <li>Output CGST (9%) & SGST (9%) liability posting (₹1,125.00 each)</li>
        <li>Double-Entry General Ledger journal entries (Debit AR, Credit Sales Revenue & Taxes)</li>
      </ul>
    `;
  } else if (tab === 'einvoice') {
    container.innerHTML = `
      <h4 style="color:var(--accent-cyan); margin-bottom:12px;">Government e-Invoice (IRN & Signed QR Code)</h4>
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-slate); padding:16px; border-radius:8px; font-family:monospace; font-size:0.82rem;">
        <span style="color:var(--accent-gold);">IRN:</span> 8f9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b<br/>
        <span style="color:var(--accent-cyan);">Ack No:</span> 1226109847562 | <span style="color:var(--accent-cyan);">Ack Date:</span> 2026-08-27T04:00:00Z<br/>
        <span style="color:var(--success);">Status:</span> GENERATED_AND_SIGNED
      </div>
    `;
  } else if (tab === 'reports') {
    container.innerHTML = `
      <h4 style="color:var(--success); margin-bottom:12px;">Double-Entry Financial Statements (Balance Sheet Equation)</h4>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:0.9rem;">
        <div style="background:rgba(16,185,129,0.08); padding:12px; border-radius:8px;">
          <strong>Total Assets:</strong> ₹1,45,000.00
        </div>
        <div style="background:rgba(59,130,246,0.08); padding:12px; border-radius:8px;">
          <strong>Liabilities + Equity:</strong> ₹1,45,000.00
        </div>
      </div>
      <p style="color:var(--success); font-size:0.85rem; margin-top:12px; font-weight:700;">Balance Sheet Equation (Assets = Liabilities + Equity) Verified Clean!</p>
    `;
  } else if (tab === 'gst') {
    container.innerHTML = `
      <h4 style="color:var(--warning); margin-bottom:12px;">GSTR-2B Automated Purchase Reconciliation</h4>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:12px;">
        Automated matching of supplier purchase invoices against portal 2B data:
      </p>
      <div style="font-size:0.85rem; line-height:1.6;">
        <span class="badge badge-paid">MATCHED</span> Supplier 27BBBBB5678B1Z2 (Global Microchips) — ITC Allowed: ₹4,500.00
      </div>
    `;
  }
}

// Bootstrap active company & masters
async function bootstrapCompany() {
  try {
    const custRes = await fetch(`${API_BASE}/customers`);
    if (custRes.ok) {
      const customers = await custRes.json();
      if (customers.length > 0) {
        currentCompanyId = customers[0].company_id;
        currentCustomerId = customers[0].id;
      }
    }
  } catch (err) {
    console.warn('Bootstrap note:', err);
  }
}

// --- 1. Real Business Registration Modal ---
function openRegisterModal() {
  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-content" style="max-width: 650px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-slate); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; color:white;">Register Your Business / Firm</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Requires Techmasters Super Admin Approval</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
        </div>

        <form onsubmit="handleRegisterSubmit(event)">
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label>Organization / Business Legal Name *</label>
              <input type="text" id="reg-org-name" class="form-control" placeholder="e.g. Apex Engineering Solutions Pvt Ltd" required />
            </div>
            <div class="form-group">
              <label>Trade Name (If Different)</label>
              <input type="text" id="reg-trade-name" class="form-control" placeholder="e.g. Apex Solutions" />
            </div>
            <div class="form-group">
              <label>GSTIN (15-Digit Indian GST) *</label>
              <input type="text" id="reg-gstin" class="form-control" value="29AAACA1234A1Z5" placeholder="e.g. 29AAAAA0000A1Z5" required />
            </div>
            <div class="form-group">
              <label>State / Union Territory *</label>
              <select id="reg-state" class="form-control" required>
                <option value="Karnataka" selected>Karnataka (29)</option>
                <option value="Maharashtra">Maharashtra (27)</option>
                <option value="Tamil Nadu">Tamil Nadu (33)</option>
                <option value="Delhi">Delhi (07)</option>
                <option value="Telangana">Telangana (36)</option>
                <option value="Gujarat">Gujarat (24)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mobile Phone Number *</label>
              <input type="tel" id="reg-phone" class="form-control" placeholder="e.g. +91 9880768222" required />
            </div>
            <div class="form-group">
              <label>Owner Full Name *</label>
              <input type="text" id="reg-full-name" class="form-control" placeholder="e.g. Sachin Dev" required />
            </div>
            <div class="form-group">
              <label>Business Email Address *</label>
              <input type="email" id="reg-email" class="form-control" placeholder="e.g. owner@apexengineering.in" required />
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label>Password (Min 6 characters) *</label>
              <input type="password" id="reg-password" class="form-control" placeholder="••••••••" minlength="6" required />
            </div>
          </div>

          <div style="margin-top:24px; text-align:right;">
            <button type="submit" class="btn btn-primary" style="width:100%;">Submit Registration for Super Admin Approval</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const payload = {
    organizationName: document.getElementById('reg-org-name').value,
    tradeName: document.getElementById('reg-trade-name').value,
    gstin: document.getElementById('reg-gstin').value,
    state: document.getElementById('reg-state').value,
    phone: document.getElementById('reg-phone').value,
    ownerEmail: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value,
    fullName: document.getElementById('reg-full-name').value,
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast('Registration Submitted', `${payload.organizationName} is registered. Awaiting Super Admin approval.`, 'success');
      closeModal();
    } else {
      const err = await res.json();
      showToast('Registration Failed', err.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Connection Error', err.message, 'error');
  }
}

// --- 2. Client & Super Admin Login Modal ---
function openLoginModal() {
  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-content" style="max-width: 480px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-slate); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; color:white;">Sign In to Business Portal</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Techmasters Innovations SaaS Gateway</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
        </div>

        <form onsubmit="handleLoginSubmit(event)">
          <div class="form-group" style="margin-bottom:16px;">
            <label>Registered Business or Super Admin Email</label>
            <input type="email" id="login-email" class="form-control" value="Techmastersinnocations@gmail.com" required />
          </div>
          <div class="form-group" style="margin-bottom:20px;">
            <label>Password</label>
            <input type="password" id="login-password" class="form-control" value="Fri10Feb@2023" required />
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;">Sign In</button>
        </form>
      </div>
    </div>
  `;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const payload = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value,
  };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      currentOrgId = data.organizationId;
      if (data.companyId) currentCompanyId = data.companyId;
      currentUserEmail = data.email;
      showToast('Access Granted', `Welcome back, ${data.fullName} (${data.role})!`, 'success');
      closeModal();
      launchDemoApp();
    } else {
      const err = await res.json();
      showToast('Login Failed', err.message || 'Invalid credentials', 'error');
    }
  } catch (err) {
    showToast('Auth Error', err.message, 'error');
  }
}

// Seed Demo Data
async function seedSampleData() {
  try {
    const compId = currentCompanyId || 'c4021a8a-e99d-4fa0-8f92-56fa476a6d01';
    currentCompanyId = compId;

    const custRes = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: compId,
        name: 'Apex Infotech Pvt Ltd',
        gstin: '29AAACA1234A1Z5',
        email: 'billing@apexinfotech.com',
        phone: '9876543210',
        billingAddress: 'MG Road, Indiranagar',
        state: 'Karnataka',
        pincode: '560038',
        openingBalance: 0,
      }),
    });
    const cust = await custRes.json();
    currentCustomerId = cust.id;

    const suppRes = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: compId,
        name: 'Global Microchips Distribution',
        gstin: '27BBBBB5678B1Z2',
        email: 'sales@globalmicro.com',
        address: 'Bandra East',
        state: 'Maharashtra',
        openingBalance: 0,
      }),
    });
    const supp = await suppRes.json();
    currentSupplierId = supp.id;

    const prodRes = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: compId,
        name: 'Industrial Microcontroller Unit (MCU-V2)',
        sku: 'MCU-V2-001',
        hsn_code: '8542',
        unit: 'PCS',
        gst_rate: 18,
        purchase_price: 1500,
        selling_price: 2500,
        is_service: false,
      }),
    });
    const prod = await prodRes.json();
    currentProductId = prod.id;

    showToast('Demo Data Seeded', 'Customer, Supplier, and Product master data ready.', 'success');
    switchView(currentView);
  } catch (err) {
    showToast('Seeding Error', err.message, 'error');
  }
}

// Navigation View Switcher
let currentView = 'dashboard';
function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.nav-item button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`nav-${viewName}`);
  if (btn) btn.classList.add('active');

  const titleMap = {
    dashboard: 'Executive Overview Dashboard',
    sales: 'Sales Invoicing & Billing',
    orders: 'Purchase Orders & Sales Quotations',
    purchases: 'Purchases & Supplier Bills',
    inventory: 'Real-Time Inventory Stock Ledger',
    production: 'Manufacturing Bill of Materials (BOM) & Work Orders',
    transfers: 'Multi-Warehouse Inter-Branch Stock Transfers',
    jobwork: 'Job Work Subcontracting & Form ITC-04 Engine',
    fixedassets: 'Fixed Asset Register & Statutory Depreciation (WDV / SLM)',
    payroll: 'Statutory Payroll & Monthly Salary Slips (PF, ESI, PT)',
    consolidation: 'Multi-Company Group Financial Consolidation & Eliminations',
    bankrec: 'Automated Bank Statement Reconciliation & BRS Engine',
    tds: 'Income Tax TDS & TCS Compliance Engine (Form 26Q)',
    payments: 'Payments & Overdue Reminders',
    reports: 'Financial Statements (P&L, Balance Sheet, Trial Balance)',
    gst: 'GST Compliance, e-Invoice & Annual GSTR-9 Audit Return',
    forex: 'Multi-Currency Forex Exchange Engine',
    analytics: 'Executive Growth & Profitability Analytics',
    admin: 'Super Admin Tenant Registration Approval Portal',
    subscriptions: 'SaaS Multi-Tenant Subscription Engine',
    'import-export': 'Data Bulk CSV Export & Import',
    audit: 'System Security & Action Audit Trail',
  };
  document.getElementById('current-page-title').innerText = titleMap[viewName] || 'ERP Dashboard';

  const viewContainer = document.getElementById('app-view');
  if (viewName === 'dashboard') renderDashboard(viewContainer);
  else if (viewName === 'sales') renderSales(viewContainer);
  else if (viewName === 'orders') renderOrders(viewContainer);
  else if (viewName === 'purchases') renderPurchases(viewContainer);
  else if (viewName === 'inventory') renderInventory(viewContainer);
  else if (viewName === 'production') renderProduction(viewContainer);
  else if (viewName === 'transfers') renderTransfers(viewContainer);
  else if (viewName === 'jobwork') renderJobWork(viewContainer);
  else if (viewName === 'fixedassets') renderFixedAssets(viewContainer);
  else if (viewName === 'payroll') renderPayroll(viewContainer);
  else if (viewName === 'consolidation') renderConsolidation(viewContainer);
  else if (viewName === 'bankrec') renderBankRec(viewContainer);
  else if (viewName === 'tds') renderTds(viewContainer);
  else if (viewName === 'payments') renderPayments(viewContainer);
  else if (viewName === 'reports') renderReports(viewContainer);
  else if (viewName === 'gst') renderGst(viewContainer);
  else if (viewName === 'forex') renderForex(viewContainer);
  else if (viewName === 'analytics') renderAnalytics(viewContainer);
  else if (viewName === 'admin') renderAdminApprovals(viewContainer);
  else if (viewName === 'subscriptions') renderSubscriptions(viewContainer);
  else if (viewName === 'import-export') renderImportExport(viewContainer);
  else if (viewName === 'audit') renderAudit(viewContainer);
}

// --- 1. Dashboard View ---
async function renderDashboard(container) {
  container.innerHTML = `<div style="color: var(--text-muted);">Loading live dashboard metrics...</div>`;
  const compId = currentCompanyId || '';

  let gstSummary = { output_tax: { total_output: 0 }, input_tax_credit: { total_itc: 0 }, net_tax_payable: 0 };
  let stockSummary = [];
  let salesList = [];
  let purchasesList = [];

  if (compId) {
    try {
      const [gRes, sRes, saRes, puRes] = await Promise.all([
        fetch(`${API_BASE}/gst/summary?companyId=${compId}`),
        fetch(`${API_BASE}/inventory/summary?companyId=${compId}`),
        fetch(`${API_BASE}/sales/invoices?companyId=${compId}`),
        fetch(`${API_BASE}/purchases/invoices?companyId=${compId}`),
      ]);
      if (gRes.ok) gstSummary = await gRes.json();
      if (sRes.ok) stockSummary = await sRes.json();
      if (saRes.ok) salesList = await saRes.json();
      if (puRes.ok) purchasesList = await puRes.json();
    } catch (e) {
      console.warn(e);
    }
  }

  const totalSales = salesList.reduce((acc, i) => acc + Number(i.grand_total || 0), 0);
  const totalPurchases = purchasesList.reduce((acc, i) => acc + Number(i.grand_total || 0), 0);
  const totalAR = salesList.reduce((acc, i) => acc + Number(i.balance_due || 0), 0);
  const stockValuation = stockSummary.reduce((acc, i) => acc + Number(i.stock_value || 0), 0);

  container.innerHTML = `
    <div class="grid-stats">
      <div class="card">
        <div class="card-title">Total Sales Revenue</div>
        <div class="card-value">₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub text-success">${salesList.length} Invoices Issued</div>
      </div>
      <div class="card">
        <div class="card-title">Total Purchases Spend</div>
        <div class="card-value">₹${totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub text-warning">${purchasesList.length} Bills Recorded</div>
      </div>
      <div class="card">
        <div class="card-title">Accounts Receivable (AR)</div>
        <div class="card-value">₹${totalAR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub text-danger">Outstanding Collections</div>
      </div>
      <div class="card">
        <div class="card-title">Stock Ledger Valuation</div>
        <div class="card-value">₹${stockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub text-success">Inventory Asset Balance</div>
      </div>
      <div class="card">
        <div class="card-title">Net GST Liability</div>
        <div class="card-value">₹${gstSummary.net_tax_payable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub text-warning">Output ₹${gstSummary.output_tax.total_output} - ITC ₹${gstSummary.input_tax_credit.total_itc}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Recent Sales Invoices</h3>
        <button class="btn btn-primary btn-sm" onclick="switchView('sales')">Create Invoice</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Place of Supply</th>
            <th>Subtotal</th>
            <th>Tax Amount</th>
            <th>Grand Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${salesList.length === 0 ? '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No sales invoices created yet. Click "Create Invoice" to generate your first invoice.</td></tr>' : 
            salesList.map(inv => `
              <tr>
                <td><strong>${inv.invoice_number}</strong></td>
                <td>${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                <td>${inv.place_of_supply} ${inv.is_inter_state ? '(IGST)' : '(CGST+SGST)'}</td>
                <td>₹${Number(inv.subtotal).toFixed(2)}</td>
                <td>₹${(Number(inv.cgst_total) + Number(inv.sgst_total) + Number(inv.igst_total)).toFixed(2)}</td>
                <td><strong>₹${Number(inv.grand_total).toFixed(2)}</strong></td>
                <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 2. Manufacturing Production Orders View ---
async function renderProduction(container) {
  const compId = currentCompanyId || '';
  let orders = [];
  let boms = [];
  if (compId) {
    const [oRes, bRes] = await Promise.all([
      fetch(`${API_BASE}/production/orders?companyId=${compId}`).catch(() => null),
      fetch(`${API_BASE}/production/bom?companyId=${compId}`).catch(() => null),
    ]);
    if (oRes && oRes.ok) orders = await oRes.json();
    if (bRes && bRes.ok) boms = await bRes.json();
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <h2>Manufacturing Bill of Materials (BOM) & Work Orders</h2>
      <button class="btn btn-primary" onclick="runProductionOrderModal()">Execute Production Work Order</button>
    </div>

    <div class="grid-stats">
      <div class="card">
        <div class="card-title">Completed Work Orders</div>
        <div class="card-value text-success">${orders.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Active BOM Recipes</div>
        <div class="card-value text-warning">${boms.length}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Production Orders Execution Audit Trail</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Production #</th>
            <th>Date</th>
            <th>Finished Product ID</th>
            <th>Quantity Produced</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">No production orders executed.</td></tr>' :
            orders.map(o => `
              <tr>
                <td><strong>${o.production_number}</strong></td>
                <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                <td>${o.finished_product_id}</td>
                <td><strong class="text-success">${o.quantity_to_produce} Units</strong></td>
                <td><span class="badge badge-paid">${o.status}</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

async function runProductionOrderModal() {
  const compId = currentCompanyId || 'c4021a8a-e99d-4fa0-8f92-56fa476a6d01';
  const prodId = currentProductId || 'a3000000-0000-4000-8000-000000000003';
  const whId = 'a1000000-0000-4000-8000-000000000001';
  const nextNumber = `WO-2026-${Math.floor(100 + Math.random() * 900)}`;

  try {
    const res = await fetch(`${API_BASE}/production/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: compId,
        productionNumber: nextNumber,
        finishedProductId: prodId,
        quantityToProduce: 100,
        warehouseId: whId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      showToast('Work Order Executed', `${data.production_number} created. 100 units produced. GL & Stock Ledgers posted.`, 'success');
      switchView('production');
    } else {
      showToast('Execution Failed', 'Production order could not be completed.', 'error');
    }
  } catch (err) {
    showToast('Execution Error', err.message, 'error');
  }
}

// --- 3. Bank Reconciliation View ---
async function renderBankRec(container) {
  const compId = currentCompanyId || '';
  let brs = { bankStatementBalance: 0, internalCashbookBalance: 0, unreconciledVariance: 0, statementSummary: { totalStatements: 0, matchedCount: 0, unreconciledCount: 0, reconciliationRatePercent: 100 } };
  if (compId) {
    const res = await fetch(`${API_BASE}/bank-reconciliation/brs?companyId=${compId}`).catch(() => null);
    if (res && res.ok) brs = await res.json();
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <h2>Automated Bank Statement Reconciliation (BRS Engine)</h2>
      <button class="btn btn-primary" onclick="runAutoBankReconciliation()">Run Auto-Matching Engine</button>
    </div>

    <div class="grid-stats">
      <div class="card">
        <div class="card-title">Bank Statement Balance</div>
        <div class="card-value text-success">₹${brs.bankStatementBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub">Bank Feed Ledger</div>
      </div>
      <div class="card">
        <div class="card-title">Internal Cashbook Balance</div>
        <div class="card-value text-warning">₹${brs.internalCashbookBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub">Internal ERP Payments Ledger</div>
      </div>
      <div class="card">
        <div class="card-title">Unreconciled BRS Variance</div>
        <div class="card-value ${brs.unreconciledVariance === 0 ? 'text-success' : 'text-danger'}">₹${brs.unreconciledVariance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub">${brs.statementSummary.reconciliationRatePercent}% Reconciled</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Bank Reconciliation Statement (BRS Summary)</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Line Item / Category</th>
            <th>Description</th>
            <th>Amount (₹)</th>
            <th>Match Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Bank Statement Closing Balance</strong></td>
            <td>Net credit balance per official bank feed</td>
            <td>₹${brs.bankStatementBalance.toFixed(2)}</td>
            <td><span class="badge badge-paid">BANK CONFIRMED</span></td>
          </tr>
          <tr>
            <td><strong>Internal ERP Cashbook Balance</strong></td>
            <td>Net cash/bank balance per accounting ledger</td>
            <td>₹${brs.internalCashbookBalance.toFixed(2)}</td>
            <td><span class="badge badge-paid">ERP CASHBOOK</span></td>
          </tr>
          <tr>
            <td><strong>Unreconciled Variance</strong></td>
            <td>Difference awaiting bank statement upload or cheque clearance</td>
            <td><strong class="${brs.unreconciledVariance === 0 ? 'text-success' : 'text-danger'}">₹${brs.unreconciledVariance.toFixed(2)}</strong></td>
            <td><span class="badge badge-partial">${brs.statementSummary.reconciliationRatePercent}% MATCHED</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

async function runAutoBankReconciliation() {
  const compId = currentCompanyId || 'c4021a8a-e99d-4fa0-8f92-56fa476a6d01';
  try {
    const res = await fetch(`${API_BASE}/bank-reconciliation/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: compId }),
    });

    if (res.ok) {
      const data = await res.json();
      showToast('Reconciliation Complete', `Match Rate: ${data.statementSummary.reconciliationRatePercent}% | Variance: ₹${data.unreconciledVariance}`, 'success');
      switchView('bankrec');
    } else {
      showToast('Reconciliation Failed', 'Bank reconciliation run failed.', 'error');
    }
  } catch (err) {
    showToast('Reconciliation Error', err.message, 'error');
  }
}

// --- 4. Multi-Company Group Consolidation View ---
async function renderConsolidation(container) {
  const compId = currentCompanyId || 'fb691be7-8c03-4a5f-b026-2e5b8d8d0763';
  let data = {
    groupName: 'Techmasters Corporate Group',
    totalCompaniesInGroup: 2,
    standaloneSummary: { totalRevenue: 150000, totalPurchases: 60000 },
    intercompanyEliminations: { intercompanySalesEliminated: 25000, intercompanyPurchasesEliminated: 25000 },
    consolidatedFinancials: { consolidatedRevenue: 125000, consolidatedPurchases: 35000, consolidatedGrossProfit: 90000, isIntercompanyBalanced: true }
  };

  try {
    const res = await fetch(`${API_BASE}/consolidation/financials?parentCompanyId=${compId}`);
    if (res.ok) data = await res.json();
  } catch (e) {
    console.warn(e);
  }

  container.innerHTML = `
    <h2>Multi-Company Group Financial Consolidation & Intercompany Elimination</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Group Name</div>
        <div class="card-value text-success">${data.groupName}</div>
        <div class="card-sub">${data.totalCompaniesInGroup} Entities Consolidated</div>
      </div>
      <div class="card">
        <div class="card-title">Consolidated Revenue</div>
        <div class="card-value text-success">₹${data.consolidatedFinancials.consolidatedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub">After Intercompany Elimination</div>
      </div>
      <div class="card">
        <div class="card-title">Intercompany Eliminations</div>
        <div class="card-value text-warning">₹${data.intercompanyEliminations.intercompanySalesEliminated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="card-sub">Sales/Purchases Neutralized</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Group Financial Statements Schedule</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Financial Metric</th>
            <th>Standalone Aggregated (₹)</th>
            <th>Intercompany Eliminations (₹)</th>
            <th>Consolidated Net (₹)</th>
            <th>Audit Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Gross Sales Revenue</strong></td>
            <td>₹${data.standaloneSummary.totalRevenue.toFixed(2)}</td>
            <td>-₹${data.intercompanyEliminations.intercompanySalesEliminated.toFixed(2)}</td>
            <td><strong class="text-success">₹${data.consolidatedFinancials.consolidatedRevenue.toFixed(2)}</strong></td>
            <td><span class="badge badge-paid">VERIFIED</span></td>
          </tr>
          <tr>
            <td><strong>Cost of Goods / Purchases</strong></td>
            <td>₹${data.standaloneSummary.totalPurchases.toFixed(2)}</td>
            <td>-₹${data.intercompanyEliminations.intercompanyPurchasesEliminated.toFixed(2)}</td>
            <td><strong class="text-warning">₹${data.consolidatedFinancials.consolidatedPurchases.toFixed(2)}</strong></td>
            <td><span class="badge badge-paid">ELIMINATED</span></td>
          </tr>
          <tr>
            <td><strong>Group Gross Profit</strong></td>
            <td>₹${(data.standaloneSummary.totalRevenue - data.standaloneSummary.totalPurchases).toFixed(2)}</td>
            <td>₹0.00</td>
            <td><strong class="text-success">₹${data.consolidatedFinancials.consolidatedGrossProfit.toFixed(2)}</strong></td>
            <td><span class="badge badge-paid">BALANCED</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// --- 5. Payroll View ---
async function renderPayroll(container) {
  const compId = currentCompanyId || '';
  let employees = [];
  let runs = [];
  if (compId) {
    const [eRes, rRes] = await Promise.all([
      fetch(`${API_BASE}/payroll/employees?companyId=${compId}`).catch(() => null),
      fetch(`${API_BASE}/payroll/runs?companyId=${compId}`).catch(() => null),
    ]);
    if (eRes && eRes.ok) employees = await eRes.json();
    if (rRes && rRes.ok) runs = await rRes.json();
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <h2>Statutory Payroll & Salary Slips Engine (PF, ESI, PT)</h2>
      <button class="btn btn-primary" onclick="runMonthlyPayrollRun()">Process Monthly Payroll</button>
    </div>

    <div class="grid-stats">
      <div class="card">
        <div class="card-title">Total Active Employees</div>
        <div class="card-value text-success">${employees.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Latest Monthly Gross Salary</div>
        <div class="card-value text-warning">₹${runs.length > 0 ? runs[0].total_gross_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
      </div>
      <div class="card">
        <div class="card-title">Net Salary Payable</div>
        <div class="card-value text-success">₹${runs.length > 0 ? runs[0].total_net_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Employee Salary Register</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Emp Code</th>
            <th>Full Name</th>
            <th>Designation</th>
            <th>Basic Pay</th>
            <th>HRA</th>
            <th>Special Allowance</th>
            <th>PF (12%)</th>
            <th>Net Monthly Est.</th>
          </tr>
        </thead>
        <tbody>
          ${employees.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No employee records found.</td></tr>' :
            employees.map(e => {
              const gross = e.basic_salary + e.hra_allowance + e.special_allowance;
              const pf = Math.min(1800, Math.round(e.basic_salary * 0.12));
              const pt = gross >= 15000 ? 200 : 0;
              const net = gross - pf - pt;
              return `
                <tr>
                  <td><strong>${e.emp_code}</strong></td>
                  <td>${e.full_name}</td>
                  <td>${e.designation} (${e.department})</td>
                  <td>₹${e.basic_salary.toFixed(2)}</td>
                  <td>₹${e.hra_allowance.toFixed(2)}</td>
                  <td>₹${e.special_allowance.toFixed(2)}</td>
                  <td><span class="badge badge-paid">₹${pf}</span></td>
                  <td><strong class="text-success">₹${net.toFixed(2)}</strong></td>
                </tr>
              `;
            }).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

async function runMonthlyPayrollRun() {
  const compId = currentCompanyId || 'c4021a8a-e99d-4fa0-8f92-56fa476a6d01';
  try {
    const res = await fetch(`${API_BASE}/payroll/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: compId, payPeriod: 'AUG-2026' }),
    });

    if (res.ok) {
      const data = await res.json();
      showToast('Payroll Processed', `Period: ${data.payPeriod} | Net Salary Payable: ₹${data.summary.totalNetSalaryPayable}`, 'success');
      switchView('payroll');
    } else {
      showToast('Payroll Failed', 'Payroll processing failed.', 'error');
    }
  } catch (err) {
    showToast('Payroll Error', err.message, 'error');
  }
}

// --- 6. Fixed Assets View ---
async function renderFixedAssets(container) {
  const compId = currentCompanyId || '';
  let assets = [];
  if (compId) {
    const res = await fetch(`${API_BASE}/fixed-assets?companyId=${compId}`).catch(() => null);
    if (res && res.ok) assets = await res.json();
  }

  const totalCost = assets.reduce((acc, a) => acc + Number(a.purchase_cost), 0);
  const totalNbv = assets.reduce((acc, a) => acc + Number(a.net_book_value), 0);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <h2>Fixed Asset Register & Statutory Depreciation Engine</h2>
      <button class="btn btn-primary" onclick="runAnnualDepreciationRun()">Run Annual Depreciation</button>
    </div>

    <div class="grid-stats">
      <div class="card">
        <div class="card-title">Total Asset Acquisition Cost</div>
        <div class="card-value text-success">₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="card">
        <div class="card-title">Net Book Value (NBV)</div>
        <div class="card-value text-warning">₹${totalNbv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Fixed Asset Register Schedule</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Category</th>
            <th>Purchase Cost</th>
            <th>Method</th>
            <th>Rate %</th>
            <th>Accumulated Depr.</th>
            <th>Net Book Value</th>
          </tr>
        </thead>
        <tbody>
          ${assets.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No fixed assets registered.</td></tr>' :
            assets.map(a => `
              <tr>
                <td><strong>${a.asset_name}</strong></td>
                <td>${a.asset_category}</td>
                <td>₹${a.purchase_cost.toFixed(2)}</td>
                <td><span class="badge badge-paid">${a.depreciation_method}</span></td>
                <td>${a.depreciation_rate}%</td>
                <td>₹${a.accumulated_depr.toFixed(2)}</td>
                <td><strong class="text-success">₹${a.net_book_value.toFixed(2)}</strong></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

async function runAnnualDepreciationRun() {
  const compId = currentCompanyId || 'c4021a8a-e99d-4fa0-8f92-56fa476a6d01';
  try {
    const res = await fetch(`${API_BASE}/fixed-assets/depreciate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: compId }),
    });

    if (res.ok) {
      const data = await res.json();
      showToast('Depreciation Complete', `Processed Assets: ${data.totalAssetsProcessed} | GL Depr Expense: ₹${data.totalDepreciationExpense}`, 'success');
      switchView('fixedassets');
    } else {
      showToast('Depreciation Failed', 'Depreciation run failed.', 'error');
    }
  } catch (err) {
    showToast('Depreciation Error', err.message, 'error');
  }
}

// --- 7. Multi-Warehouse Stock Transfers View ---
async function renderTransfers(container) {
  const compId = currentCompanyId || '';
  let transfers = [];
  if (compId) {
    const res = await fetch(`${API_BASE}/transfers?companyId=${compId}`).catch(() => null);
    if (res && res.ok) transfers = await res.json();
  }

  container.innerHTML = `
    <h2>Multi-Warehouse Inter-Branch Stock Transfers</h2>

    <div class="table-card" style="margin-top:20px;">
      <div class="table-header">
        <h3>Stock Transfer Orders & In-Transit Audit Log</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Transfer #</th>
            <th>Date</th>
            <th>Source Warehouse</th>
            <th>Target Warehouse</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${transfers.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No inter-warehouse transfers recorded yet.</td></tr>' :
            transfers.map(t => `
              <tr>
                <td><strong>${t.transfer_number}</strong></td>
                <td>${new Date(t.transfer_date).toLocaleDateString('en-IN')}</td>
                <td>${t.source_warehouse_id}</td>
                <td>${t.target_warehouse_id}</td>
                <td><strong class="text-success">${t.quantity} Units</strong></td>
                <td><span class="badge badge-paid">COMPLETED</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 8. TDS & TCS View ---
async function renderTds(container) {
  const compId = currentCompanyId || '';
  let form26q = { quarter: 'Q3-2026', form_type: 'Form 26Q', total_deductions: 0, total_taxable_value: 0, total_tds_withheld: 0, records: [] };
  if (compId) {
    const res = await fetch(`${API_BASE}/tds-tcs/form26q?companyId=${compId}`).catch(() => null);
    if (res && res.ok) form26q = await res.json();
  }

  container.innerHTML = `
    <h2>Income Tax TDS & TCS Compliance Engine</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Quarterly Return</div>
        <div class="card-value text-success">${form26q.quarter}</div>
        <div class="card-sub">${form26q.form_type}</div>
      </div>
      <div class="card">
        <div class="card-title">Total TDS Deducted</div>
        <div class="card-value text-warning">₹${form26q.total_tds_withheld.toFixed(2)}</div>
        <div class="card-sub">${form26q.total_deductions} Deductions Recorded</div>
      </div>
      <div class="card">
        <div class="card-title">Taxable Value Base</div>
        <div class="card-value">₹${form26q.total_taxable_value.toFixed(2)}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Withholding Tax Ledger (Sections 194Q, 194C, 194J)</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Party Name</th>
            <th>PAN</th>
            <th>Section</th>
            <th>Tax Type</th>
            <th>Taxable Value</th>
            <th>Rate %</th>
            <th>TDS Withheld</th>
          </tr>
        </thead>
        <tbody>
          ${form26q.records.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No TDS/TCS deductions recorded for this quarter.</td></tr>' :
            form26q.records.map(r => `
              <tr>
                <td><strong>${r.party_name}</strong></td>
                <td>${r.pan}</td>
                <td><span class="badge badge-paid">${r.section}</span></td>
                <td>${r.tax_type}</td>
                <td>₹${r.taxable_amount.toFixed(2)}</td>
                <td>${r.rate_percent}%</td>
                <td><strong class="text-danger">₹${r.tax_withheld.toFixed(2)}</strong></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 9. GST Compliance & GSTR-9 View ---
async function renderGst(container) {
  const compId = currentCompanyId || '';
  let gstSummary = { output_tax: { total_output: 0 }, input_tax_credit: { total_itc: 0 }, net_tax_payable: 0 };
  let gstr9 = { financialYear: '2025-26', table4_outward_supplies: { b2b_taxable_turnover: 0, total_output_liability: 0 }, table6_7_8_itc_reconciliation: { total_itc_claimed_gstr3b: 0, total_itc_available_gstr2b: 0, itc_unreconciled_difference: 0, audit_risk_status: 'LOW_RISK' } };

  if (compId) {
    const [sRes, g9Res] = await Promise.all([
      fetch(`${API_BASE}/gst/summary?companyId=${compId}`).catch(() => null),
      fetch(`${API_BASE}/gstr9/annual-summary?companyId=${compId}`).catch(() => null),
    ]);
    if (sRes && sRes.ok) gstSummary = await sRes.json();
    if (g9Res && g9Res.ok) gstr9 = await g9Res.json();
  }

  container.innerHTML = `
    <h2>GST Compliance & GSTR-9 Annual Audit Return</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Output GST Liability</div>
        <div class="card-value text-danger">₹${gstSummary.output_tax.total_output.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Input Tax Credit (ITC)</div>
        <div class="card-value text-success">₹${gstSummary.input_tax_credit.total_itc.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">GSTR-9 Audit Risk Level</div>
        <div class="card-value text-success">${gstr9.table6_7_8_itc_reconciliation.audit_risk_status}</div>
      </div>
    </div>

    <div class="table-card" style="margin-top:20px;">
      <div class="table-header">
        <h3>GSTR-9 Annual Tax Audit Return (FY ${gstr9.financialYear})</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>GSTR-9 Table / Section</th>
            <th>Description</th>
            <th>Value (₹)</th>
            <th>Audit Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Table 4</strong></td>
            <td>Annual B2B Outward Taxable Supplies Turnover</td>
            <td>₹${gstr9.table4_outward_supplies.b2b_taxable_turnover.toFixed(2)}</td>
            <td><span class="badge badge-paid">VERIFIED</span></td>
          </tr>
          <tr>
            <td><strong>Table 6</strong></td>
            <td>Total Input Tax Credit (ITC) Claimed via GSTR-3B</td>
            <td>₹${gstr9.table6_7_8_itc_reconciliation.total_itc_claimed_gstr3b.toFixed(2)}</td>
            <td><span class="badge badge-paid">CLAIMED</span></td>
          </tr>
          <tr>
            <td><strong>Table 8</strong></td>
            <td>Total ITC Available per Auto-Populated GSTR-2B</td>
            <td>₹${gstr9.table6_7_8_itc_reconciliation.total_itc_available_gstr2b.toFixed(2)}</td>
            <td><span class="badge badge-partial">PORTAL DATA</span></td>
          </tr>
          <tr>
            <td><strong>Table 8D</strong></td>
            <td>Unreconciled ITC Difference (Audit Variance)</td>
            <td><strong class="${gstr9.table6_7_8_itc_reconciliation.itc_unreconciled_difference === 0 ? 'text-success' : 'text-danger'}">₹${gstr9.table6_7_8_itc_reconciliation.itc_unreconciled_difference.toFixed(2)}</strong></td>
            <td><span class="badge badge-paid">${gstr9.table6_7_8_itc_reconciliation.audit_risk_status}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// --- 10. Sales & Billing View ---
async function renderSales(container) {
  const compId = currentCompanyId || '';
  let salesList = [];
  if (compId) {
    const res = await fetch(`${API_BASE}/sales/invoices?companyId=${compId}`).catch(() => null);
    if (res && res.ok) salesList = await res.json();
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <h2>Sales Invoices & Billing</h2>
      <button class="btn btn-primary" onclick="openNewInvoiceModal()">New Sales Invoice</button>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Place of Supply</th>
            <th>Subtotal</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
            <th>Grand Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${salesList.length === 0 ? '<tr><td colspan="10" style="text-align:center; padding:32px; color:var(--text-muted);">No invoices found. Click "New Sales Invoice" to create one.</td></tr>' :
            salesList.map(inv => `
              <tr>
                <td><strong>${inv.invoice_number}</strong></td>
                <td>${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                <td>${inv.place_of_supply}</td>
                <td>₹${Number(inv.subtotal).toFixed(2)}</td>
                <td>₹${Number(inv.cgst_total).toFixed(2)}</td>
                <td>₹${Number(inv.sgst_total).toFixed(2)}</td>
                <td>₹${Number(inv.igst_total).toFixed(2)}</td>
                <td><strong>₹${Number(inv.grand_total).toFixed(2)}</strong></td>
                <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="viewPrintableInvoice('${inv.id}')">PDF Invoice</button>
                  <button class="btn btn-primary btn-sm" onclick="triggerEInvoice('${inv.id}')">e-Invoice (IRN)</button>
                </td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

function openNewInvoiceModal() {
  const modal = document.getElementById('modal-container');
  const nextInvNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;

  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3>Create Sales Invoice</h3>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
        </div>

        <form onsubmit="submitSalesInvoice(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Invoice Number</label>
              <input type="text" id="form-inv-num" class="form-control" value="${nextInvNum}" required />
            </div>
            <div class="form-group">
              <label>Invoice Date</label>
              <input type="date" id="form-inv-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
            <div class="form-group">
              <label>Place of Supply (State)</label>
              <input type="text" id="form-pos" class="form-control" value="Karnataka" placeholder="e.g. Karnataka, Maharashtra" required />
            </div>
          </div>

          <h4 style="margin: 20px 0 12px 0;">Item Details</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Description</label>
              <input type="text" id="item-desc" class="form-control" value="Industrial Microcontroller Unit (MCU-V2)" required />
            </div>
            <div class="form-group">
              <label>HSN / SAC</label>
              <input type="text" id="item-hsn" class="form-control" value="8542" required />
            </div>
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" id="item-qty" class="form-control" value="5" min="1" required />
            </div>
            <div class="form-group">
              <label>Unit Price (₹)</label>
              <input type="number" id="item-price" class="form-control" value="2500" min="0" required />
            </div>
            <div class="form-group">
              <label>GST Rate (%)</label>
              <select id="item-gst-rate" class="form-control">
                <option value="18" selected>18% Standard</option>
                <option value="12">12%</option>
                <option value="5">5%</option>
                <option value="28">28%</option>
                <option value="0">0% Exempt</option>
              </select>
            </div>
          </div>

          <div style="margin-top:24px; text-align:right;">
            <button type="submit" class="btn btn-primary">Create Invoice & Post Cascade</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

async function submitSalesInvoice(event) {
  event.preventDefault();
  const compId = currentCompanyId || '23bce9ca-df4c-4fe8-9e00-e9cb55375634';

  let custId = currentCustomerId;
  if (!custId) {
    const custRes = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: compId,
        name: 'Apex Infotech Pvt Ltd',
        gstin: '29AAACA1234A1Z5',
        state: 'Karnataka',
      }),
    });
    const c = await custRes.json();
    custId = c.id;
  }

  const payload = {
    companyId: compId,
    customerId: custId,
    invoiceNumber: document.getElementById('form-inv-num').value,
    invoiceDate: document.getElementById('form-inv-date').value,
    placeOfSupply: document.getElementById('form-pos').value,
    items: [
      {
        productId: currentProductId || undefined,
        description: document.getElementById('item-desc').value,
        hsnSac: document.getElementById('item-hsn').value,
        quantity: Number(document.getElementById('item-qty').value),
        unitPrice: Number(document.getElementById('item-price').value),
        gstRate: Number(document.getElementById('item-gst-rate').value),
      },
    ],
  };

  const res = await fetch(`${API_BASE}/sales/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    showToast('Invoice Created', `Invoice ${payload.invoiceNumber} posted cleanly to GL & Stock Ledgers.`, 'success');
    closeModal();
    switchView('sales');
  } else {
    showToast('Invoice Error', 'Failed to create invoice.', 'error');
  }
}

async function viewPrintableInvoice(invoiceId) {
  const modal = document.getElementById('modal-container');
  const res = await fetch(`${API_BASE}/sales/invoices/${invoiceId}`);
  if (!res.ok) return showToast('Error', 'Failed to fetch invoice details', 'error');

  const inv = await res.json();
  const einvRes = await fetch(`${API_BASE}/einvoice/${invoiceId}`).catch(() => null);
  const einv = einvRes && einvRes.ok ? await einvRes.json() : null;

  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-content" style="max-width: 850px;">
        <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3>TAX INVOICE PREVIEW</h3>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.print()">Print / Save PDF</button>
            <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
          </div>
        </div>

        <div class="printable-invoice" style="border: 1px solid var(--border-slate); padding: 24px; border-radius: 8px; background-color: white; color: black;">
          <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #333; padding-bottom: 12px;">
            <div>
              <h2 style="margin:0; color:#1e293b;">TECHMASTERS INNOVATIONS PRIVATE LIMITED</h2>
              <p style="font-size:0.85rem; color:#475569; margin-top:4px;">1st Floor, Near Guru Nanak Dev Engg College, Mailoor Road, Bidar - 585403, KA</p>
              <p style="font-size:0.85rem; color:#475569;">GSTIN: 29AAAAA0000A1Z5 | State: Karnataka (29)</p>
            </div>
            <div style="text-align:right;">
              <h3 style="margin:0; color:#6366f1;">TAX INVOICE</h3>
              <p style="font-size:0.9rem; margin-top:4px;">Invoice #: <strong>${inv.invoice_number}</strong></p>
              <p style="font-size:0.85rem; color:#475569;">Date: ${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          ${einv && einv.irn ? `
            <div style="background-color:#f1f5f9; padding:8px 12px; margin:12px 0; border-radius:6px; font-size:0.8rem; word-break:break-all;">
              <strong>e-Invoice IRN:</strong> ${einv.irn}<br/>
              <strong>Ack No:</strong> ${einv.ack_no} | <strong>Ack Date:</strong> ${new Date(einv.ack_date).toLocaleString('en-IN')}
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; margin:20px 0; font-size:0.9rem;">
            <div>
              <strong>Billed To (Customer):</strong><br/>
              ${inv.customer?.name || 'Apex Infotech Pvt Ltd'}<br/>
              GSTIN: ${inv.customer?.gstin || '29AAACA1234A1Z5'}<br/>
              Place of Supply: ${inv.place_of_supply}
            </div>
          </div>

          <table style="width:100%; border-collapse:collapse; margin:16px 0;" border="1" cellpadding="8">
            <thead>
              <tr style="background:#f8fafc; color:black;">
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Price (₹)</th>
                <th>Taxable (₹)</th>
                <th>GST Rate</th>
                <th>CGST (₹)</th>
                <th>SGST (₹)</th>
                <th>IGST (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${(inv.items || []).map(i => `
                <tr>
                  <td>${i.description}</td>
                  <td>${i.hsn_sac || '-'}</td>
                  <td>${i.quantity}</td>
                  <td>₹${Number(i.unit_price).toFixed(2)}</td>
                  <td>₹${Number(i.taxable_amount).toFixed(2)}</td>
                  <td>${i.gst_rate}%</td>
                  <td>₹${Number(i.cgst_amount).toFixed(2)}</td>
                  <td>₹${Number(i.sgst_amount).toFixed(2)}</td>
                  <td>₹${Number(i.igst_amount).toFixed(2)}</td>
                  <td><strong>₹${Number(i.total_amount).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:20px;">
            <div style="width: 120px; height: 120px; border: 1px solid #ccc; display:flex; align-items:center; justify-content:center; text-align:center; font-size:0.75rem; color:#666;">
              ${einv && einv.signed_qr_code ? 'SIGNED QR CODE' : 'e-Invoice QR Code'}
            </div>

            <div style="text-align:right; font-size:0.95rem;">
              <p>Subtotal: ₹${Number(inv.subtotal).toFixed(2)}</p>
              <p>CGST Total: ₹${Number(inv.cgst_total).toFixed(2)}</p>
              <p>SGST Total: ₹${Number(inv.sgst_total).toFixed(2)}</p>
              <p>IGST Total: ₹${Number(inv.igst_total).toFixed(2)}</p>
              <h3 style="margin-top:8px; color:#1e293b;">Grand Total: ₹${Number(inv.grand_total).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function triggerEInvoice(invoiceId) {
  const res = await fetch(`${API_BASE}/einvoice/submit/${invoiceId}`, { method: 'POST' });
  if (res.ok) {
    const data = await res.json();
    showToast('e-Invoice Generated', `IRN: ${data.irn.substring(0, 24)}...`, 'success');
    switchView('sales');
  } else {
    showToast('e-Invoice Error', 'e-Invoice IRN generation failed.', 'error');
  }
}

// --- 11. Super Admin Registrations Approval Portal View ---
async function renderAdminApprovals(container) {
  container.innerHTML = `<div style="color:var(--text-muted);">Fetching pending tenant registrations...</div>`;
  let pendingList = [];
  try {
    const res = await fetch(`${API_BASE}/admin/pending-approvals`);
    if (res.ok) pendingList = await res.json();
  } catch (e) {
    console.warn(e);
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2>Super Admin Registration Approval Gateway</h2>
      <button class="btn btn-secondary btn-sm" onclick="renderAdminApprovals(document.getElementById('app-view'))">Refresh Approvals</button>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Pending Business Registrations (${pendingList.length})</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Legal Name / Org</th>
            <th>Owner Email</th>
            <th>GSTIN</th>
            <th>State</th>
            <th>Status</th>
            <th>Registration Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${pendingList.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No pending registrations. All business accounts are reviewed and active!</td></tr>' :
            pendingList.map(item => `
              <tr>
                <td><strong>${item.legal_name}</strong><br/><span style="font-size:0.75rem; color:var(--text-muted);">${item.owner_full_name}</span></td>
                <td>${item.owner_email}</td>
                <td>${item.gstin || '-'}</td>
                <td>${item.state || '-'}</td>
                <td><span class="badge badge-unpaid">${item.status}</span></td>
                <td>${new Date(item.created_at).toLocaleString('en-IN')}</td>
                <td>
                  <button class="btn btn-primary btn-sm" onclick="approveTenantAccount('${item.organization_id}')">Approve Tenant</button>
                </td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

async function approveTenantAccount(orgId) {
  try {
    const res = await fetch(`${API_BASE}/admin/approve-tenant/${orgId}`, { method: 'POST' });
    if (res.ok) {
      showToast('Tenant Approved', 'Business tenant account approved. They can now log in.', 'success');
      renderAdminApprovals(document.getElementById('app-view'));
    } else {
      showToast('Approval Error', 'Failed to approve tenant.', 'error');
    }
  } catch (err) {
    showToast('Approval Error', err.message, 'error');
  }
}

// --- 12. Purchase & Sales Orders View ---
async function renderOrders(container) {
  const compId = currentCompanyId || '';
  let salesOrders = [];
  let purchaseOrders = [];

  if (compId) {
    const [soRes, poRes] = await Promise.all([
      fetch(`${API_BASE}/orders/sales?companyId=${compId}`).catch(() => null),
      fetch(`${API_BASE}/orders/purchase?companyId=${compId}`).catch(() => null),
    ]);
    if (soRes && soRes.ok) salesOrders = await soRes.json();
    if (poRes && poRes.ok) purchaseOrders = await poRes.json();
  }

  container.innerHTML = `
    <h2>Purchase Orders (PO) & Sales Quotations (SO)</h2>

    <div class="table-card" style="margin-top:20px;">
      <div class="table-header">
        <h3>Sales Orders & Quotations</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${salesOrders.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No sales orders issued.</td></tr>' :
            salesOrders.map(o => `
              <tr>
                <td><strong>${o.order_number}</strong></td>
                <td>${new Date(o.order_date).toLocaleDateString('en-IN')}</td>
                <td>₹${o.total_amount.toFixed(2)}</td>
                <td><span class="badge badge-paid">${o.status}</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Supplier Purchase Orders (PO)</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>PO #</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${purchaseOrders.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No purchase orders issued.</td></tr>' :
            purchaseOrders.map(p => `
              <tr>
                <td><strong>${p.po_number}</strong></td>
                <td>${new Date(p.po_date).toLocaleDateString('en-IN')}</td>
                <td>₹${p.total_amount.toFixed(2)}</td>
                <td><span class="badge badge-partial">${p.status}</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 13. Job Work Subcontracting View ---
async function renderJobWork(container) {
  const compId = currentCompanyId || '';
  let challans = [];
  if (compId) {
    const res = await fetch(`${API_BASE}/job-work/challans?companyId=${compId}`).catch(() => null);
    if (res && res.ok) challans = await res.json();
  }

  container.innerHTML = `
    <h2>Job Work Subcontracting & Form ITC-04 Engine</h2>

    <div class="table-card" style="margin-top:20px;">
      <div class="table-header">
        <h3>GST Form ITC-04 Job Work Delivery Challans</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Challan #</th>
            <th>Date</th>
            <th>Job Worker Name</th>
            <th>GSTIN</th>
            <th>Process Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${challans.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No Job Work challans issued yet.</td></tr>' :
            challans.map(c => `
              <tr>
                <td><strong>${c.challan_number}</strong></td>
                <td>${new Date(c.challan_date).toLocaleDateString('en-IN')}</td>
                <td>${c.job_worker_name}</td>
                <td>${c.job_worker_gstin || '-'}</td>
                <td>${c.process_type}</td>
                <td><span class="badge badge-${c.status === 'GOODS_RETURNED' ? 'paid' : 'unpaid'}">${c.status}</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 14. Purchases View ---
async function renderPurchases(container) {
  const compId = currentCompanyId || '';
  let purchasesList = [];
  if (compId) {
    const res = await fetch(`${API_BASE}/purchases/invoices?companyId=${compId}`).catch(() => null);
    if (res && res.ok) purchasesList = await res.json();
  }

  container.innerHTML = `
    <h2>Purchase Bills</h2>
    <div class="table-card" style="margin-top:20px;">
      <table>
        <thead>
          <tr>
            <th>Bill #</th>
            <th>Date</th>
            <th>Place of Supply</th>
            <th>Subtotal</th>
            <th>Input CGST</th>
            <th>Input SGST</th>
            <th>Input IGST</th>
            <th>Grand Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${purchasesList.length === 0 ? '<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">No purchase bills recorded.</td></tr>' :
            purchasesList.map(b => `
              <tr>
                <td><strong>${b.bill_number}</strong></td>
                <td>${new Date(b.bill_date).toLocaleDateString('en-IN')}</td>
                <td>${b.place_of_supply}</td>
                <td>₹${Number(b.subtotal).toFixed(2)}</td>
                <td>₹${Number(b.cgst_total).toFixed(2)}</td>
                <td>₹${Number(b.sgst_total).toFixed(2)}</td>
                <td>₹${Number(b.igst_total).toFixed(2)}</td>
                <td><strong>₹${Number(b.grand_total).toFixed(2)}</strong></td>
                <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 15. Inventory View ---
async function renderInventory(container) {
  const compId = currentCompanyId || '';
  let stockSummary = [];

  if (compId) {
    const sRes = await fetch(`${API_BASE}/inventory/summary?companyId=${compId}`).catch(() => null);
    if (sRes && sRes.ok) stockSummary = await sRes.json();
  }

  container.innerHTML = `
    <h2>Inventory Control & Stock Valuation</h2>

    <div class="table-card" style="margin-top:20px;">
      <div class="table-header">
        <h3>Product Stock Valuation Summary</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>HSN</th>
            <th>Unit</th>
            <th>Selling Price</th>
            <th>Current Stock</th>
            <th>Stock Valuation</th>
          </tr>
        </thead>
        <tbody>
          ${stockSummary.length === 0 ? '<tr><td colspan="7" style="text-align:center;">No stock summary available.</td></tr>' :
            stockSummary.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.sku || '-'}</td>
                <td>${p.hsn_code || '-'}</td>
                <td>${p.unit}</td>
                <td>₹${p.selling_price.toFixed(2)}</td>
                <td><strong class="text-success">${p.current_stock} ${p.unit}</strong></td>
                <td><strong>₹${p.stock_value.toFixed(2)}</strong></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 16. Payments View ---
async function renderPayments(container) {
  const compId = currentCompanyId || '';
  let payments = [];
  if (compId) {
    const res = await fetch(`${API_BASE}/payments?companyId=${compId}`).catch(() => null);
    if (res && res.ok) payments = await res.json();
  }

  container.innerHTML = `
    <h2>Payments & Collections</h2>
    <div class="table-card" style="margin-top:20px;">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Mode</th>
            <th>Date</th>
            <th>Reference #</th>
          </tr>
        </thead>
        <tbody>
          ${payments.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No payment records found.</td></tr>' :
            payments.map(p => `
              <tr>
                <td><span class="badge ${p.payment_type === 'RECEIPT' ? 'badge-paid' : 'badge-partial'}">${p.payment_type}</span></td>
                <td><strong>₹${Number(p.amount).toFixed(2)}</strong></td>
                <td>${p.payment_mode}</td>
                <td>${new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                <td>${p.reference_number || '-'}</td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 17. Financial Reports View ---
async function renderReports(container) {
  const compId = currentCompanyId || '';
  let pnl = { revenue: { net_revenue: 0 }, cost_of_sales: { cogs: 0 }, gross_profit: 0, net_profit: 0 };
  let bs = { assets: { total_assets: 0 }, liabilities: { total_liabilities: 0 }, equity: { total_equity: 0 }, is_balanced: true };
  let tb = { total_debit: 0, total_credit: 0, is_balanced: true, rows: [] };

  if (compId) {
    const [pRes, bRes, tRes] = await Promise.all([
      fetch(`${API_BASE}/reports/profit-loss?companyId=${compId}`).catch(() => null),
      fetch(`${API_BASE}/reports/balance-sheet?companyId=${compId}`).catch(() => null),
      fetch(`${API_BASE}/reports/trial-balance?companyId=${compId}`).catch(() => null),
    ]);
    if (pRes && pRes.ok) pnl = await pRes.json();
    if (bRes && bRes.ok) bs = await bRes.json();
    if (tRes && tRes.ok) tb = await tRes.json();
  }

  container.innerHTML = `
    <h2>Financial Statements & Accounting Reports</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Net Sales Revenue</div>
        <div class="card-value text-success">₹${pnl.revenue.net_revenue.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Cost of Goods Sold (COGS)</div>
        <div class="card-value text-warning">₹${pnl.cost_of_sales.cogs.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Net Operating Profit</div>
        <div class="card-value ${pnl.net_profit >= 0 ? 'text-success' : 'text-danger'}">₹${pnl.net_profit.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Balance Sheet Equation</div>
        <div class="card-value text-success">${bs.is_balanced ? 'BALANCED' : 'UNBALANCED'}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Trial Balance Summary</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Total Debit (₹)</th>
            <th>Total Credit (₹)</th>
            <th>Net Balance (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${tb.rows.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No journal entries posted yet.</td></tr>' :
            tb.rows.map(r => `
              <tr>
                <td><strong>${r.account_name}</strong></td>
                <td>₹${r.total_debit.toFixed(2)}</td>
                <td>₹${r.total_credit.toFixed(2)}</td>
                <td><strong class="${r.net_balance >= 0 ? 'text-success' : 'text-danger'}">₹${r.net_balance.toFixed(2)}</strong></td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

// --- 18. Multi-Currency Forex View ---
async function renderForex(container) {
  const res = await fetch(`${API_BASE}/forex/convert?amount=1000&currency=USD`).catch(() => null);
  const data = res && res.ok ? await res.json() : { amountInr: 86500, exchangeRate: 86.5 };

  container.innerHTML = `
    <h2>Multi-Currency Forex Exchange Engine</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">USD / INR Exchange Rate</div>
        <div class="card-value text-success">₹${data.exchangeRate.toFixed(2)}</div>
        <div class="card-sub">1 USD = ₹${data.exchangeRate.toFixed(2)} INR</div>
      </div>
      <div class="card">
        <div class="card-title">Example $1,000 USD Invoice</div>
        <div class="card-value">₹${data.amountInr.toLocaleString('en-IN')}</div>
        <div class="card-sub">Converted Inward Cashflow</div>
      </div>
    </div>
  `;
}

// --- 19. Executive Analytics View ---
async function renderAnalytics(container) {
  const compId = currentCompanyId || '';
  const res = await fetch(`${API_BASE}/analytics/dashboard?companyId=${compId}`).catch(() => null);
  const data = res && res.ok ? await res.json() : {
    revenue: { total_sales: 0, total_invoices: 0 },
    profitability: { gross_profit: 0, gross_margin_percent: 0 },
    cashflow: { outstanding_ar: 0, outstanding_ap: 0, net_working_capital_buffer: 0 }
  };

  container.innerHTML = `
    <h2>Executive Growth & Margin Analytics</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Gross Operating Margin %</div>
        <div class="card-value text-success">${data.profitability.gross_margin_percent}%</div>
        <div class="card-sub">Gross Profit: ₹${data.profitability.gross_profit.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Working Capital Buffer</div>
        <div class="card-value text-warning">₹${data.cashflow.net_working_capital_buffer.toFixed(2)}</div>
        <div class="card-sub">AR (₹${data.cashflow.outstanding_ar.toFixed(2)}) - AP (₹${data.cashflow.outstanding_ap.toFixed(2)})</div>
      </div>
    </div>
  `;
}

// --- 20. SaaS Subscriptions View ---
async function renderSubscriptions(container) {
  const res = await fetch(`${API_BASE}/subscriptions?organizationId=${currentOrgId}`).catch(() => null);
  let sub = { plan_code: 'FREE', limits: { name: 'Free Plan', monthly_invoices: 10 }, usage: { invoices_created: 0, invoices_remaining: 10 } };
  if (res && res.ok) sub = await res.json();

  container.innerHTML = `
    <h2>SaaS Multi-Tenant Subscription & Usage Engine</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Current Active Plan</div>
        <div class="card-value text-success">${sub.plan_code}</div>
        <div class="card-sub">${sub.limits.name}</div>
      </div>
      <div class="card">
        <div class="card-title">Monthly Invoice Quota</div>
        <div class="card-value">${sub.usage.invoices_created} / ${sub.limits.monthly_invoices}</div>
      </div>
    </div>
  `;
}

// --- 21. Import/Export View ---
async function renderImportExport(container) {
  const compId = currentCompanyId || 'c4021a8a-e99d-4fa0-8f92-56fa476a6d01';

  container.innerHTML = `
    <h2>Master Data Bulk CSV Export & Import</h2>

    <div class="grid-stats" style="margin-top:20px;">
      <div class="card">
        <div class="card-title">Export Sales Invoices</div>
        <a href="${API_BASE}/import-export/export/sales?companyId=${compId}" class="btn btn-primary btn-sm" target="_blank">Export Sales CSV</a>
      </div>

      <div class="card">
        <div class="card-title">Export Customers Catalog</div>
        <a href="${API_BASE}/import-export/export/customers?companyId=${compId}" class="btn btn-primary btn-sm" target="_blank">Export Customers CSV</a>
      </div>
    </div>
  `;
}

// --- 22. Audit View ---
async function renderAudit(container) {
  let auditLogs = [];
  const res = await fetch(`${API_BASE}/audit`).catch(() => null);
  if (res && res.ok) auditLogs = await res.json();

  container.innerHTML = `
    <h2>System Action & Security Audit Trail</h2>
    <div class="table-card" style="margin-top:20px;">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Entity</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${auditLogs.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No audit logs recorded.</td></tr>' :
            auditLogs.map(l => `
              <tr>
                <td><strong>${l.action}</strong></td>
                <td>${l.entity}</td>
                <td>${l.details || '-'}</td>
                <td>${new Date(l.created_at).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;
}
