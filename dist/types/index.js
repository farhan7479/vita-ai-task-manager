"use strict";
// Core data types for the Smart Task Manager
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_WINDOWS = exports.DEFAULT_WEIGHTS = void 0;
// Default scoring weights as specified in requirements
exports.DEFAULT_WEIGHTS = {
    W_urgency: 0.5,
    W_impact: 0.3,
    W_effort: 0.15,
    W_tod: 0.15,
    W_penalty: 0.2
};
// Time windows as specified in requirements
exports.TIME_WINDOWS = {
    morning: { start: '05:00', end: '11:59' },
    day: { start: '12:00', end: '17:59' },
    evening: { start: '18:00', end: '23:59' }
};
//# sourceMappingURL=index.js.map