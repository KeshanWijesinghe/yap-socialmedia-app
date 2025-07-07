const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");

const execAsync = promisify(exec);

/**
 * Check if text contains toxic content using Python CLI
 * @param {string} text - Text to check
 * @returns {Promise<{isToxic: boolean, confidence: number}>}
 */
const checkToxicity = async (text) => {
  try {
    // Escape text for command line
    const escapedText = text.replace(/"/g, '\\"').replace(/`/g, "\\`");
    const scriptPath = path.join(__dirname, "..", "check_toxicity_cli.py");

    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${escapedText}"`,
      { timeout: 5000 }
    );

    if (stderr && !stderr.includes("InconsistentVersionWarning")) {
      console.error("Python stderr:", stderr);
    }

    const result = JSON.parse(stdout.trim());

    if (result.success) {
      return {
        isToxic: result.is_toxic,
        confidence: result.confidence,
      };
    }

    // If check unsuccessful, default to non-toxic
    console.error("Toxicity check unsuccessful:", result.error);
    return {
      isToxic: false,
      confidence: 0,
    };
  } catch (error) {
    console.error("Toxicity check error:", error.message);
    // If service is unavailable, default to non-toxic to not block users
    return {
      isToxic: false,
      confidence: 0,
    };
  }
};

module.exports = { checkToxicity };
