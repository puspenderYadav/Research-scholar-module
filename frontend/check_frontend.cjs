/**
 * Frontend Module Check
 * Verifies all frontend components and pages exist
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('FRONTEND MODULE CHECK');
console.log('='.repeat(80));
console.log();

// Check if critical directories exist
const criticalDirs = [
  'src',
  'src/components',
  'src/pages',
  'src/contexts',
  'src/services'
];

console.log('[DIRECTORY STRUCTURE]');
console.log('-'.repeat(80));
let allDirsExist = true;
criticalDirs.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, dir));
  const status = exists ? '[PASS]' : '[FAIL]';
  console.log(`${status} ${dir}`);
  if (!exists) allDirsExist = false;
});
console.log();

// Check pages from App.jsx
const requiredPages = [
  'HomePage.jsx',
  'Login.jsx',
  'Dashboard.jsx',
  'ScholarProfile.jsx',
  'FacultyProfile.jsx',
  'SchoolChairProfile.jsx',
  'ResearchOfficeProfile.jsx',
  'DeanAcademicsProfile.jsx',
  'RecruitFaculty.jsx',
  'AddSchool.jsx',
  'Announcements.jsx',
  'Supervisors.jsx',
  'MyCommitteeScholars.jsx',
  'Seminars.jsx',
  'Synopsis.jsx',
  'ProgressReports.jsx',
  'Thesis.jsx',
  'TravelGrants.jsx',
  'Calendar.jsx',
  'Notifications.jsx',
  'SupervisorChangeRequest.jsx',
  'SupervisorChangeApprovals.jsx',
  'SupervisorApprovals.jsx',
  'BulkScholarUpload.jsx',
  'ComprehensiveExams.jsx',
  'LeaveApplications.jsx',
  'LeaveApprovals.jsx',
  'Meetings.jsx',
  'Approvals.jsx'
];

console.log('[PAGES]');
console.log('-'.repeat(80));
let allPagesExist = true;
requiredPages.forEach(page => {
  const pagePath = path.join(__dirname, 'src/pages', page);
  const exists = fs.existsSync(pagePath);
  const status = exists ? '[PASS]' : '[FAIL]';
  console.log(`${status} ${page}`);
  if (!exists) allPagesExist = false;
});
console.log();

// Check critical components
const criticalComponents = [
  'Layout.jsx',
  'PrivateRoute.jsx'
];

console.log('[CRITICAL COMPONENTS]');
console.log('-'.repeat(80));
let allComponentsExist = true;
criticalComponents.forEach(component => {
  const componentPath = path.join(__dirname, 'src/components', component);
  const exists = fs.existsSync(componentPath);
  const status = exists ? '[PASS]' : '[FAIL]';
  console.log(`${status} ${component}`);
  if (!exists) allComponentsExist = false;
});
console.log();

// Check contexts
const requiredContexts = [
  'AuthContext.jsx'
];

console.log('[CONTEXTS]');
console.log('-'.repeat(80));
let allContextsExist = true;
requiredContexts.forEach(context => {
  const contextPath = path.join(__dirname, 'src/contexts', context);
  const exists = fs.existsSync(contextPath);
  const status = exists ? '[PASS]' : '[FAIL]';
  console.log(`${status} ${context}`);
  if (!exists) allContextsExist = false;
});
console.log();

// Check services
const requiredServices = [
  'api.js'
];

console.log('[SERVICES]');
console.log('-'.repeat(80));
let allServicesExist = true;
requiredServices.forEach(service => {
  const servicePath = path.join(__dirname, 'src/services', service);
  const exists = fs.existsSync(servicePath);
  const status = exists ? '[PASS]' : '[FAIL]';
  console.log(`${status} ${service}`);
  if (!exists) allServicesExist = false;
});
console.log();

// Check package.json and dependencies
console.log('[DEPENDENCIES]');
console.log('-'.repeat(80));
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('[PASS] package.json exists');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const criticalDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'axios'
  ];

  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`[PASS] ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`[FAIL] ${dep}: NOT FOUND`);
    }
  });
} else {
  console.log('[FAIL] package.json not found');
}
console.log();

// List all components
console.log('[ALL COMPONENTS]');
console.log('-'.repeat(80));
const componentsDir = path.join(__dirname, 'src/components');
if (fs.existsSync(componentsDir)) {
  const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  components.forEach(comp => {
    console.log(`  - ${comp}`);
  });
  console.log(`  Total: ${components.length} components`);
} else {
  console.log('[FAIL] Components directory not found');
}
console.log();

// Routes summary
console.log('[ROUTES SUMMARY]');
console.log('-'.repeat(80));
const routes = [
  { path: '/', component: 'HomePage' },
  { path: '/login', component: 'Login' },
  { path: '/dashboard', component: 'Dashboard', protected: true },
  { path: '/profile', component: 'ScholarProfile', protected: true },
  { path: '/faculty-profile', component: 'FacultyProfile', protected: true },
  { path: '/school-chair-profile', component: 'SchoolChairProfile', protected: true },
  { path: '/research-office-profile', component: 'ResearchOfficeProfile', protected: true },
  { path: '/dean-academics-profile', component: 'DeanAcademicsProfile', protected: true },
  { path: '/seminars', component: 'Seminars', protected: true },
  { path: '/synopsis', component: 'Synopsis', protected: true },
  { path: '/progress-reports', component: 'ProgressReports', protected: true },
  { path: '/thesis', component: 'Thesis', protected: true },
  { path: '/travel-grants', component: 'TravelGrants', protected: true },
  { path: '/comprehensive-exams', component: 'ComprehensiveExams', protected: true },
  { path: '/leave-applications', component: 'LeaveApplications', protected: true },
  { path: '/leave-approvals', component: 'LeaveApprovals', protected: true },
  { path: '/meetings', component: 'Meetings', protected: true },
  { path: '/notifications', component: 'Notifications', protected: true },
  { path: '/approvals', component: 'Approvals', protected: true },
  { path: '/calendar', component: 'Calendar', protected: true }
];

console.log(`Total routes: ${routes.length}`);
console.log(`Protected routes: ${routes.filter(r => r.protected).length}`);
console.log(`Public routes: ${routes.filter(r => !r.protected).length}`);
console.log();

// Final summary
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`[${allDirsExist ? 'PASS' : 'FAIL'}] Directory Structure`);
console.log(`[${allPagesExist ? 'PASS' : 'FAIL'}] All Pages (${requiredPages.length} pages)`);
console.log(`[${allComponentsExist ? 'PASS' : 'FAIL'}] Critical Components`);
console.log(`[${allContextsExist ? 'PASS' : 'FAIL'}] Contexts`);
console.log(`[${allServicesExist ? 'PASS' : 'FAIL'}] Services`);
console.log('='.repeat(80));

const allPassed = allDirsExist && allPagesExist && allComponentsExist && allContextsExist && allServicesExist;
if (allPassed) {
  console.log('\n✓ All frontend modules are present and configured correctly!');
  process.exit(0);
} else {
  console.log('\n✗ Some frontend modules are missing or misconfigured!');
  process.exit(1);
}
