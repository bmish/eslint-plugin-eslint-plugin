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
      description:
        'disallow `messageId`s that are missing from `meta.messages`',
      category: 'Rules',
      recommended: false,
      url: 'https://github.com/not-an-aardvark/eslint-plugin-eslint-plugin/tree/HEAD/docs/rules/no-missing-message-ids.md',
    },
    fixable: null,
    schema: [],
    messages: {
      missingMessage: '`meta.messages` is missing this `messageId`.',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const { scopeManager } = sourceCode;
    const ruleInfo = utils.getRuleInfo(sourceCode);

    const messagesNode = utils.getMessagesNode(ruleInfo, scopeManager);

    let contextIdentifiers;

    // ----------------------------------------------------------------------
    // Public
    // ----------------------------------------------------------------------

    if (!messagesNode || messagesNode.type !== 'ObjectExpression') {
      return {};
    }

    return {
      Program(ast) {
        contextIdentifiers = utils.getContextIdentifiers(scopeManager, ast);
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

            values.forEach((val) => {
              if (
                val.type === 'Literal' &&
                !utils.getMessageIdNodeById(val.value, ruleInfo, scopeManager)
              )
                context.report({
                  node: val,
                  messageId: 'missingMessage',
                });
            });
          }
        }
      },
    };
  },
};
