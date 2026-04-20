declare module 'kuroshiro' {
  class Kuroshiro {
    constructor();
    init(analyzer: any): Promise<void>;
    convert(text: string, options?: any): Promise<string>;
  }
  export default Kuroshiro;
}

declare module 'kuroshiro-analyzer-kuromoji' {
  class KuromojiAnalyzer {
    constructor(options?: { dictPath: string });
  }
  export default KuromojiAnalyzer;
}
