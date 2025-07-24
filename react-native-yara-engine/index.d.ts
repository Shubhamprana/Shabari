export interface YaraScanResult {
  isSafe: boolean;
  threatName: string;
  threatCategory: string;
  severity: string;
  matchedRules: string[];
  scanTime: number;
  fileSize: number;
  scanEngine: string;
  details: string;
}

export interface YaraEngineInterface {
  /**
   * Initialize the YARA engine with default rules
   * @returns Promise that resolves with success message
   */
  initializeEngine(): Promise<string>;

  /**
   * Load YARA rules from a file path
   * @param rulesPath - Absolute path to the rules file
   * @returns Promise that resolves with success message
   */
  loadRules(rulesPath: string): Promise<string>;

  /**
   * Scan a file for malware using loaded YARA rules
   * @param filePath - Absolute path to the file to scan
   * @returns Promise that resolves with scan results
   */
  scanFile(filePath: string): Promise<YaraScanResult>;

  /**
   * Scan memory data for malware using loaded YARA rules
   * @param data - Array of bytes to scan
   * @returns Promise that resolves with scan results
   */
  scanMemory(data: number[]): Promise<YaraScanResult>;

  /**
   * Update YARA rules with new rule content
   * @param rulesContent - YARA rules as string content
   * @returns Promise that resolves with success message
   */
  updateRules(rulesContent: string): Promise<string>;

  /**
   * Get the version of the YARA engine
   * @returns Promise that resolves with version string
   */
  getEngineVersion(): Promise<string>;

  /**
   * Get the number of currently loaded rules
   * @returns Promise that resolves with rules count
   */
  getLoadedRulesCount(): Promise<number>;

  /**
   * Check if the native YARA library is available
   * @returns Promise that resolves with boolean indicating native availability
   */
  isNativeEngineAvailable(): Promise<boolean>;
}

declare const YaraEngine: YaraEngineInterface;
export default YaraEngine;

