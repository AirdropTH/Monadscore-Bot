import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import axios from 'axios';
import pkg from 'https-proxy-agent';
const { HttpsProxyAgent } = pkg;

// Function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Countdown timer animation
async function countdown(ms) {
  const seconds = Math.floor(ms / 1000);
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(chalk.grey(`\r⏳ Waiting ${i} seconds... `));
    await delay(1000);
  }
  process.stdout.write('\r' + ' '.repeat(50) + '\r');
}

function getReferralCode() {
  try {
    if (!fs.existsSync('code.txt')) {
      return "he2DnOfw"; 
    }
    const code = fs.readFileSync('code.txt', 'utf8').trim();
    return code || "he2DnOfw";
  } catch (error) {
    console.error(chalk.red(`Error reading referral code: ${error.message}`));
    return "he2DnOfw";
  }
}

function readProxiesFromFile(filename) {
  try {
    if (!fs.existsSync(filename)) {
      console.log(chalk.yellow(`File ${filename} not found. Running without proxies.`));
      return [];
    }
    const data = fs.readFileSync(filename, 'utf8');
    return data.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error(chalk.red(`Error reading proxies file: ${error.message}`));
    return [];
  }
}

function createProxyAgent(proxyString) {
  try {
    if (!proxyString || proxyString.trim() === '') return null;
    
    if (proxyString.startsWith('http://') || proxyString.startsWith('https://')) {
      return new HttpsProxyAgent(proxyString);
    } else {
      return new HttpsProxyAgent(`http://${proxyString}`);
    }
  } catch (error) {
    console.error(chalk.red(`Error creating proxy agent: ${error.message}`));
    return null;
  }
}

const axiosWithProxy = async (url, options = {}, proxyAgent = null) => {
  const MAX_RETRIES = 10;
  const DELAY_MS = 2000;
  const DEFAULT_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Origin": "https://monadscore.xyz",
    "Referer": "https://monadscore.xyz",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Priority": "u=1, i"
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const makeRequest = async (attempt) => {
    try {
      const config = {
        ...options,
        headers: { ...DEFAULT_HEADERS, ...options.headers },
        ...(proxyAgent && { httpsAgent: proxyAgent })
      };
      return await axios(url, config);
    } catch (error) {
      console.error(chalk.red(`Axios error (attempt ${attempt + 1}/${MAX_RETRIES}): ${error.message}`));
      if (error.response?.data) {
        console.error(chalk.red("Response data:", JSON.stringify(error.response.data, null, 2)));
      }
      if (attempt === MAX_RETRIES - 1) throw error;
      await delay(DELAY_MS);
      return null;
    }
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await makeRequest(attempt);
    if (response) return response;
  }
};

// Logging utility
const logger = {
  log: (message, type) => {
    const types = {
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      custom: chalk.cyan
    };
    console.log(types[type] ? types[type](message) : message);
  }
};

async function getUserInfo(wallet, proxyAgent, token) {
  const url = "https://mscore.onrender.com/user/login";
  const payload = { wallet: wallet };

  const options = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Referer": "https://monadscore.xyz",
      'Authorization': `Bearer ${token}`,
    },
    data: payload
  };
  
  try {
    const response = await axiosWithProxy(url, options, proxyAgent);
    if (response.status === 200 && response.data.success) {
      return { success: true, data: response.data.user };
    } else {
      return { success: false, error: response.data.message || "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data.message : error.message
    };
  }
}

async function claimTask(wallet, taskId, proxyAgent, token) {
  const url = "https://mscore.onrender.com/user/claim-task";
  const payload = { wallet: wallet, taskId: taskId };

  const options = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Referer": "https://monadscore.xyz",
      'Authorization': `Bearer ${token}`,
    },
    data: payload
  };

  try {
    const response = await axiosWithProxy(url, options, proxyAgent);
    if (response.status === 200) {
      let message;
      switch(taskId) {
        case "task001":
          message = "Successfully completed task Follow MonadScore on X";
          break;
        case "task002":
          message = "Successfully completed task Like this post";
          break;
        case "task003":
          message = "Successfully completed task Retweet this post";
          break;
        default:
          message = `Successfully claimed task ${taskId}`;
      }
      logger.log(message, 'success');
      return { success: true };
    } else {
      return { success: false, error: response.data.message || "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data.message : error.message
    };
  }
}

async function handleTasks(wallet, claimedTasks, proxyAgent, token) {
  const requiredTasks = ["task001", "task002", "task003", "task101"];
  const missingTasks = requiredTasks.filter(task => !claimedTasks.includes(task));

  if (missingTasks.length === 0) {
    logger.log("All required tasks have been completed", 'success');
    return;
  }

  logger.log(`Need to complete ${missingTasks.length} tasks: ${missingTasks.join(', ')}`, 'info');
  
  for (const taskId of missingTasks) {
    const result = await claimTask(wallet, taskId, proxyAgent, token);
    if (!result.success) {
      logger.log(`Error claiming task ${taskId}: ${result.error}`, 'error');
    }
    await countdown(3000);
  }
}

async function updateStartTime(wallet, proxyAgent, token) {
  const url = "https://mscore.onrender.com/user/update-start-time";
  const currentTime = Date.now();
  const payload = { wallet: wallet, startTime: currentTime };

  const options = {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "Referer": "https://monadscore.xyz",
      'Authorization': `Bearer ${token}`,
    },
    data: payload
  };
  
  try {
    const response = await axiosWithProxy(url, options, proxyAgent);
    return { 
      success: true, 
      data: response.data,
      startTime: currentTime
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response ? error.response.data.message : error.message 
    };
  }
}

