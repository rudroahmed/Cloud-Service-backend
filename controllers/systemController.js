const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Get System Info (e.g., server details)
exports.systemInfo = async (req, res) => {
  try {
    // Fetching system info using Node.js os module
    const systemInfo = {
      platform: os.platform(),  // e.g., 'linux', 'win32', 'darwin'
      arch: os.arch(),          // e.g., 'x64', 'arm'
      cpus: os.cpus(),          // CPU information
      memory: {
        totalMemory: os.totalmem(), // Total memory in bytes
        freeMemory: os.freemem(),  // Free memory in bytes
      },
      uptime: os.uptime(),       // System uptime in seconds
    };

    res.json(systemInfo);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching system info' });
  }
};

// System Health Check (e.g., check CPU usage, disk space, etc.)
exports.systemHealth = async (req, res) => {
  try {
    // For simplicity, we are checking CPU usage and disk space.
    const cpuUsage = os.loadavg(); // 1, 5, and 15 minute load averages
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const diskSpace = await getDiskSpace(); // Placeholder function for disk space check

    // A simple health check based on system stats
    const healthStatus = {
      cpuUsage: cpuUsage[0],  // 1-minute average
      memoryUsage: {
        used: usedMemory,
        total: totalMemory,
        free: freeMemory,
        percentage: ((usedMemory / totalMemory) * 100).toFixed(2),
      },
      diskSpace,
      status: 'healthy',  // A basic assumption; could be expanded for real-time health monitoring
    };

    res.json(healthStatus);
  } catch (err) {
    res.status(500).json({ message: 'Error checking system health' });
  }
};

// System Backup (Placeholder: This can be extended to perform actual backup tasks)
exports.backup = async (req, res) => {
  try {
    // Placeholder for backup logic
    const backupDirectory = path.join(__dirname, '..', 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Formatting timestamp for filename
    const backupFile = path.join(backupDirectory, `backup-${timestamp}.tar`);

    // Perform system backup (placeholder - using tar as an example)
    exec(`tar -cvf ${backupFile} /path/to/data`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ message: 'Backup failed', error: stderr });
      }

      res.json({ message: 'Backup created successfully', backupFile });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error performing backup' });
  }
};

// Fetch System Logs (e.g., log file data, system logs)
exports.logs = async (req, res) => {
  try {
    // Read the system logs or application logs (e.g., logs in a specific directory)
    const logFilePath = path.join(__dirname, '..', 'logs', 'system.log');

    // Check if the log file exists
    if (!fs.existsSync(logFilePath)) {
      return res.status(404).json({ message: 'Log file not found' });
    }

    // Read the logs and return them as a response
    fs.readFile(logFilePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ message: 'Error reading logs' });
      }
      res.json({ logs: data });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching system logs' });
  }
};

// Helper function to get disk space usage (for system health)
async function getDiskSpace() {
  // Using a simple placeholder for disk space (this could be expanded with more advanced checks)
  try {
    const { execSync } = require('child_process');
    const result = execSync('df -h /').toString();
    const lines = result.split('\n');
    const diskSpace = lines[1].split(/\s+/);

    return {
      total: diskSpace[1],
      used: diskSpace[2],
      available: diskSpace[3],
      percentage: diskSpace[4],
    };
  } catch (err) {
    console.error('Error fetching disk space', err);
    return { total: 'unknown', used: 'unknown', available: 'unknown', percentage: 'unknown' };
  }
}