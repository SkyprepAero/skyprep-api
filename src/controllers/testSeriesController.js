const mongoose = require('mongoose');
const TestSeries = require('../models/TestSeries');
const { successResponse } = require('../utils/response');
const { AppError } = require('../errors');
const { ERROR_CODES } = require('../errors');

/**
 * Generate slug from name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Create a new Test Series
 */
const createTestSeries = async (req, res, next) => {
  try {
    const { name, description, subjects, settings, availabilityWindow, metadata, slug, status } = req.body;

    // Generate slug if not provided
    const testSeriesSlug = slug || generateSlug(name);

    // Check if Test Series with this slug already exists
    const existingTestSeries = await TestSeries.findOne({ slug: testSeriesSlug });
    if (existingTestSeries) {
      throw new AppError(ERROR_CODES.TEST_SERIES.ALREADY_EXISTS, 400, { field: 'slug', value: testSeriesSlug });
    }

    const testSeries = new TestSeries({
      name,
      slug: testSeriesSlug,
      description,
      subjects: subjects || [],
      settings: settings || {
        maxAttemptsPerTest: 1,
        totalDurationMinutes: null,
        gradingPolicy: null
      },
      availabilityWindow: availabilityWindow || {
        opensAt: null,
        closesAt: null
      },
      metadata: metadata || {},
      status: status || 'draft'
    });

    await testSeries.save();

    successResponse(res, testSeries, 'Test Series created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Test Series
 */
const getAllTestSeries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { deletedAt: null };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (isActive !== undefined) {
      const isActiveBool = isActive === 'true' || isActive === true;
      filter.isActive = isActiveBool;
    }

    const testSeries = await TestSeries.find(filter)
      .populate('subjects.subject', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TestSeries.countDocuments(filter);

    successResponse(res, {
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Test Series retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Test Series by ID
 */
const getTestSeriesById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testSeries = await TestSeries.findById(id).populate('subjects.subject', 'name description');
    if (!testSeries) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    successResponse(res, testSeries, 'Test Series retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update Test Series
 */
const updateTestSeries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, subjects, settings, availabilityWindow, metadata, status, isActive } = req.body;

    const testSeries = await TestSeries.findById(id);
    if (!testSeries) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    // Generate slug if name is changed and slug is not provided
    let newSlug = slug;
    if (name && name !== testSeries.name && !slug) {
      newSlug = generateSlug(name);
    }

    // Check if slug is being changed and if it already exists
    if (newSlug && newSlug !== testSeries.slug) {
      const existingTestSeries = await TestSeries.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingTestSeries) {
        throw new AppError(ERROR_CODES.TEST_SERIES.ALREADY_EXISTS, 400, { field: 'slug', value: newSlug });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (newSlug !== undefined) updateData.slug = newSlug;
    if (description !== undefined) updateData.description = description;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (settings !== undefined) updateData.settings = settings;
    if (availabilityWindow !== undefined) updateData.availabilityWindow = availabilityWindow;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTestSeries = await TestSeries.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subjects.subject', 'name description');

    successResponse(res, updatedTestSeries, 'Test Series updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Test Series (soft delete)
 */
const deleteTestSeries = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testSeries = await TestSeries.findById(id);
    if (!testSeries) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    await testSeries.softDelete();

    successResponse(res, null, 'Test Series deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore soft deleted Test Series
 */
const restoreTestSeries = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testSeries = await TestSeries.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), deletedAt: { $ne: null } } }
    ]);
    
    if (testSeries.length === 0) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    await TestSeries.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { deletedAt: null }
    );

    const restoredTestSeries = await TestSeries.findById(id).populate('subjects.subject', 'name description');

    successResponse(res, restoredTestSeries, 'Test Series restored successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get soft deleted Test Series
 */
const getDeletedTestSeries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const testSeries = await TestSeries.aggregate([
      { $match: { deletedAt: { $ne: null } } },
      { $sort: { deletedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await TestSeries.aggregate([
      { $match: { deletedAt: { $ne: null } } },
      { $count: "total" }
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    successResponse(res, {
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    }, 'Deleted Test Series retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTestSeries,
  getAllTestSeries,
  getTestSeriesById,
  updateTestSeries,
  deleteTestSeries,
  restoreTestSeries,
  getDeletedTestSeries
};

