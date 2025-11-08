# GitHub Actions Workflows

## Android Build Workflow

This workflow automatically builds your Android app on every push to main/master branch.

### How to Use:

1. **Automatic Builds**: Push to main/master branch
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Manual Build**: Go to GitHub Actions tab → Select "Android Build" → Click "Run workflow"

3. **Download APK**: 
   - Go to Actions tab
   - Click on the workflow run
   - Scroll down to "Artifacts"
   - Download "app-release"

### Build Status:
Check the status badge at the top of your README to see if the build passed.

### Troubleshooting:
- If build fails, click on the failed workflow to see detailed logs
- Check the "Build Android Release APK" step for errors

