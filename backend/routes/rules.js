const express = require('express');
const router  = express.Router();
const { getRules, createRule, updateRule, toggleRule, deleteRule } = require('../controllers/ruleController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/',            authorize('admin', 'analyst', 'viewer'), getRules);
router.post('/',           authorize('admin'),                      createRule);
router.put('/:id',         authorize('admin'),                      updateRule);
router.patch('/:id/toggle',authorize('admin'),                      toggleRule);
router.delete('/:id',      authorize('admin'),                      deleteRule);

module.exports = router;
