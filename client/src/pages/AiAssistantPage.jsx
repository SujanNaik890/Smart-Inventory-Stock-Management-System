import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Download,
  FileText,
  FileDown,
  Printer,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Bot,
  User,
  RefreshCw,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { aiService, productService, reportService } from '../services/api';
import RobotIllustration from '../components/RobotIllustration';
import NotificationToast from '../components/NotificationToast';

export const AiAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello Aarav! I am **StockSmart AI**, your intelligent inventory assistant 🤖. 

I have full visibility into your live product catalog, exact inventory counts, threshold buffers, and purchase history.

How can I help you optimize your inventory today? You can ask me to:
• **"Generate end inventory report"**
• **"What products are out of stock?"**
• **"How many units of HDMI Cable do we have?"**
• **"Calculate total inventory valuation"**`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recSummary, setRecSummary] = useState(null);
  const [aiMode, setAiMode] = useState('');
  const [loadingRecs, setLoadingRecs] = useState(true);

  // End Report Generated State
  const [generatedReport, setGeneratedReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [toast, setToast] = useState(null);
  const chatEndRef = useRef(null);

  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const res = await aiService.getRecommendations();
      if (res.success) {
        setRecommendations(res.recommendations || []);
        setRecSummary(res.summary);
        setAiMode(res.mode);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setChatLoading(true);

    try {
      const res = await aiService.sendMessage(text);
      if (res.success) {
        const botMsg = { id: Date.now() + 1, sender: 'bot', text: res.reply };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      const errorMsg = { id: Date.now() + 1, sender: 'bot', text: `⚠️ Error processing query: ${err.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Comprehensive End Report
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await aiService.getReportData();
      if (res.success) {
        setGeneratedReport(res.report);
        setToast({ type: 'success', message: 'Comprehensive AI inventory report compiled successfully!' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setGeneratingReport(false);
    }
  };

  // 1. Download PDF Report
  const downloadPDFReport = () => {
    if (!generatedReport) return;
    const doc = new jsPDF();
    const rep = generatedReport;
    const dateStr = new Date(rep.generatedAt).toLocaleString();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(64, 91, 255);
    doc.text('StockSmart AI — Executive Inventory Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 140);
    doc.text(`Generated on: ${dateStr} | Auditor: Aarav Sharma (Admin)`, 14, 27);
    doc.line(14, 31, 196, 31);

    // Section 1: Metrics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(16, 26, 70);
    doc.text('1. Inventory Health Summary', 14, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Products in Catalog: ${rep.summary.totalProducts} distinct SKUs`, 16, 48);
    doc.text(`• Total Physical Inventory Units: ${rep.summary.totalUnits.toLocaleString()} units`, 16, 54);
    doc.text(`• Total Capital Asset Valuation: $${rep.summary.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 16, 60);
    doc.text(`• Out of Stock Items: ${rep.summary.outOfStockCount}`, 16, 66);
    doc.text(`• Low Stock Items Requiring Restock: ${rep.summary.lowStockCount}`, 16, 72);

    // Section 2: Critical Low Stock Items
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('2. Critical Restock Recommendations', 14, 84);

    let y = 92;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Name', 16, y);
    doc.text('SKU', 80, y);
    doc.text('Current Qty', 120, y);
    doc.text('Min Buffer', 150, y);
    doc.text('Status', 175, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    rep.lowStockItems.slice(0, 15).forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.name.slice(0, 32), 16, y);
      doc.text(item.sku, 80, y);
      doc.text(`${item.quantity} ${item.unit}`, 120, y);
      doc.text(`${item.minimum_stock} ${item.unit}`, 150, y);
      doc.text(item.quantity === 0 ? 'DEPLETED' : 'LOW STOCK', 175, y);
      y += 6;
    });

    // Save
    doc.save(`StockSmart_AI_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    setToast({ type: 'success', message: 'PDF report downloaded successfully!' });
  };

  // 2. Download Word / DOC Report
  const downloadDOCReport = () => {
    if (!generatedReport) return;
    const rep = generatedReport;
    const dateStr = new Date(rep.generatedAt).toLocaleString();

    const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>${rep.title}</title>
<style>
body { font-family: Calibri, Arial, sans-serif; line-height: 1.5; color: #101A46; }
h1 { color: #405BFF; font-size: 22pt; margin-bottom: 4pt; }
h2 { color: #101A46; font-size: 15pt; border-bottom: 2pt solid #405BFF; padding-bottom: 3pt; margin-top: 18pt; }
table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
th, td { border: 1px solid #D1D5DB; padding: 6pt 10pt; text-align: left; font-size: 10pt; }
th { background-color: #F3F4F6; font-weight: bold; }
.badge-danger { color: #DC2626; font-weight: bold; }
.badge-warning { color: #D97706; font-weight: bold; }
</style>
</head>
<body>
<h1>StockSmart AI — Executive Inventory Analysis Report</h1>
<p style="color: #6B7280; font-size: 10pt;">Generated on: ${dateStr} | Prepared for: Management &amp; Laboratory Operations</p>
<hr/>

<h2>1. Executive Summary &amp; Key Metrics</h2>
<ul>
  <li><strong>Total Registered Products:</strong> ${rep.summary.totalProducts} distinct SKUs</li>
  <li><strong>Total Physical Units in Warehouse:</strong> ${rep.summary.totalUnits.toLocaleString()} units</li>
  <li><strong>Total Inventory Capital Asset Value:</strong> $${rep.summary.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</li>
  <li><strong>Out of Stock Items:</strong> <span class="badge-danger">${rep.summary.outOfStockCount}</span></li>
  <li><strong>Items Below Safety Threshold:</strong> <span class="badge-warning">${rep.summary.lowStockCount}</span></li>
</ul>

<h2>2. Priority Restocking Rationale</h2>
<table>
  <thead>
    <tr>
      <th>Product Name</th>
      <th>SKU</th>
      <th>Category</th>
      <th>Current Stock</th>
      <th>Min Threshold</th>
      <th>Unit Price</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rep.lowStockItems.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td><code>${item.sku}</code></td>
        <td>${item.category_name}</td>
        <td>${item.quantity} ${item.unit}</td>
        <td>${item.minimum_stock} ${item.unit}</td>
        <td>$${item.unit_price.toFixed(2)}</td>
        <td>${item.quantity === 0 ? '<span class="badge-danger">Out of Stock</span>' : '<span class="badge-warning">Low Stock</span>'}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<h2>3. Catalog Snapshot</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Product Name</th>
      <th>SKU</th>
      <th>Available Qty</th>
      <th>Unit Price</th>
      <th>Total Valuation</th>
    </tr>
  </thead>
  <tbody>
    ${rep.products.slice(0, 25).map((p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${p.name}</td>
        <td>${p.sku}</td>
        <td>${p.quantity} ${p.unit}</td>
        <td>$${p.unit_price.toFixed(2)}</td>
        <td>$${(p.quantity * p.unit_price).toFixed(2)}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<p style="margin-top: 20pt; font-size: 9pt; color: #9CA3AF;">Confidential Document — Generated by StockSmart AI Platform &copy; 2026</p>
</body>
</html>
    `;

    const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockSmart_Report_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Word (.doc) report downloaded successfully!' });
  };

  // 3. Download Plain Text Report
  const downloadTXTReport = () => {
    if (!generatedReport) return;
    const rep = generatedReport;
    const dateStr = new Date(rep.generatedAt).toLocaleString();

    let txt = `========================================================================\n`;
    txt += `  STOCKSMART AI — EXECUTIVE INVENTORY MANAGEMENT REPORT\n`;
    txt += `  Generated: ${dateStr}\n`;
    txt += `  Auditor: Aarav Sharma (Admin)\n`;
    txt += `========================================================================\n\n`;

    txt += `1. EXECUTIVE METRICS SUMMARY\n`;
    txt += `------------------------------------------------------------------------\n`;
    txt += `• Total Registered Catalog SKUs: ${rep.summary.totalProducts}\n`;
    txt += `• Total Physical Stock Units:   ${rep.summary.totalUnits.toLocaleString()}\n`;
    txt += `• Total Asset Capital Value:    $${rep.summary.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    txt += `• Out of Stock Items:           ${rep.summary.outOfStockCount}\n`;
    txt += `• Low Stock Items:              ${rep.summary.lowStockCount}\n\n`;

    txt += `2. CRITICAL RESTOCKING SCHEDULE\n`;
    txt += `------------------------------------------------------------------------\n`;
    rep.lowStockItems.forEach(item => {
      txt += `* [${item.sku}] ${item.name}\n`;
      txt += `  Available: ${item.quantity} ${item.unit} | Min Required: ${item.minimum_stock} ${item.unit} | Unit Price: $${item.unit_price.toFixed(2)}\n`;
      txt += `  Status: ${item.quantity === 0 ? 'CRITICAL (OUT OF STOCK)' : 'LOW STOCK'}\n\n`;
    });

    txt += `\n========================================================================\n`;
    txt += `End of Audit Report — StockSmart AI Platform\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockSmart_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Text (.txt) report downloaded successfully!' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg, #405BFF 0%, #8267F5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(64, 91, 255, 0.3)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
              AI Inventory Assistant &amp; Report Generator
            </h2>
            <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '2px' }}>
              Powered by StockSmart AI Engine with live inventory data querying and multi-format document generation.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="btn-primary"
            style={{ padding: '10px 20px' }}
          >
            <FileText size={18} />
            <span>{generatingReport ? 'Compiling Report...' : 'Generate Official Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Chat Bot on Left (55%) & Smart Restock Recommendations on Right (45%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }} className="ai-main-grid">
        {/* Left Column: Interactive Chat Interface */}
        <div
          className="stock-card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            height: '640px'
          }}
        >
          {/* Chat Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E7ECF7', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RobotIllustration size={36} />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#101A46' }}>
                  StockSmart Assistant
                </h3>
                <span style={{ fontSize: '11.5px', color: '#16B979', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16B979' }} />
                  Live Database Connected
                </span>
              </div>
            </div>

            <button
              onClick={() => setMessages([{
                id: Date.now(),
                sender: 'bot',
                text: 'Chat history cleared. How can I assist you with your inventory records?'
              }])}
              style={{ fontSize: '12px', color: '#727D9E', padding: '4px 8px', borderRadius: '6px' }}
            >
              Clear
            </button>
          </div>

          {/* Quick Pill Prompts */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px' }}>
            {[
              'Generate end inventory report',
              'What products are out of stock?',
              'Which items need restocking?',
              'How many units of HDMI Cable?'
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                style={{
                  background: '#EEF2FF',
                  color: '#405BFF',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  border: '1px solid #C7D2FE',
                  flexShrink: 0
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px' }}>
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignSelf: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '88%'
                  }}
                >
                  {isBot && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Bot size={18} color="#405BFF" />
                    </div>
                  )}

                  <div
                    style={{
                      background: isBot ? '#F8FAFF' : 'linear-gradient(135deg, #405BFF 0%, #8267F5 100%)',
                      color: isBot ? '#101A46' : '#FFFFFF',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: isBot ? '1px solid #E7ECF7' : 'none',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {m.text}
                  </div>

                  {!isBot && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#405BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#FFFFFF', marginTop: '2px' }}>
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}
            {chatLoading && (
              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="#405BFF" />
                </div>
                <div style={{ background: '#F8FAFF', padding: '12px 16px', borderRadius: '16px', border: '1px solid #E7ECF7', fontSize: '13px', color: '#727D9E' }}>
                  Thinking &amp; analyzing inventory database...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px',
              borderTop: '1px solid #E7ECF7',
              paddingTop: '16px'
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about inventory counts, restock plans, or generate report..."
              disabled={chatLoading}
              style={{
                flex: 1,
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #E7ECF7',
                background: '#F6F8FF',
                fontSize: '13.5px'
              }}
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="btn-primary"
              style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0 }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* Right Column: Restock Prioritization Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Restock Summary Card */}
          <div className="stock-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} color="#FF9B38" strokeWidth={2.4} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
                  Restock Recommendations
                </h3>
              </div>

              <span style={{ fontSize: '11px', background: '#EEF2FF', color: '#405BFF', padding: '3px 10px', borderRadius: '10px', fontWeight: '700' }}>
                AI Evaluated
              </span>
            </div>

            {recSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Needs Restock</span>
                  <strong style={{ fontSize: '18px', color: '#FF9B38' }}>{recSummary.itemsNeedingRestock} items</strong>
                </div>
                <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Zero Stock</span>
                  <strong style={{ fontSize: '18px', color: '#FF525C' }}>{recSummary.outOfStockCount} items</strong>
                </div>
                <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Est. Capital</span>
                  <strong style={{ fontSize: '18px', color: '#101A46' }}>${recSummary.totalEstimatedRestockCost}</strong>
                </div>
              </div>
            )}

            {/* List of items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '440px', overflowY: 'auto' }}>
              {loadingRecs ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#727D9E', fontSize: '13px' }}>Evaluating buffer levels...</p>
              ) : recommendations.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#727D9E', fontSize: '13px' }}>All product stocks are at healthy quantities.</p>
              ) : (
                recommendations.map((rec) => {
                  const isCrit = rec.priority === 'Critical';
                  return (
                    <div
                      key={rec.productId}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${isCrit ? '#FECACA' : '#FED7AA'}`,
                        background: isCrit ? '#FFF5F5' : '#FFFDF7',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '13.5px', color: '#101A46' }}>{rec.productName}</strong>
                          <span style={{ fontSize: '11px', color: '#727D9E', marginLeft: '6px' }}>({rec.sku})</span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: isCrit ? '#FEF2F2' : '#FFF7ED',
                          color: isCrit ? '#DC2626' : '#D97706'
                        }}>
                          {rec.priority}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: '#576282' }}>
                        {rec.reasoning}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', paddingTop: '6px', borderTop: '1px dashed #E5E7EB' }}>
                        <span>Available: <strong style={{ color: isCrit ? '#DC2626' : '#D97706' }}>{rec.currentQuantity}</strong> / {rec.minimumStock} {rec.unit}</span>
                        <span style={{ color: '#166534', fontWeight: '700' }}>
                          Order: +{rec.suggestedRestockQuantity} {rec.unit} (~${rec.estimatedRestockCost})
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Report Presentation & Download Hub */}
      {generatedReport && (
        <div
          className="stock-card"
          style={{
            padding: '28px 32px',
            border: '2px solid #C7D2FE',
            background: '#FFFFFF',
            boxShadow: '0 12px 36px rgba(64, 91, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #E7ECF7', paddingBottom: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#405BFF' }}>
                <FileDown size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#101A46' }}>
                  {generatedReport.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#727D9E' }}>
                  Compiled at {new Date(generatedReport.generatedAt).toLocaleString()} | All database records audited
                </p>
              </div>
            </div>

            {/* Direct Multi-format Download Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={downloadPDFReport}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                <Download size={15} />
                <span>Download PDF (.pdf)</span>
              </button>

              <button
                onClick={downloadDOCReport}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                <FileText size={15} color="#405BFF" />
                <span>Download Word (.doc)</span>
              </button>

              <button
                onClick={downloadTXTReport}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                <Download size={15} />
                <span>Download Text (.txt)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12.5px' }}
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Render Preview of Report */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13.5px', color: '#101A46' }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#F8FAFF', padding: '14px', borderRadius: '12px', border: '1px solid #E7ECF7' }}>
                <span style={{ fontSize: '11.5px', color: '#727D9E', display: 'block' }}>Audited Catalog SKUs</span>
                <strong style={{ fontSize: '20px' }}>{generatedReport.summary.totalProducts} items</strong>
              </div>
              <div style={{ background: '#F8FAFF', padding: '14px', borderRadius: '12px', border: '1px solid #E7ECF7' }}>
                <span style={{ fontSize: '11.5px', color: '#727D9E', display: 'block' }}>Total Physical Inventory</span>
                <strong style={{ fontSize: '20px' }}>{generatedReport.summary.totalUnits.toLocaleString()} units</strong>
              </div>
              <div style={{ background: '#F8FAFF', padding: '14px', borderRadius: '12px', border: '1px solid #E7ECF7' }}>
                <span style={{ fontSize: '11.5px', color: '#727D9E', display: 'block' }}>Asset Valuation</span>
                <strong style={{ fontSize: '20px' }}>${generatedReport.summary.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ background: '#F8FAFF', padding: '14px', borderRadius: '12px', border: '1px solid #E7ECF7' }}>
                <span style={{ fontSize: '11.5px', color: '#727D9E', display: 'block' }}>Depleted (0 Units)</span>
                <strong style={{ fontSize: '20px', color: '#DC2626' }}>{generatedReport.summary.outOfStockCount} items</strong>
              </div>
            </div>

            {/* Critical Low Stock Items Table */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>
                Depleted &amp; Low Stock Items Requiring Restock Order
              </h4>
              <div className="data-table-wrapper" style={{ border: '1px solid #E7ECF7' }}>
                <table className="data-table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Current Qty</th>
                      <th>Min Required</th>
                      <th>Unit Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '700' }}>{item.name}</td>
                        <td><code>{item.sku}</code></td>
                        <td>{item.category_name}</td>
                        <td style={{ fontWeight: '800', color: item.quantity === 0 ? '#DC2626' : '#D97706' }}>
                          {item.quantity} {item.unit}
                        </td>
                        <td>{item.minimum_stock} {item.unit}</td>
                        <td>${item.unit_price.toFixed(2)}</td>
                        <td>
                          {item.quantity === 0 ? (
                            <span className="badge-out-of-stock">Depleted</span>
                          ) : (
                            <span className="badge-low-stock">Low Stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Media Tweaks */}
      <style>{`
        @media (max-width: 1024px) {
          .ai-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AiAssistantPage;
