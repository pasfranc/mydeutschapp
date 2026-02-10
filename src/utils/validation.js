const normalize = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const levenshtein = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const calculateSimilarity = (str1, str2) => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshtein(str1, str2) / maxLen;
};

const findDifferences = (userAnswer, correctAnswer) => {
  const userWords = userAnswer.toLowerCase().split(/\s+/);
  const correctWords = correctAnswer.toLowerCase().split(/\s+/);
  const differences = [];

  for (let i = 0; i < Math.max(userWords.length, correctWords.length); i++) {
    if (userWords[i] !== correctWords[i]) {
      differences.push({
        user: userWords[i] || '(mancante)',
        correct: correctWords[i] || '(extra)',
      });
    }
  }
  return differences.slice(0, 3);
};

export const validateTranslation = (userAnswer, correctAnswer) => {
  if (!userAnswer || userAnswer.trim() === '') {
    return {
      status: 'wrong',
      message: 'Scrivi una traduzione',
      differences: [],
    };
  }

  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);
  const similarity = calculateSimilarity(userNorm, correctNorm);

  if (similarity >= 0.95) {
    return { status: 'perfect', message: 'Perfetto!', differences: [] };
  } else if (similarity >= 0.8) {
    return {
      status: 'close',
      message: 'Quasi corretto!',
      differences: findDifferences(userAnswer, correctAnswer),
    };
  } else {
    return { status: 'wrong', message: 'Non corretto', differences: [] };
  }
};
