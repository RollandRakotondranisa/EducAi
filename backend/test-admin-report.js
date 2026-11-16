const test = require('node:test');
const assert = require('node:assert/strict');

const authController = require('./src/controllers/auth.controller');
const authService = require('./src/services/auth.service');

test('admin report controller exposes report endpoints', () => {
  assert.equal(typeof authController.generateAdminReport, 'function');
  assert.equal(typeof authController.exportAdminReport, 'function');
});

test('admin report service exposes report builders', () => {
  assert.equal(typeof authService.generateAdminReport, 'function');
  assert.equal(typeof authService.buildAdminReportSummary, 'function');
});

test('admin report recommendations reflect operational risks', () => {
  const report = authService.buildAdminReportSummary({
    totalUsers: 100,
    totalStudents: 80,
    totalTeachers: 15,
    totalAdmins: 5,
    totalCourses: 10,
    totalExams: 10,
    publishedExams: 2,
    activeUsers: 20,
    pendingRequests: 3,
  });
  const recommendations = authService.buildAdminReportRecommendations(report.summary);

  assert.ok(recommendations.some((item) => item.priority === 'high'));
  assert.ok(recommendations.some((item) => item.title === 'Accélérer la publication des examens'));
});
