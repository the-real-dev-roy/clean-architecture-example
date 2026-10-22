// Автоматическая проверка границ слоёв.
// Правило no-restricted-imports фиксирует ту самую «красную линию»,
// о которой написано в комментарии к CheckoutBasketUseCase:
//   - domain/      — ни NestJS, ни application, ни adapters, ни внешних библиотек;
//   - application/ — ни adapters, ни NestJS, кроме двух декораторов Injectable и Inject.
// Нарушил границу — `npm run lint` упадёт, и это увидят на ревью и в CI.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  ...tseslint.configs.recommended,

  // Domain: самое внутреннее кольцо, ни от чего не зависит.
  {
    files: ['services/*/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*'],
              message: 'Домен не знает о фреймворке.',
            },
            {
              group: ['**/application/**', '**/adapters/**'],
              message: 'Правило зависимостей: domain не импортирует внешние слои.',
            },
            {
              // Всё, что не начинается с точки, — внешний пакет.
              regex: '^[^.]',
              message: 'Домен не зависит от внешних библиотек — только от собственного кода.',
            },
          ],
        },
      ],
    },
  },

  // Application: зависит от domain и от двух декораторов Nest (осознанный компромисс).
  {
    files: ['services/*/src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              allowImportNames: ['Injectable', 'Inject'],
              message:
                'В application из Nest разрешены только Injectable и Inject. ' +
                'Logger, HttpException и т. п. — признак того, что фреймворк проникает в логику.',
            },
          ],
          patterns: [
            {
              group: ['@nestjs/*', '!@nestjs/common'],
              message: 'В application из Nest разрешён только @nestjs/common (Injectable, Inject).',
            },
            {
              group: ['**/adapters/**'],
              message: 'Правило зависимостей: application зависит от портов, а не от адаптеров.',
            },
          ],
        },
      ],
    },
  },
);
