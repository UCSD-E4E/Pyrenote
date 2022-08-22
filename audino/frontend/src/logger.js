import axios from 'axios';

/**
 * Sends error messages to server
 * This way we can see browser errors without needing users to open
 * the inspect tool!
 */
class Logger {
  constructor(logLvl) {
    this.logLvl = logLvl;
  }

  /**
   * function to give server error info from frontend
   * @param message str containing error message
   */
  sendLog(message) {
    axios({
      url: '/api/log_msg',
      method: 'POST',
      data: {
        message,
        logLvl: this.logLvl
      }
    });
  }
}

const errorLogger = new Logger('error');
const infoLogger = new Logger('info');

export default Logger;
export { errorLogger, infoLogger };
