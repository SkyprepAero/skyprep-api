const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const newsletterRoutes = require('./newsletterRoutes');
const roleRoutes = require('./roleRoutes');
const subjectRoutes = require('./subjectRoutes');
const chapterRoutes = require('./chapterRoutes');
const questionRoutes = require('./questionRoutes');
const optionRoutes = require('./optionRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/roles', roleRoutes);
router.use('/subjects', subjectRoutes);
router.use('/chapters', chapterRoutes);
router.use('/questions', questionRoutes);
router.use('/options', optionRoutes);

module.exports = router;

