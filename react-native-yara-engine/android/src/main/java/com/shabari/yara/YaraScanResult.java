package com.shabari.yara;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import java.util.List;
import java.util.ArrayList;

public class YaraScanResult {
    private boolean isSafe;
    private String threatName;
    private String threatCategory;
    private String severity;
    private List<String> matchedRules;
    private int scanTime;
    private long fileSize;
    private String scanEngine;
    private String details;

    public YaraScanResult() {
        this.isSafe = true;
        this.threatName = "";
        this.threatCategory = "";
        this.severity = "";
        this.matchedRules = new ArrayList<>();
        this.scanTime = 0;
        this.fileSize = 0;
        this.scanEngine = "YARA v4.5.0";
        this.details = "";
    }

    public YaraScanResult(boolean isSafe, String threatName, String threatCategory, 
                         String severity, List<String> matchedRules, int scanTime, 
                         long fileSize, String scanEngine, String details) {
        this.isSafe = isSafe;
        this.threatName = threatName != null ? threatName : "";
        this.threatCategory = threatCategory != null ? threatCategory : "";
        this.severity = severity != null ? severity : "";
        this.matchedRules = matchedRules != null ? matchedRules : new ArrayList<>();
        this.scanTime = scanTime;
        this.fileSize = fileSize;
        this.scanEngine = scanEngine != null ? scanEngine : "YARA v4.5.0";
        this.details = details != null ? details : "";
    }

    // Getters
    public boolean isSafe() {
        return isSafe;
    }

    public String getThreatName() {
        return threatName;
    }

    public String getThreatCategory() {
        return threatCategory;
    }

    public String getSeverity() {
        return severity;
    }

    public List<String> getMatchedRules() {
        return matchedRules;
    }

    public int getScanTime() {
        return scanTime;
    }

    public long getFileSize() {
        return fileSize;
    }

    public String getScanEngine() {
        return scanEngine;
    }

    public String getDetails() {
        return details;
    }

    // Setters
    public void setSafe(boolean safe) {
        this.isSafe = safe;
    }

    public void setThreatName(String threatName) {
        this.threatName = threatName != null ? threatName : "";
    }

    public void setThreatCategory(String threatCategory) {
        this.threatCategory = threatCategory != null ? threatCategory : "";
    }

    public void setSeverity(String severity) {
        this.severity = severity != null ? severity : "";
    }

    public void setMatchedRules(List<String> matchedRules) {
        this.matchedRules = matchedRules != null ? matchedRules : new ArrayList<>();
    }

    public void addMatchedRule(String ruleName) {
        if (ruleName != null && !ruleName.trim().isEmpty()) {
            this.matchedRules.add(ruleName);
        }
    }

    public void setScanTime(int scanTime) {
        this.scanTime = scanTime;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public void setScanEngine(String scanEngine) {
        this.scanEngine = scanEngine != null ? scanEngine : "YARA v4.5.0";
    }

    public void setDetails(String details) {
        this.details = details != null ? details : "";
    }

    // Convert to WritableMap for React Native
    public WritableMap toWritableMap() {
        WritableMap map = Arguments.createMap();
        
        map.putBoolean("isSafe", this.isSafe);
        map.putString("threatName", this.threatName);
        map.putString("threatCategory", this.threatCategory);
        map.putString("severity", this.severity);
        map.putInt("scanTime", this.scanTime);
        map.putDouble("fileSize", (double) this.fileSize);
        map.putString("scanEngine", this.scanEngine);
        map.putString("details", this.details);

        // Convert matched rules list to WritableArray
        WritableArray rulesArray = Arguments.createArray();
        for (String rule : this.matchedRules) {
            rulesArray.pushString(rule);
        }
        map.putArray("matchedRules", rulesArray);

        return map;
    }

    // Create a safe scan result (no threats detected)
    public static YaraScanResult createSafeResult(int scanTime, long fileSize) {
        YaraScanResult result = new YaraScanResult();
        result.setSafe(true);
        result.setScanTime(scanTime);
        result.setFileSize(fileSize);
        result.setDetails("No threats detected");
        return result;
    }

    // Create a threat detected result
    public static YaraScanResult createThreatResult(String threatName, String category, 
                                                   String severity, List<String> matchedRules, 
                                                   int scanTime, long fileSize, String details) {
        YaraScanResult result = new YaraScanResult();
        result.setSafe(false);
        result.setThreatName(threatName);
        result.setThreatCategory(category);
        result.setSeverity(severity);
        result.setMatchedRules(matchedRules);
        result.setScanTime(scanTime);
        result.setFileSize(fileSize);
        result.setDetails(details);
        return result;
    }

    @Override
    public String toString() {
        return "YaraScanResult{" +
                "isSafe=" + isSafe +
                ", threatName='" + threatName + '\'' +
                ", threatCategory='" + threatCategory + '\'' +
                ", severity='" + severity + '\'' +
                ", matchedRules=" + matchedRules +
                ", scanTime=" + scanTime +
                ", fileSize=" + fileSize +
                ", scanEngine='" + scanEngine + '\'' +
                ", details='" + details + '\'' +
                '}';
    }
}

