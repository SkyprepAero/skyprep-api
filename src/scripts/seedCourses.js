require('dotenv').config();
const mongoose = require('mongoose');
const { Course } = require('../models');

const seedCourses = [
  {
    name: 'Focus One Program',
    slug: 'focus-one-program',
    type: 'focus_one',
    description: 'Personalized one-on-one program tailored to a single student.',
    tags: ['focus', 'one-on-one'],
    metadata: {
      personalized: true,
      supportsIndividualScheduling: true
    },
    enrollmentConfig: {
      maxSeats: 1,
      allowWaitlist: false,
      autoApproveEnrollments: true
    }
  },
  {
    name: 'Standard Cohort Template',
    slug: 'standard-cohort-template',
    type: 'cohort',
    description: 'Template cohort used as a base for new cohort instances.',
    tags: ['cohort'],
    metadata: {
      allowsMultipleStudents: true,
      requiresSchedule: true
    },
    enrollmentConfig: {
      maxSeats: 50,
      allowWaitlist: true,
      autoApproveEnrollments: false
    }
  },
  {
    name: 'General Test Series',
    slug: 'general-test-series',
    type: 'test_series',
    description: 'Baseline test series configuration supporting multiple test tracks.',
    tags: ['test', 'series'],
    metadata: {
      supportsMultipleTracks: true,
      requiresAssessmentPlan: true
    },
    enrollmentConfig: {
      maxSeats: null,
      allowWaitlist: true,
      autoApproveEnrollments: true
    }
  }
];

async function runSeeder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const course of seedCourses) {
      const { slug, ...courseData } = course;

      const result = await Course.findOneAndUpdate(
        { slug },
        { $set: courseData, $setOnInsert: { slug } },
        { upsert: true, new: true }
      );

      console.log(`✓ Seeded course: ${result.name} [${result.type}]`);
    }

    console.log('\n✅ Course seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
}

runSeeder();


