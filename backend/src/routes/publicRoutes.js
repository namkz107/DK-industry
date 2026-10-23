const express = require('express');
const Product = require('../models/Product');
const Project = require('../models/Project');
const Service = require('../models/Service');
const SiteSetting = require('../models/SiteSetting');
const { presentSiteSetting } = require('../siteContent');
const mongoose = require('mongoose');
const { createPublicLead } = require('../services/leadService');
const { leadAcknowledgementEmail, leadOperationsEmail } = require('../services/emailTemplateService');
const { notifyQuoteWatchers, quoteAdminEmail, dispatchSoon, sendDirectEmail } = require('../services/notificationService');
const packageInfo = require('../../package.json');

const router = express.Router();
const parseBoolean = value => value === undefined ? undefined : value === 'true';

const serviceIdentity = () => ({
  service: 'DK Industry API',
  version: process.env.APP_VERSION || packageInfo.version,
  release: process.env.RELEASE_SHA || 'local'
});

router.get('/live', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, ...serviceIdentity(), status: 'alive', uptimeSeconds: Math.round(process.uptime()), timestamp: new Date() });
});

const readiness = (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.set('Cache-Control', 'no-store');
  res.status(databaseReady ? 200 : 503).json({ success: databaseReady, ...serviceIdentity(), status: databaseReady ? 'ready' : 'unavailable', database: databaseReady ? 'ready' : 'unavailable', timestamp: new Date() });
};

router.get('/ready', readiness);
router.get('/health', readiness);

router.get('/site-settings/about', async (_req, res, next) => {
  try {
    const setting = await SiteSetting.findOne({ key: 'about' }).lean();
    res.json({ success: true, data: presentSiteSetting(setting) });
  } catch (error) { next(error); }
});

router.get('/projects', async (req, res, next) => {
  try {
    const query = { published: true, deletedAt: null };
    if (req.query.featured !== undefined) query.featured = parseBoolean(req.query.featured);
    if (req.query.category) query.category = req.query.category;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const [data, count, total, categories] = await Promise.all([
      Project.find(query).select('-client -deletedAt').sort({ featured: -1, year: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Project.countDocuments(query),
      Project.countDocuments({ published: true, deletedAt: null }),
      Project.distinct('category', { published: true, deletedAt: null })
    ]);
    res.json({ success: true, count, total, page, pages: Math.max(1, Math.ceil(count / limit)), categories: categories.sort(), data });
  } catch (error) { next(error); }
});

router.get('/products', async (req, res, next) => {
  try {
    const query = { active: true, deletedAt: null };
    if (req.query.featured !== undefined) query.featured = parseBoolean(req.query.featured);
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) query.$text = { $search: req.query.search };
    const data = await Product.find(query).sort({ featured: -1, createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 20, 100));
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
});

router.get('/products/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    const data = await Product.findOne({ slug, active: true, deletedAt: null }).lean();
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/services', async (req, res, next) => {
  try {
    const query = { published: true, deletedAt: null };
    if (req.query.featured !== undefined) query.featured = parseBoolean(req.query.featured);
    const data = await Service.find(query).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
});

router.post('/leads', async (req, res, next) => {
  try {
    const { lead, duplicate } = await createPublicLead(req.body, req.body.sourceDetails || {});
    if (!duplicate) {
      try { await deliverLeadNotice(lead); }
      catch (error) { console.error('Lead notice failed:', error.message); }
    }
    res.status(duplicate ? 200 : 201).json({ success: true, message: duplicate ? 'Yêu cầu này đã được tiếp nhận trước đó' : 'Yêu cầu đã được tiếp nhận', data: { id: lead._id, code: lead.code, status: lead.status, duplicate } });
  } catch (error) { next(error); }
});

async function deliverLeadNotice(lead) {
  const summary = `${lead.name} · ${lead.phone} · ${lead.email}. ${lead.serviceType || 'Tư vấn'}. ${lead.message || ''}`.slice(0, 1000);
  await notifyQuoteWatchers({
    type: 'lead.created',
    title: `Yêu cầu báo giá mới ${lead.code}`,
    message: summary,
    link: `/staff/requests?view=new&leadId=${lead._id}`,
    metadata: { leadId: lead._id }
  });
  const acknowledgement = leadAcknowledgementEmail(lead);
  const operations = leadOperationsEmail(lead);
  const company = String(process.env.COMPANY_EMAIL || '').trim();
  const deliveries = [sendDirectEmail({ to: lead.email, subject: acknowledgement.subject, text: acknowledgement.text, html: acknowledgement.html })];
  if (company && company.toLowerCase() !== quoteAdminEmail()) deliveries.push(sendDirectEmail({ to: company, subject: operations.subject, text: operations.text, html: operations.html }));
  await Promise.all(deliveries);
  dispatchSoon();
}

module.exports = router;
