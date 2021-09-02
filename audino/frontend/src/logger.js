import axios from 'axios';

class Logger {
  constructor(logLvl) {
    this.logLvl = logLvl;
  }

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
