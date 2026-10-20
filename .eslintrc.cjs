module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/', '.expo/', 'ios/', 'android/', 'supabase/functions/', 'website/', 'assets/'],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
  },
};
