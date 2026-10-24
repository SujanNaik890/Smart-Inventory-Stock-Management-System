import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { query, get, run, exec, transaction } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedDatabase = async (force = false) => {
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  exec(schemaSql);

  const existingAdmin = get('SELECT id FROM admins LIMIT 1');
  if (existingAdmin && !force) {
    console.log('Database already initialized with data. Skipping seed.');
    return;
  }

  if (force) {
    exec('DELETE FROM stock_transactions;');
    exec('DELETE FROM products;');
    exec('DELETE FROM suppliers;');
    exec('DELETE FROM categories;');
    exec('DELETE FROM admins;');
    exec('DELETE FROM settings;');
  }

  console.log('Seeding database with StockSmart reference data...');

  // 1. Admin
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('admin123', salt);
  run(`
    INSERT INTO admins (name, email, password_hash, role, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'Aarav Sharma',
    'admin@stocksmart.ai',
    passwordHash,
    'Admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
  ]);

  // 2. Categories
  const categories = [
    { name: 'Electronics', description: 'Computing, display, and electronic peripherals', icon: 'Cpu', color: '#405BFF' },
    { name: 'Accessories', description: 'Cables, hubs, adapters, and input devices', icon: 'Headphones', color: '#8267F5' },
    { name: 'Furniture', description: 'Ergonomic chairs, desks, and storage', icon: 'Armchair', color: '#16B979' },
    { name: 'Lab Equipment', description: 'Measurement tools, test gear, and instruments', icon: 'Microscope', color: '#FF9B38' },
    { name: 'Others', description: 'Safety gear, maintenance, and miscellaneous items', icon: 'Box', color: '#727D9E' }
  ];

  for (const cat of categories) {
    run(`INSERT INTO categories (name, description, icon, color) VALUES (?, ?, ?, ?)`, [
      cat.name, cat.description, cat.icon, cat.color
    ]);
  }

  // 3. Suppliers
  const suppliers = [
    {
      name: 'Apex Tech Distribution',
      contact_person: 'Vikram Malhotra',
      email: 'vikram@apextech.com',
      phone: '+1 (555) 019-2831',
      address: '104 Silicon Blvd, Tech District, CA 94016'
    },
    {
      name: 'Global Office & Lab Supplies',
      contact_person: 'Sarah Jenkins',
      email: 'sarah@globallab.com',
      phone: '+1 (555) 014-3992',
      address: '220 University Way, Suite 400, MA 02138'
    },
    {
      name: 'Nexus Components Ltd',
      contact_person: 'Kenji Sato',
      email: 'kenji@nexuscomp.com',
      phone: '+1 (555) 018-7201',
      address: '88 Industrial Park, Sector 5, Austin, TX 78701'
    },
    {
      name: 'Quantum Scientific Instruments',
      contact_person: 'Elena Rostova',
      email: 'elena@quantumsci.com',
      phone: '+1 (555) 016-4411',
      address: '45 Science Avenue, Cambridge, MA 02142'
    }
  ];

  for (const s of suppliers) {
    run(`INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)`, [
      s.name, s.contact_person, s.email, s.phone, s.address
    ]);
  }

  // 4. Products (48 products)
  // Let's create realistic items matching dashboard metrics:
  // Total products: 48
  // Total stock units: ~1,284
  // Low stock items: 7 (qty <= min and qty > 0)
  // Out of stock items: 2 (qty == 0)
  const productList = [
    // Low stock items shown on dashboard
    { name: 'HDMI Cable', sku: 'ACC-HDMI-001', cat: 2, sup: 1, price: 12.50, qty: 5, min: 10, unit: 'pcs', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200' },
    { name: 'Wireless Mouse', sku: 'ACC-WM-002', cat: 2, sup: 1, price: 29.99, qty: 8, min: 15, unit: 'pcs', img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=200' },
    { name: 'USB Hub', sku: 'ACC-HUB-003', cat: 2, sup: 1, price: 24.00, qty: 4, min: 10, unit: 'pcs', img: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=200' },
    { name: 'Lab Microscope', sku: 'LAB-MIC-004', cat: 4, sup: 4, price: 450.00, qty: 2, min: 5, unit: 'units', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=200' },
    { name: 'Breadboard Prototyping Kit', sku: 'ELEC-BB-005', cat: 1, sup: 3, price: 18.00, qty: 6, min: 12, unit: 'kits', img: '' },
    { name: 'Precision Screwdriver Set', sku: 'OTH-SD-006', cat: 5, sup: 2, price: 15.00, qty: 4, min: 10, unit: 'sets', img: '' },
    { name: 'Ethernet Patch Panel 24P', sku: 'ACC-PP-007', cat: 2, sup: 1, price: 42.00, qty: 3, min: 8, unit: 'pcs', img: '' },

    // Out of stock items (2 items)
    { name: 'Soldering Station 60W', sku: 'LAB-SLD-008', cat: 4, sup: 4, price: 89.00, qty: 0, min: 4, unit: 'units', img: '' },
    { name: 'Raspberry Pi 4 Model B (8GB)', sku: 'ELEC-RPI-009', cat: 1, sup: 3, price: 75.00, qty: 0, min: 6, unit: 'units', img: '' },

    // Healthy stock items
    { name: 'Mechanical Keyboard', sku: 'ELEC-KB-010', cat: 1, sup: 1, price: 89.99, qty: 38, min: 10, unit: 'pcs', img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=200' },
    { name: 'Monitor 27-inch 4K', sku: 'ELEC-MON-011', cat: 1, sup: 1, price: 320.00, qty: 22, min: 5, unit: 'units', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=200' },
    { name: 'USB-C Adapter Multiport', sku: 'ACC-ADP-012', cat: 2, sup: 1, price: 35.00, qty: 100, min: 20, unit: 'pcs', img: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&q=80&w=200' },
    { name: 'Ergonomic Office Chair', sku: 'FURN-CHR-013', cat: 3, sup: 2, price: 210.00, qty: 26, min: 5, unit: 'units', img: '' },
    { name: 'Height Adjustable Standing Desk', sku: 'FURN-DSK-014', cat: 3, sup: 2, price: 380.00, qty: 18, min: 4, unit: 'units', img: '' },
    { name: 'Digital Multimeter True RMS', sku: 'LAB-DMM-015', cat: 4, sup: 4, price: 65.00, qty: 19, min: 5, unit: 'units', img: '' },
    { name: 'Dual Channel Oscilloscope 100MHz', sku: 'LAB-OSC-016', cat: 4, sup: 4, price: 520.00, qty: 11, min: 3, unit: 'units', img: '' },
    { name: 'Cat6 Ethernet Cable 10m', sku: 'ACC-ETH-017', cat: 2, sup: 1, price: 8.50, qty: 65, min: 15, unit: 'pcs', img: '' },
    { name: 'Anti-Static ESD Wrist Strap', sku: 'OTH-ESD-018', cat: 5, sup: 2, price: 5.00, qty: 74, min: 20, unit: 'pcs', img: '' },
    { name: 'Lint-Free Cleanroom Wipes', sku: 'OTH-WIP-019', cat: 5, sup: 2, price: 14.00, qty: 85, min: 25, unit: 'packs', img: '' },
    { name: 'Webcam 1080p Pro', sku: 'ELEC-CAM-020', cat: 1, sup: 1, price: 55.00, qty: 34, min: 8, unit: 'pcs', img: '' },
    { name: 'Noise Cancelling Headset', sku: 'ACC-HDS-021', cat: 2, sup: 1, price: 68.00, qty: 28, min: 6, unit: 'pcs', img: '' },
    { name: 'Mobile Filing Cabinet 3-Drawer', sku: 'FURN-CAB-022', cat: 3, sup: 2, price: 145.00, qty: 14, min: 3, unit: 'units', img: '' },
    { name: 'Desk LED Lamp with Dimmer', sku: 'FURN-LMP-023', cat: 3, sup: 2, price: 32.00, qty: 42, min: 10, unit: 'pcs', img: '' },
    { name: 'DC Bench Power Supply 30V 5A', sku: 'LAB-PSU-024', cat: 4, sup: 4, price: 110.00, qty: 15, min: 4, unit: 'units', img: '' },
    { name: 'Microcontroller Dev Board ESP32', sku: 'ELEC-ESP-025', cat: 1, sup: 3, price: 9.50, qty: 95, min: 20, unit: 'pcs', img: '' },
    { name: 'Arduino Mega 2560 Board', sku: 'ELEC-ARD-026', cat: 1, sup: 3, price: 22.00, qty: 52, min: 12, unit: 'pcs', img: '' },
    { name: 'Jumper Wires Assorted 120pcs', sku: 'ACC-JMP-027', cat: 2, sup: 3, price: 6.00, qty: 70, min: 15, unit: 'sets', img: '' },
    { name: 'Lead-Free Solder Spool 0.8mm', sku: 'LAB-SLS-028', cat: 4, sup: 4, price: 19.50, qty: 36, min: 8, unit: 'rolls', img: '' },
    { name: 'Heat Shrink Tubing 328pcs Box', sku: 'OTH-HST-029', cat: 5, sup: 2, price: 11.00, qty: 48, min: 10, unit: 'boxes', img: '' },
    { name: 'Laser Printer Toner Cartridge Black', sku: 'OTH-TNR-030', cat: 5, sup: 2, price: 45.00, qty: 18, min: 5, unit: 'pcs', img: '' },
    { name: 'Conference Speakerphone Bluetooth', sku: 'ELEC-SPK-031', cat: 1, sup: 1, price: 135.00, qty: 16, min: 4, unit: 'units', img: '' },
    { name: 'DisplayPort to HDMI Cable 2m', sku: 'ACC-DP-032', cat: 2, sup: 1, price: 14.00, qty: 32, min: 10, unit: 'pcs', img: '' },
    { name: 'Heavy Duty Lab Workbench', sku: 'FURN-BNCH-033', cat: 3, sup: 2, price: 620.00, qty: 8, min: 2, unit: 'units', img: '' },
    { name: 'Safety Eyewear Glasses UV400', sku: 'OTH-EYE-034', cat: 5, sup: 2, price: 7.50, qty: 64, min: 15, unit: 'pairs', img: '' },
    { name: 'Component Organizer 30 Drawers', sku: 'FURN-ORG-035', cat: 3, sup: 2, price: 38.00, qty: 21, min: 5, unit: 'units', img: '' },
    { name: 'Logic Analyzer 8CH 24MHz', sku: 'LAB-LOG-036', cat: 4, sup: 4, price: 28.00, qty: 17, min: 4, unit: 'pcs', img: '' },
    { name: 'Sensor Starter Kit 37-in-1', sku: 'ELEC-SNS-037', cat: 1, sup: 3, price: 29.00, qty: 25, min: 6, unit: 'kits', img: '' },
    { name: 'High-Speed MicroSD Card 128GB', sku: 'ACC-SD-038', cat: 2, sup: 1, price: 16.50, qty: 42, min: 10, unit: 'pcs', img: '' },
    { name: 'Infrared Thermal Camera Handheld', sku: 'LAB-THM-039', cat: 4, sup: 4, price: 399.00, qty: 6, min: 2, unit: 'units', img: '' },
    { name: 'Fiber Optic Cleaning Pen 2.5mm', sku: 'OTH-FIB-040', cat: 5, sup: 2, price: 22.00, qty: 19, min: 5, unit: 'pcs', img: '' },
    { name: 'Wireless Barcode Scanner 2D', sku: 'ELEC-BCS-041', cat: 1, sup: 1, price: 82.00, qty: 15, min: 4, unit: 'units', img: '' },
    { name: 'Cable Management Sleeve 3m', sku: 'ACC-CMS-042', cat: 2, sup: 1, price: 11.50, qty: 38, min: 8, unit: 'rolls', img: '' },
    { name: 'Surge Protector Power Strip 8-Outlet', sku: 'ACC-PWR-043', cat: 2, sup: 1, price: 26.00, qty: 35, min: 8, unit: 'pcs', img: '' },
    { name: 'Anti-Fatigue Standing Mat', sku: 'FURN-MAT-044', cat: 3, sup: 2, price: 48.00, qty: 12, min: 3, unit: 'pcs', img: '' },
    { name: 'Component Desoldering Vacuum Pump', sku: 'LAB-VAC-045', cat: 4, sup: 4, price: 14.00, qty: 24, min: 6, unit: 'pcs', img: '' },
    { name: 'Step-Down Buck Converter Module 5A', sku: 'ELEC-BCK-046', cat: 1, sup: 3, price: 4.50, qty: 58, min: 15, unit: 'pcs', img: '' },
    { name: 'Rechargeable AA Batteries 8-Pack', sku: 'OTH-BAT-047', cat: 5, sup: 2, price: 18.00, qty: 31, min: 8, unit: 'packs', img: '' },
    { name: 'HDMI to VGA Active Adapter', sku: 'ACC-VGA-048', cat: 2, sup: 1, price: 9.90, qty: 22, min: 6, unit: 'pcs', img: '' }
  ];

  for (const p of productList) {
    run(`
      INSERT INTO products (name, sku, description, category_id, supplier_id, unit_price, quantity, minimum_stock, unit, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      p.name,
      p.sku,
      `Standard inventory asset for ${p.name}`,
      p.cat,
      p.sup,
      p.price,
      p.qty,
      p.min,
      p.unit,
      p.img || null
    ]);
  }

  // 5. Stock transactions matching the dashboard image and recent timeline
  // The dashboard shows:
  // 1: Wireless Mouse (IN, +50, 24 Oct 2026, 10:15 AM, Completed)
  // 2: HDMI Cable (OUT, -10, 24 Oct 2026, 09:40 AM, Completed)
  // 3: Mechanical Keyboard (IN, +30, 23 Oct 2026, 04:20 PM, Completed)
  // 4: Monitor (OUT, -5, 23 Oct 2026, 11:10 AM, Completed)
  // 5: USB-C Adapter (IN, +100, 22 Oct 2026, 02:30 PM, Completed)
  const initialTransactions = [
    {
      prodId: 2, // Wireless Mouse
      type: 'IN',
      qty: 50,
      prev: 8,
      next: 58,
      supId: 1,
      dest: null,
      ref: 'PO-2026-1042',
      reason: 'Batch Restock Order',
      notes: 'Received bulk shipment via Apex Tech Express',
      date: '2026-10-24 10:15:00'
    },
    {
      prodId: 1, // HDMI Cable
      type: 'OUT',
      qty: 10,
      prev: 15,
      next: 5,
      supId: null,
      dest: 'CS Lab 3 - Multimedia Project',
      ref: 'ISSUE-2026-089',
      reason: 'Lab Allocation',
      notes: 'Issued to Prof. Miller for Lab upgrade',
      date: '2026-10-24 09:40:00'
    },
    {
      prodId: 10, // Mechanical Keyboard
      type: 'IN',
      qty: 30,
      prev: 8,
      next: 38,
      supId: 1,
      dest: null,
      ref: 'PO-2026-1038',
      reason: 'Standard Replenishment',
      notes: 'Delivered in mint condition',
      date: '2026-10-23 16:20:00'
    },
    {
      prodId: 11, // Monitor 27-inch
      type: 'OUT',
      qty: 5,
      prev: 27,
      next: 22,
      supId: null,
      dest: 'Robotics Research Wing',
      ref: 'ISSUE-2026-085',
      reason: 'Research Workstations',
      notes: 'Authorized by Dean of Engineering',
      date: '2026-10-23 11:10:00'
    },
    {
      prodId: 12, // USB-C Adapter
      type: 'IN',
      qty: 100,
      prev: 0,
      next: 100,
      supId: 1,
      dest: null,
      ref: 'PO-2026-1025',
      reason: 'Restock All Depleted Adapters',
      notes: 'High demand accessory replenished',
      date: '2026-10-22 14:30:00'
    },
    // Past historical transactions to populate last 6 months stock movements
    {
      prodId: 10,
      type: 'IN',
      qty: 25,
      prev: 0,
      next: 25,
      supId: 1,
      dest: null,
      ref: 'PO-2026-0512',
      reason: 'Quarterly Inventory Purchase',
      notes: 'May delivery',
      date: '2026-05-14 11:00:00'
    },
    {
      prodId: 10,
      type: 'OUT',
      qty: 15,
      prev: 25,
      next: 10,
      supId: null,
      dest: 'Hardware Lab',
      ref: 'ISSUE-2026-033',
      reason: 'Semester setup',
      notes: 'June lab setup',
      date: '2026-06-18 14:20:00'
    },
    {
      prodId: 11,
      type: 'IN',
      qty: 20,
      prev: 12,
      next: 32,
      supId: 1,
      dest: null,
      ref: 'PO-2026-0701',
      reason: 'Monitors restock',
      notes: 'July shipment',
      date: '2026-07-20 10:15:00'
    },
    {
      prodId: 1,
      type: 'IN',
      qty: 40,
      prev: 5,
      next: 45,
      supId: 1,
      dest: null,
      ref: 'PO-2026-0820',
      reason: 'Cables bulk order',
      notes: 'August restocking',
      date: '2026-08-22 09:30:00'
    },
    {
      prodId: 12,
      type: 'OUT',
      qty: 20,
      prev: 45,
      next: 25,
      supId: null,
      dest: 'Design Department',
      ref: 'ISSUE-2026-062',
      reason: 'Staff distribution',
      notes: 'September distribution',
      date: '2026-09-15 15:45:00'
    }
  ];

  for (const t of initialTransactions) {
    run(`
      INSERT INTO stock_transactions 
      (product_id, type, quantity, previous_quantity, new_quantity, supplier_id, recipient_destination, reference_number, reason, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.prodId,
      t.type,
      t.qty,
      t.prev,
      t.next,
      t.supId,
      t.dest,
      t.ref,
      t.reason,
      t.notes,
      'Aarav Sharma',
      t.date
    ]);
  }

  // 6. Settings
  const defaultSettings = [
    { key: 'organization_name', value: 'StockSmart AI Campus & Enterprise' },
    { key: 'admin_email', value: 'admin@stocksmart.ai' },
    { key: 'default_min_stock', value: '10' },
    { key: 'email_notifications', value: 'true' },
    { key: 'currency_symbol', value: '$' },
    { key: 'ai_model_name', value: 'Gemini Pro / StockSmart Rule Engine' }
  ];

  for (const s of defaultSettings) {
    run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [s.key, s.value]);
  }

  console.log('Database seeded successfully!');
};

// If run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seedRunner.js')) {
  seedDatabase(true);
}
