declare module 'text-statistics' {
  class TextStatistics {
    constructor(text: string);
    fleschKincaidReadingEase(): number;
    fleschKincaidGradeLevel(): number;
    smogIndex(): number;
    colemanLiauIndex(): number;
    automatedReadabilityIndex(): number;
    averageGradeLevel(): number;
  }
  export = TextStatistics;
}

