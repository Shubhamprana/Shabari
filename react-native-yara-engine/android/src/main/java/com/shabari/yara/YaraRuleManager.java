package com.shabari.yara;

import android.util.Log;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.regex.Pattern;

public class YaraRuleManager {
    private static final String TAG = "YaraRuleManager";
    
    // Basic YARA rule validation pattern
    private static final Pattern RULE_PATTERN = Pattern.compile(
        "rule\\s+\\w+\\s*\\{.*?\\}", 
        Pattern.DOTALL | Pattern.CASE_INSENSITIVE
    );

    public String loadRulesFromFile(String filePath) {
        StringBuilder rulesContent = new StringBuilder();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                rulesContent.append(line).append("\n");
            }
            
            String content = rulesContent.toString();
            if (validateRulesContent(content)) {
                Log.d(TAG, "Successfully loaded rules from file: " + filePath);
                return content;
            } else {
                Log.e(TAG, "Invalid YARA rules content in file: " + filePath);
                return null;
            }
            
        } catch (IOException e) {
            Log.e(TAG, "Error reading rules file: " + filePath, e);
            return null;
        }
    }

    public boolean validateRulesContent(String rulesContent) {
        if (rulesContent == null || rulesContent.trim().isEmpty()) {
            Log.e(TAG, "Rules content is empty");
            return false;
        }

        try {
            // Basic validation - check if content contains at least one rule
            if (!RULE_PATTERN.matcher(rulesContent).find()) {
                Log.e(TAG, "No valid YARA rules found in content");
                return false;
            }

            // Check for basic syntax requirements
            if (!rulesContent.contains("rule ")) {
                Log.e(TAG, "No 'rule' keyword found");
                return false;
            }

            if (!rulesContent.contains("condition:")) {
                Log.e(TAG, "No 'condition:' section found");
                return false;
            }

            // Count braces to ensure they're balanced
            int openBraces = 0;
            int closeBraces = 0;
            for (char c : rulesContent.toCharArray()) {
                if (c == '{') openBraces++;
                if (c == '}') closeBraces++;
            }

            if (openBraces != closeBraces) {
                Log.e(TAG, "Unbalanced braces in YARA rules");
                return false;
            }

            Log.d(TAG, "YARA rules content validation passed");
            return true;

        } catch (Exception e) {
            Log.e(TAG, "Exception during rules validation", e);
            return false;
        }
    }

    public int countRules(String rulesContent) {
        if (rulesContent == null || rulesContent.trim().isEmpty()) {
            return 0;
        }

        try {
            int count = 0;
            String[] lines = rulesContent.split("\n");
            
            for (String line : lines) {
                String trimmedLine = line.trim();
                if (trimmedLine.startsWith("rule ") && trimmedLine.contains("{")) {
                    count++;
                }
            }
            
            Log.d(TAG, "Found " + count + " rules in content");
            return count;
            
        } catch (Exception e) {
            Log.e(TAG, "Exception counting rules", e);
            return 0;
        }
    }

    public String extractRuleName(String ruleLine) {
        try {
            if (ruleLine == null || !ruleLine.trim().startsWith("rule ")) {
                return null;
            }

            String trimmed = ruleLine.trim();
            String[] parts = trimmed.split("\\s+");
            
            if (parts.length >= 2) {
                String ruleName = parts[1];
                // Remove any trailing characters like '{'
                if (ruleName.contains("{")) {
                    ruleName = ruleName.substring(0, ruleName.indexOf("{"));
                }
                return ruleName.trim();
            }
            
            return null;
            
        } catch (Exception e) {
            Log.e(TAG, "Exception extracting rule name", e);
            return null;
        }
    }

    public boolean isValidRuleName(String ruleName) {
        if (ruleName == null || ruleName.trim().isEmpty()) {
            return false;
        }

        // YARA rule names must start with a letter or underscore
        // and can contain letters, digits, and underscores
        return ruleName.matches("^[a-zA-Z_][a-zA-Z0-9_]*$");
    }
}

