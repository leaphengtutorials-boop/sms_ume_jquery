/**
 * CORE / CONFIG — Global State
 */

const API = "api";

let allSubjects  = [];
let allStudents  = [];
let allYears     = [];
let allCohorts   = [];

let currentCohortId    = null;
let currentStudentView = "list";
let currentSubjectId   = null;
let currentSubjectName = null;

let attendanceWeekSelected = {};

const DEBUG = true;
function log(...args) { if (DEBUG) console.log(...args); }