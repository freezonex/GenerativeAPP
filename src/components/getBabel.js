import * as Babel from '@babel/standalone';

export const transpileCode = (code) => {
  try {
    const transpiled = Babel.transform(code, {
      presets: ['env', 'react'],
    }).code;
    return transpiled;
  } catch (error) {
    console.error('Error transpiling code:', error);
    throw error;
  }
};
