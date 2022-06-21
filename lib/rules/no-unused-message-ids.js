'use strict';

const utils = require('../utils');
const { findVariable } = require('eslint-utils');

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow unused `messageId`s in `meta.messages`',
      category: 'Rules',
      recommended: false,
      url: 'https://github.com/not-an-aardvark/eslint-plugin-eslint-plugin/tree/HEAD/docs/rules/no-unused-message-ids.md',
    },
    fixable: null,
    schema: [],
    messages: {
      unusedMessage: 'This message is never used.',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const { scopeManager } = sourceCode;
    const info = utils.getRuleInfo(sourceCode);

    const messageIdsUsed = new Set();
    let contextIdentifiers;
    let shouldPerformUnusedCheck = true;

    const messageIdNodes = utils.getMessageIdNodes(info, scopeManager);
    if (!messageIdNodes) {
      return {};
    }

    // ----------------------------------------------------------------------
    // Public
    // ----------------------------------------------------------------------

    return {
      Program(ast) {
        contextIdentifiers = utils.getContextIdentifiers(scopeManager, ast);
      },

      'Program:exit'() {
        if (shouldPerformUnusedCheck) {
          for (const messageIdNode of messageIdNodes.filter(
            (node) => !messageIdsUsed.has(node.key.name)
          )) {
            context.report({
              node: messageIdNode,
              messageId: 'unusedMessage',
            });
          }
        }
      },

      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          contextIdentifiers.has(node.callee.object) &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'report'
        ) {
          const reportInfo = utils.getReportInfo(node.arguments, context);
          if (!reportInfo) {
            return;
          }

          const reportMessagesAndDataArray =
            utils.collectReportViolationAndSuggestionData(reportInfo);

          for (const { messageId } of reportMessagesAndDataArray.filter(
            (obj) => obj.messageId
          )) {
            const values =
              messageId.type === 'Literal'
                ? [messageId]
                : utils.findPossibleVariableValues(messageId, scopeManager);
            if (values.some((val) => val.type !== 'Literal')) {
              shouldPerformUnusedCheck = false;
            }
            values.forEach((val) => {
              messageIdsUsed.add(val.value);
            });
          }
        }
      },
    };
  },
};
