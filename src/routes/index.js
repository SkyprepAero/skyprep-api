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
const leadRoutes = require('./leadRoutes');
const focusOneRoutes = require('./focusOneRoutes');
const cohortRoutes = require('./cohortRoutes');
const testSeriesRoutes = require('./testSeriesRoutes');
const sessionRoutes = require('./sessionRoutes');
const adminEnrollmentRoutes = require('../admin/enrollmentRoutes');
const adminTeacherRoutes = require('../admin/teacherRoutes');
const adminPublicHolidayRoutes = require('../admin/publicHolidayRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/roles', roleRoutes);
router.use('/subjects', subjectRoutes);
router.use('/chapters', chapterRoutes);
router.use('/questions', questionRoutes);
router.use('/options', optionRoutes);
router.use('/leads', leadRoutes);
router.use('/focus-ones', focusOneRoutes);
router.use('/cohorts', cohortRoutes);
router.use('/test-series', testSeriesRoutes);
router.use('/sessions', sessionRoutes);
router.use('/admin', adminEnrollmentRoutes);
router.use('/admin/teachers', adminTeacherRoutes);
router.use('/admin', adminPublicHolidayRoutes);

module.exports = router;