async function checkAndUpdateStartTime(wallet, startTime, proxyAgent, token) {
  const currentTime = Date.now();
  const timeLimit = 8 * 60 * 60 * 1000 + 5 * 60 * 1000;
  
  if (!startTime || startTime === 0) {
    logger.log(`Start Time = 0, need to update...`, 'warning');
    const updateResult = await updateStartTime(wallet, proxyAgent, token);
    
    if (updateResult.success) {
      logger.log(`Node run successful!`, 'success');
      logger.log(`New Start Time: ${updateResult.startTime}`, 'custom');
      return { ...updateResult, nextUpdate: updateResult.startTime + timeLimit };
    } else {
      logger.log(`Unable to update start time: ${updateResult.error}`, 'error');
      return updateResult;
    }
  } else {
    const timeDiff = currentTime - startTime;
    
    if (timeDiff < timeLimit) {
      const remainingTime = timeLimit - timeDiff;
      const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      
      logger.log(`Node is running - ${remainingHours}h ${remainingMinutes}m remaining until next update`, 'success');
      return { success: true, status: "running", remainingTime, nextUpdate: startTime + timeLimit };
    } else {
      logger.log(`More than 8 hours and 5 minutes have passed since last update, need to update again...`, 'warning');
      const updateResult = await updateStartTime(wallet, proxyAgent);
      
      if (updateResult.success) {
        logger.log(`Successfully updated start time!`, 'success');
        logger.log(`New Start Time: ${updateResult.startTime}`, 'custom');
        return { ...updateResult, nextUpdate: updateResult.startTime + timeLimit };
      } else {
        logger.log(`Unable to update start time: ${updateResult.error}`, 'error');
        return updateResult;
      }
    }
  }
}

async function getAccounts() {
  try {
      const tokenData = fs.readFileSync('accounts.txt', 'utf8'); // Synchronous read
      const tokens = tokenData.split('\n')
          .map(token => token.trim())
          .filter(token => token.length > 0);
      
      if (tokens.length === 0) {
          throw new Error('No address found in accounts.txt');
      }
      return tokens;
  } catch (error) {
      console.error(chalk.red.bold(`[ERROR] Failed to read address from accounts.txt: ${error.message}`));
      throw error;
  }
}

async function main() {
  const proxies = readProxiesFromFile('proxies.txt');
  console.log(chalk.green(`- Loaded ${proxies.length} proxies -`));
  console.log(chalk.green(`- Using referral code: ${getReferralCode()} -\n`));

  const ref = getReferralCode(); // Fixed: Removed incorrect destructuring
  const accounts = await getAccounts();

  let successCount = 0;
  let failCount = 0;
  const nextUpdates = [];

  for (let i = 0; i < accounts.length; i++) {
    const separator = chalk.gray("-".repeat(70));
    console.log(`\n${separator}`);
    console.log(chalk.white(`- Processing wallet ${i + 1}/${accounts.length} -`));
    
    let proxyAgent = null;
    if (proxies.length > 0) {
      const proxyString = proxies[i % proxies.length];
      proxyAgent = createProxyAgent(proxyString);
      console.log(chalk.green(`- Using proxy: ${proxyString} -`));
    }

    let walletAddress = accounts[i];

    const payload = { wallet: walletAddress, invite: ref };
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Referer": "https://monadscore.xyz"
      },
      data: payload
    };
    const regSpinner = ora('🚀 Sending data to API...').start();

    try {
      const response = await axiosWithProxy('https://mscore.onrender.com/user', options, proxyAgent);

      if (response.data.message === 'Success') {
        regSpinner.succeed(chalk.greenBright('✅ Successfully registered account'));
        successCount++;
        const token = response.data.token;
        const userInfo = await getUserInfo(walletAddress, proxyAgent, token);
        if (userInfo.success) {
          logger.log('Successfully retrieved wallet information!', 'success');
          logger.log(`Score: ${userInfo.data.score}`, 'custom');
          logger.log(`Total Points: ${userInfo.data.totalPoints}`, 'custom');
          logger.log(`Next Total Points: ${userInfo.data.nextTotalPoints}`, 'custom');
          logger.log(`Start Time: ${userInfo.data.startTime}`, 'custom');
          logger.log(`Active Days: ${userInfo.data.activeDays}`, 'custom');
          logger.log(`Referral Code: ${userInfo.data.referralCode}`, 'info');
          logger.log(`Check-in Points: ${userInfo.data.checkInPoints}`, 'info');
          
          const claimedTasks = userInfo.data.claimedTasks || [];
          await handleTasks(walletAddress, claimedTasks, proxyAgent, token);
          
          const updateResult = await checkAndUpdateStartTime(walletAddress, userInfo.data.startTime, proxyAgent, token);
          if (updateResult.nextUpdate) {
            nextUpdates.push(updateResult.nextUpdate);
          }
        } else {
          logger.log(`Unable to retrieve wallet information: ${userInfo.error}`, 'warning');
        }
      } else {
        regSpinner.fail(chalk.red(`❌ Failed for ${walletAddress}: ${response.data.message}`));
        failCount++;
      }
    } catch (error) {
      regSpinner.fail(chalk.red(`❌ Failed for ${walletAddress}: ${error.message}`));
      failCount++;
    }

    console.log(chalk.yellow(`\n📊 Progress: ${i + 1}/${accounts.length} accounts registered. (✅ Success: ${successCount}, ❌ Failed: ${failCount})`));

    if (i < accounts.length - 1) {
      await countdown(Math.floor(Math.random() * (60000 - 30000 + 1)) + 5000);
    }
  }
}

main().catch(error => {
  console.error(chalk.red(`Main execution failed: ${error.message}`));
});