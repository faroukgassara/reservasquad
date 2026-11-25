import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = [
    {
        ignores: ['node_modules/**', '.next/**', 'out/**', 'next-env.d.ts', '**/*.generated.tsx'],
    },
    ...nextCoreWebVitals,
    ...nextTypescript,
    prettier,
    {
        // eslint-plugin-react's version auto-detection crashes on ESLint 10.
        settings: { react: { version: '19.2' } },
        rules: {
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'no-unused-vars': 'off',
            'no-undef': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            'import/order': 'off',
            'no-useless-escape': 'off',
            'no-case-declarations': 'off',
            'no-unsafe-optional-chaining': 'off',
        },
    },
];

export default eslintConfig;
