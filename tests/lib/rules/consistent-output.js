/**
 * @fileoverview Enforce use of output assertions in rule tests
 * @author Teddy Katz
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const rule = require('../../../lib/rules/consistent-output');
const RuleTester = require('eslint').RuleTester;

const ERROR = { messageId: 'missingOutput', type: 'ObjectExpression' };

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

const ruleTester = new RuleTester();
ruleTester.run('consistent-output', rule, {
  valid: [
    {
      // Explicit option of `consistent` (no output in any tests).
      code: `
        new RuleTester().run('foo', bar, {
          valid: [],
          invalid: [
            { code: 'foo', errors: ['bar'] },
            { code: 'baz', errors: ['qux'] }
          ]
        });
      `,
      options: ['consistent'],
    },
    {
      // Explicit option of `consistent` (output in all tests).
      code: `
        new RuleTester().run('foo', bar, {
          valid: [],
          invalid: [
            { code: 'foo', output: 'baz', errors: ['bar'] },
            { code: 'foo', output: 'qux', errors: ['bar'] },
          ]
        });
      `,
      options: ['consistent'],
    },
    {
      // Explicit option of `always`.
      code: `
        new RuleTester().run('foo', bar, {
          valid: [],
          invalid: [
            { code: 'foo', output: 'baz', errors: ['bar'] },
            { code: 'foo', output: 'qux', errors: ['bar'] },
            { code: 'foo', output: null, errors: ['bar'] },
          ]
        });
      `,
      options: ['always'],
    },
    // With default option of `always`.
    `
      new RuleTester().run('foo', bar, {
        valid: [],
        invalid: [
          { code: 'foo', output: 'baz', errors: ['bar'] },
        ]
      });
    `,
  ],

  invalid: [
    {
      // Explicit option of `consistent`.
      code: `
        new RuleTester().run('foo', bar, {
          valid: [],
          invalid: [
            { code: 'foo', output: 'baz', errors: ['bar'] },
            { code: 'foo', errors: ['bar'] },
            { code: 'foo bar', errors: ['bar'] },
          ]
        });
      `,
      options: ['consistent'],
      errors: [ERROR, ERROR],
    },
    {
      // Explicit option of `always`.
      code: `
        new RuleTester().run('foo', bar, {
          valid: [],
          invalid: [
            { code: 'foo', errors: ['bar'] },
          ]
        });
      `,
      options: ['always'],
      errors: [ERROR],
    },
    {
      // With default option of `always`.
      code: `
        new RuleTester().run('foo', bar, {
          valid: [],
          invalid: [
            { code: 'foo', errors: ['bar'] },
          ]
        });
      `,
      errors: [ERROR],
    },
  ],
});
