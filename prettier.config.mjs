export default {
  // 基本設定
  semi: true, // セミコロンを追加
  singleQuote: true, // シングルクォートを使用
  quoteProps: 'as-needed', // 必要な場合のみプロパティをクォート
  trailingComma: 'all', // 末尾カンマを常に付ける
  tabWidth: 2, // インデント幅
  useTabs: false, // スペースを使用（タブではない）
  printWidth: 120, // 1行の最大文字数

  // JavaScript/TypeScript設定
  arrowParens: 'always', // アロー関数の引数を常に括弧で囲む
  bracketSpacing: true, // オブジェクトリテラルの括弧内にスペース
  bracketSameLine: false, // JSXの最後の>を次の行に配置

  // JSX設定
  jsxSingleQuote: true, // JSXでシングルクォートを使用

  // その他の設定
  endOfLine: 'lf', // 改行コードはLF
  insertPragma: false, // @formatプラグマを挿入しない
  requirePragma: false, // @formatプラグマを要求しない
  proseWrap: 'preserve', // マークダウンの改行を保持

  // ファイル固有の設定
  overrides: [
    {
      files: '*.{css, scss}',
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
