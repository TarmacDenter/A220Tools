import { globalIgnores } from 'eslint/config'
import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'

const preferDefineModelRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer defineModel() over manual modelValue/update:modelValue boilerplate in <script setup>.',
    },
    messages: {
      preferDefineModel:
        'Prefer defineModel() instead of manual modelValue/update:modelValue wiring.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node: CallExpression) {
        const callee = node.callee
        if (callee.type !== 'Identifier') return

        if (callee.name !== 'defineProps' && callee.name !== 'defineEmits') return

        const text = context.sourceCode.getText(node)
        const hasManualVModel =
          /defineProps\s*<[\s\S]*\bmodelValue\b[\s\S]*>\s*\(/.test(text) ||
          /defineEmits\s*<[\s\S]*['"]update:modelValue['"][\s\S]*>\s*\(/.test(text)

        if (hasManualVModel) {
          context.report({ node, messageId: 'preferDefineModel' })
        }
      },
    }
  },
}

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/.nuxt/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['**/__tests__/*'],
  },

  {
    files: [
      'components/**/*.{vue,ts,mts,tsx}',
      'composables/**/*.{vue,ts,mts,tsx}',
      'constants/**/*.{vue,ts,mts,tsx}',
      'types/**/*.{vue,ts,mts,tsx}',
      'utils/**/*.{vue,ts,mts,tsx}',
      'pages/**/*.{vue,ts,mts,tsx}',
    ],
    plugins: {
      local: {
        rules: {
          'prefer-define-model': preferDefineModelRule,
        },
      },
    },
    rules: {
      'local/prefer-define-model': 'error',
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
