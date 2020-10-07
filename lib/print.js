/**
 * Copyright (c) 2020 5u9ar (zhuyingda)
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const chalk = require('chalk');
let loop = null;

exports.startProgressFake = () => {
  if (global.IS_TEST) {
    return;
  }

  let symbol;
  const symList = ['|', '/', '-', '\\'];
  let count = 0;
  loop = setInterval(() => {
    symbol = symList[count % 4];
    count++;
    process.stdout.write(chalk.blue('Loading to nodejs.org ') + symbol + '\r');
  }, 300);
};

exports.closeProgressFake = () => {
  if (global.IS_TEST) {
    return;
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  clearInterval(loop);
};

exports.log = {
  debug: (msg) => {
    if (global.IS_TEST) {
      return;
    }

    console.log(chalk.blue.bold(msg));
  },
  info: (msg) => {
    if (global.IS_TEST) {
      return;
    }

    console.log(chalk.bold(msg));
  },
  text: (msg) => {
    if (global.IS_TEST) {
      return;
    }

    console.log(chalk.green(msg));
  },
  warn: (msg) => {
    if (global.IS_TEST) {
      return;
    }

    console.log(chalk.yellow.bold(msg));
  },
  error: (err) => {
    if (global.IS_TEST) {
      return;
    }

    console.log(chalk.red.bold(err));
  }
}