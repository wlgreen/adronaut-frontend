'use client';

import React from 'react';

interface ExperimentHighlightProps {
  text: string;
  className?: string;
}

export const ExperimentHighlight: React.FC<ExperimentHighlightProps> = ({ text, className = '' }) => {
  const experimentKeywords = ['pilot', 'test', 'a/b', 'experiment', 'validate', 'trial', 'measure', 'track', 'monitor'];

  // Split text by experiment keywords and highlight them
  const parts: React.ReactNode[] = [];
  let remainingText = text;
  let index = 0;

  while (remainingText.length > 0) {
    let foundKeyword = false;

    for (const keyword of experimentKeywords) {
      const lowerText = remainingText.toLowerCase();
      const keywordIndex = lowerText.indexOf(keyword);

      if (keywordIndex !== -1) {
        // Add text before keyword
        if (keywordIndex > 0) {
          parts.push(
            <span key={`text-${index++}`}>
              {remainingText.substring(0, keywordIndex)}
            </span>
          );
        }

        // Add highlighted keyword
        parts.push(
          <span key={`keyword-${index++}`} className="bg-amber-500/20 text-amber-300 px-1 rounded">
            {remainingText.substring(keywordIndex, keywordIndex + keyword.length)}
          </span>
        );

        remainingText = remainingText.substring(keywordIndex + keyword.length);
        foundKeyword = true;
        break;
      }
    }

    if (!foundKeyword) {
      parts.push(<span key={`text-${index++}`}>{remainingText}</span>);
      break;
    }
  }

  return <span className={className}>{parts}</span>;
};

export default ExperimentHighlight;
